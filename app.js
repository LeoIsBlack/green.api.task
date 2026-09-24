/**
 * GREEN-API Integration Console Logic
 * Implementation of: getSettings, getStateInstance, sendMessage, sendFileByUrl
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const idInstanceInput = document.getElementById('idInstance');
  const apiTokenInstanceInput = document.getElementById('apiTokenInstance');
  const apiUrlHostInput = document.getElementById('apiUrlHost');
  const btnToggleToken = document.getElementById('btnToggleToken');
  const eyeIcon = document.getElementById('eyeIcon');

  const btnGetSettings = document.getElementById('btnGetSettings');
  const btnGetStateInstance = document.getElementById('btnGetStateInstance');

  const chatIdMessageInput = document.getElementById('chatIdMessage');
  const messageTextInput = document.getElementById('messageText');
  const btnSendMessage = document.getElementById('btnSendMessage');

  const chatIdFileInput = document.getElementById('chatIdFile');
  const fileUrlInput = document.getElementById('fileUrl');
  const btnSendFileByUrl = document.getElementById('btnSendFileByUrl');

  const responseOutput = document.getElementById('responseOutput');
  const statusTag = document.getElementById('statusTag');
  const durationTag = document.getElementById('durationTag');
  const btnCopyResponse = document.getElementById('btnCopyResponse');
  const copyFeedback = document.getElementById('copyFeedback');
  const btnRefresh = document.getElementById('btnRefresh');
  const connectionBadgeText = document.getElementById('connectionBadgeText');
  const toastContainer = document.getElementById('toastContainer');

  // LocalStorage Keys
  const STORAGE_KEYS = {
    ID_INSTANCE: 'green_api_id_instance',
    API_TOKEN: 'green_api_token_instance',
    API_HOST: 'green_api_host'
  };

  // 1. Restore saved credentials
  restoreCredentials();

  // 2. Event Listeners for Saving Credentials
  idInstanceInput.addEventListener('input', () => {
    localStorage.setItem(STORAGE_KEYS.ID_INSTANCE, idInstanceInput.value.trim());
  });

  apiTokenInstanceInput.addEventListener('input', () => {
    localStorage.setItem(STORAGE_KEYS.API_TOKEN, apiTokenInstanceInput.value.trim());
  });

  apiUrlHostInput.addEventListener('input', () => {
    localStorage.setItem(STORAGE_KEYS.API_HOST, apiUrlHostInput.value.trim());
  });

  // 3. Password Visibility Toggle
  btnToggleToken.addEventListener('click', () => {
    const isPassword = apiTokenInstanceInput.type === 'password';
    apiTokenInstanceInput.type = isPassword ? 'text' : 'password';
    eyeIcon.innerHTML = isPassword
      ? `<path d="m2 2 20 20"/><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>`
      : `<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>`;
  });

  // 4. Method Action Listeners
  btnGetSettings.addEventListener('click', () => handleGetSettings());
  btnGetStateInstance.addEventListener('click', () => handleGetStateInstance());
  btnSendMessage.addEventListener('click', () => handleSendMessage());
  btnSendFileByUrl.addEventListener('click', () => handleSendFileByUrl());

  // 5. Copy Response Listener
  btnCopyResponse.addEventListener('click', () => {
    const text = responseOutput.value;
    if (!text) return;

    navigator.clipboard.writeText(text).then(() => {
      copyFeedback.textContent = 'Скопировано!';
      setTimeout(() => {
        copyFeedback.textContent = 'Копировать';
      }, 2000);
    }).catch(err => {
      showToast('Не удалось скопировать', 'error');
    });
  });

  // 6. Refresh / Reset Listener
  btnRefresh.addEventListener('click', () => {
    responseOutput.value = '';
    statusTag.style.display = 'none';
    durationTag.style.display = 'none';
    btnCopyResponse.style.display = 'none';
    connectionBadgeText.textContent = 'API Ready';
    showToast('Консоль очищена', 'info');
  });

  /**
   * Helper: Restore stored credentials from LocalStorage
   */
  function restoreCredentials() {
    const savedId = localStorage.getItem(STORAGE_KEYS.ID_INSTANCE);
    const savedToken = localStorage.getItem(STORAGE_KEYS.API_TOKEN);
    const savedHost = localStorage.getItem(STORAGE_KEYS.API_HOST);

    if (savedId) idInstanceInput.value = savedId;
    if (savedToken) apiTokenInstanceInput.value = savedToken;
    if (savedHost) apiUrlHostInput.value = savedHost;
  }

  /**
   * Helper: Get base parameters and validate
   */
  function getCredentials() {
    const idInstance = idInstanceInput.value.trim();
    const apiTokenInstance = apiTokenInstanceInput.value.trim();
    let host = apiUrlHostInput.value.trim() || 'https://api.green-api.com';

    // Remove trailing slash if present
    host = host.replace(/\/+$/, '');

    if (!idInstance) {
      showToast('Пожалуйста, введите idInstance', 'error');
      idInstanceInput.focus();
      return null;
    }

    if (!apiTokenInstance) {
      showToast('Пожалуйста, введите ApiTokenInstance', 'error');
      apiTokenInstanceInput.focus();
      return null;
    }

    return { idInstance, apiTokenInstance, host };
  }

  /**
   * Helper: Format WhatsApp Chat ID
   * Appends @c.us if only phone number digits are entered.
   * Keeps existing suffix (@c.us, @g.us, @lid) intact.
   */
  function formatChatId(raw) {
    if (!raw) return '';
    let val = raw.trim();
    if (val.includes('@')) {
      return val;
    }
    // Remove '+' and any non-numeric characters for clean phone number
    const cleaned = val.replace(/\D/g, '');
    return cleaned ? `${cleaned}@c.us` : '';
  }

  /**
   * Helper: Extract filename from URL or fallback
   */
  function extractFileName(url) {
    try {
      const parsedUrl = new URL(url);
      const pathname = parsedUrl.pathname;
      const name = pathname.substring(pathname.lastIndexOf('/') + 1);
      return name || 'file.png';
    } catch {
      const match = url.match(/\/([^\/?#]+)[^\/]*$/);
      return match ? match[1] : 'file.png';
    }
  }

  /**
   * Helper: Set loading state on button
   */
  function setLoading(button, isLoading) {
    if (isLoading) {
      button.classList.add('is-loading');
      button.disabled = true;
    } else {
      button.classList.remove('is-loading');
      button.disabled = false;
    }
  }

  /**
   * Helper: Display method response in the output container
   */
  function displayResponse(status, statusText, data, durationMs) {
    let formattedText = '';
    if (typeof data === 'object' && data !== null) {
      formattedText = JSON.stringify(data, null, 2);
    } else {
      formattedText = String(data);
    }

    responseOutput.value = formattedText;
    btnCopyResponse.style.display = 'inline-flex';

    // Update status badge
    statusTag.style.display = 'inline-block';
    statusTag.className = 'status-tag';
    statusTag.textContent = `${status} ${statusText}`;

    if (status >= 200 && status < 300) {
      statusTag.classList.add('status-success');
      connectionBadgeText.textContent = 'Connected (200 OK)';
    } else if (status >= 400 && status < 500) {
      statusTag.classList.add('status-warn');
      connectionBadgeText.textContent = `Warning (${status})`;
    } else {
      statusTag.classList.add('status-error');
      connectionBadgeText.textContent = `Error (${status})`;
    }

    // Update duration badge
    durationTag.style.display = 'inline-block';
    durationTag.textContent = `${durationMs} ms`;
  }

  /**
   * Universal Request Handler
   */
  async function executeApiRequest(button, method, path, requestBody = null) {
    const creds = getCredentials();
    if (!creds) return;

    const url = `${creds.host}/waInstance${creds.idInstance}/${path}/${creds.apiTokenInstance}`;
    setLoading(button, true);

    const startTime = performance.now();

    try {
      const options = {
        method: method,
        headers: {}
      };

      if (requestBody !== null) {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(requestBody);
      }

      const response = await fetch(url, options);
      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);

      let responseData;
      const contentType = response.headers.get('content-type') || '';

      if (contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        const text = await response.text();
        try {
          responseData = JSON.parse(text);
        } catch {
          responseData = text || { status: response.status, statusText: response.statusText };
        }
      }

      displayResponse(response.status, response.statusText, responseData, duration);

      if (response.ok) {
        showToast(`Успешный вызов ${path}`, 'success');
      } else {
        showToast(`Ошибка ${response.status}: ${response.statusText}`, 'warn');
      }

    } catch (err) {
      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);

      const errorPayload = {
        error: true,
        message: err.message || 'Сетевая ошибка или запрос заблокирован',
        note: 'Проверьте доступность URL и подключение к интернету'
      };

      displayResponse(0, 'Network Error', errorPayload, duration);
      showToast('Ошибка сети при отправке запроса', 'error');
    } finally {
      setLoading(button, false);
    }
  }

  /**
   * Method: getSettings
   * GET {{apiUrl}}/waInstance{{idInstance}}/getSettings/{{apiTokenInstance}}
   */
  async function handleGetSettings() {
    await executeApiRequest(btnGetSettings, 'GET', 'getSettings');
  }

  /**
   * Method: getStateInstance
   * GET {{apiUrl}}/waInstance{{idInstance}}/getStateInstance/{{apiTokenInstance}}
   */
  async function handleGetStateInstance() {
    await executeApiRequest(btnGetStateInstance, 'GET', 'getStateInstance');
  }

  /**
   * Method: sendMessage
   * POST {{apiUrl}}/waInstance{{idInstance}}/sendMessage/{{apiTokenInstance}}
   */
  async function handleSendMessage() {
    const rawChatId = chatIdMessageInput.value.trim();
    const message = messageTextInput.value.trim();

    if (!rawChatId) {
      showToast('Укажите номер телефона получателя', 'error');
      chatIdMessageInput.focus();
      return;
    }

    if (!message) {
      showToast('Введите текст сообщения', 'error');
      messageTextInput.focus();
      return;
    }

    const chatId = formatChatId(rawChatId);
    const body = {
      chatId: chatId,
      message: message
    };

    await executeApiRequest(btnSendMessage, 'POST', 'sendMessage', body);
  }

  /**
   * Method: sendFileByUrl
   * POST {{apiUrl}}/waInstance{{idInstance}}/sendFileByUrl/{{apiTokenInstance}}
   */
  async function handleSendFileByUrl() {
    const rawChatId = chatIdFileInput.value.trim();
    const urlFile = fileUrlInput.value.trim();

    if (!rawChatId) {
      showToast('Укажите номер телефона получателя', 'error');
      chatIdFileInput.focus();
      return;
    }

    if (!urlFile) {
      showToast('Укажите прямую ссылку на файл', 'error');
      fileUrlInput.focus();
      return;
    }

    const chatId = formatChatId(rawChatId);
    const fileName = extractFileName(urlFile);

    const body = {
      chatId: chatId,
      urlFile: urlFile,
      fileName: fileName
    };

    await executeApiRequest(btnSendFileByUrl, 'POST', 'sendFileByUrl', body);
  }

  /**
   * Helper: Toast notifications
   */
  function showToast(message, type = 'info') {
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let iconSvg = '';
    if (type === 'success') {
      iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#25d366" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>`;
    } else if (type === 'error') {
      iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
    } else if (type === 'warn') {
      iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
    } else {
      iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00a884" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
    }

    toast.innerHTML = `${iconSvg}<span>${message}</span>`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'toastOut 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards';
      setTimeout(() => {
        if (toast.parentElement) toast.parentElement.removeChild(toast);
      }, 300);
    }, 3500);
  }
});
