/**
 * GREEN-API Integration Console
 * Реализация методов: getSettings, getStateInstance, sendMessage, sendFileByUrl
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Элементы
  const el = {
    idInstance: document.getElementById('idInstance'),
    apiToken: document.getElementById('apiTokenInstance'),
    apiHost: document.getElementById('apiUrlHost'),
    btnToggleToken: document.getElementById('btnToggleToken'),
    eyeIcon: document.getElementById('eyeIcon'),

    btnGetSettings: document.getElementById('btnGetSettings'),
    btnGetStateInstance: document.getElementById('btnGetStateInstance'),

    chatIdMsg: document.getElementById('chatIdMessage'),
    msgText: document.getElementById('messageText'),
    btnSendMsg: document.getElementById('btnSendMessage'),

    chatIdFile: document.getElementById('chatIdFile'),
    fileUrl: document.getElementById('fileUrl'),
    btnSendFile: document.getElementById('btnSendFileByUrl'),

    responseOutput: document.getElementById('responseOutput'),
    responseEmpty: document.getElementById('responseEmpty'),
    statusTag: document.getElementById('statusTag'),
    durationTag: document.getElementById('durationTag'),
    btnCopy: document.getElementById('btnCopyResponse'),
    btnClear: document.getElementById('btnClearResponse'),
    badgeText: document.getElementById('connectionBadgeText'),
    toastBox: document.getElementById('toastContainer')
  };

  // Ключи LocalStorage для сохранения данных инстанса
  const STORAGE_KEYS = {
    ID: 'green_api_id_instance',
    TOKEN: 'green_api_token_instance',
    HOST: 'green_api_host'
  };

  // 1. Восстановление сохраненных учетных данных
  el.idInstance.value = localStorage.getItem(STORAGE_KEYS.ID) || '';
  el.apiToken.value = localStorage.getItem(STORAGE_KEYS.TOKEN) || '';
  if (localStorage.getItem(STORAGE_KEYS.HOST)) {
    el.apiHost.value = localStorage.getItem(STORAGE_KEYS.HOST);
  }

  // 2. Автосохранение при вводе
  el.idInstance.addEventListener('input', (e) => localStorage.setItem(STORAGE_KEYS.ID, e.target.value.trim()));
  el.apiToken.addEventListener('input', (e) => localStorage.setItem(STORAGE_KEYS.TOKEN, e.target.value.trim()));
  el.apiHost.addEventListener('input', (e) => localStorage.setItem(STORAGE_KEYS.HOST, e.target.value.trim()));

  // 3. Показать / Скрыть пароль токена
  el.btnToggleToken.addEventListener('click', () => {
    const isPass = el.apiToken.type === 'password';
    el.apiToken.type = isPass ? 'text' : 'password';
    el.eyeIcon.innerHTML = isPass
      ? '<path d="m2 2 20 20"/><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>'
      : '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>';
  });

  // 4. Привязка обработчиков методов GREEN-API
  el.btnGetSettings.addEventListener('click', () => executeRequest(el.btnGetSettings, 'GET', 'getSettings'));
  el.btnGetStateInstance.addEventListener('click', () => executeRequest(el.btnGetStateInstance, 'GET', 'getStateInstance'));
  el.btnSendMsg.addEventListener('click', handleSendMessage);
  el.btnSendFile.addEventListener('click', handleSendFileByUrl);

  // 5. Очистка и копирование ответа
  el.btnClear.addEventListener('click', () => {
    el.responseOutput.value = '';
    el.statusTag.style.display = 'none';
    el.durationTag.style.display = 'none';
    el.btnCopy.style.display = 'none';
    el.badgeText.textContent = 'Готов к работе';
    if (el.responseEmpty) el.responseEmpty.style.display = 'flex';
    showToast('Поле ответа очищено', 'info');
  });

  el.btnCopy.addEventListener('click', async () => {
    if (!el.responseOutput.value) return;
    try {
      await navigator.clipboard.writeText(el.responseOutput.value);
      el.btnCopy.textContent = 'Скопировано!';
      setTimeout(() => { el.btnCopy.textContent = 'Копировать'; }, 1800);
    } catch {
      showToast('Не удалось скопировать', 'error');
    }
  });

  /**
   * Получение и валидация учетных данных инстанса
   */
  function getCredentials() {
    const idInstance = el.idInstance.value.trim();
    const apiTokenInstance = el.apiToken.value.trim();
    const host = (el.apiHost.value.trim() || 'https://api.green-api.com').replace(/\/+$/, '');

    if (!idInstance) {
      showToast('Введите idInstance', 'error');
      el.idInstance.focus();
      return null;
    }
    if (!apiTokenInstance) {
      showToast('Введите ApiTokenInstance', 'error');
      el.apiToken.focus();
      return null;
    }
    return { idInstance, apiTokenInstance, host };
  }

  /**
   * Форматирование номера чата WhatsApp: добавляет @c.us если введен только номер
   */
  function formatChatId(value) {
    const clean = value.trim();
    if (!clean) return '';
    return clean.includes('@') ? clean : `${clean.replace(/\D/g, '')}@c.us`;
  }

  /**
   * Извлечение имени файла из URL
   */
  function getFileNameFromUrl(url) {
    try {
      const parts = new URL(url).pathname.split('/').filter(Boolean);
      return parts.pop() || 'file.png';
    } catch {
      return 'file.png';
    }
  }

  /**
   * Универсальный обработчик HTTP-запросов к GREEN-API
   */
  async function executeRequest(button, httpMethod, apiMethod, payload = null) {
    const creds = getCredentials();
    if (!creds) return;

    const url = `${creds.host}/waInstance${creds.idInstance}/${apiMethod}/${creds.apiTokenInstance}`;

    button.classList.add('is-loading');
    button.disabled = true;

    const startTime = performance.now();

    try {
      const requestOptions = {
        method: httpMethod,
        headers: {}
      };

      if (payload !== null) {
        requestOptions.headers['Content-Type'] = 'application/json';
        requestOptions.body = JSON.stringify(payload);
      }

      const response = await fetch(url, requestOptions);
      const duration = Math.round(performance.now() - startTime);

      let responseData;
      const text = await response.text();
      try {
        responseData = JSON.parse(text);
      } catch {
        responseData = text;
      }

      renderResponse(response.status, response.statusText, responseData, duration);
      showToast(response.ok ? `Успешно: ${apiMethod}` : `Ошибка ${response.status}`, response.ok ? 'success' : 'warn');

    } catch (err) {
      const duration = Math.round(performance.now() - startTime);
      renderResponse(0, 'Network Error', { error: true, message: err.message }, duration);
      showToast('Ошибка сети при выполнении запроса', 'error');
    } finally {
      button.classList.remove('is-loading');
      button.disabled = false;
    }
  }

  /**
   * Отображение результатов вызова в поле «Ответ:»
   */
  function renderResponse(status, statusText, data, durationMs) {
    el.responseOutput.value = typeof data === 'object' && data !== null
      ? JSON.stringify(data, null, 2)
      : String(data);

    if (el.responseEmpty) el.responseEmpty.style.display = 'none';
    el.btnCopy.style.display = 'inline-flex';
    el.statusTag.style.display = 'inline-block';
    el.durationTag.style.display = 'inline-block';

    el.statusTag.textContent = `${status || 'ERR'} ${statusText}`;
    el.statusTag.className = 'tag-status';

    if (status >= 200 && status < 300) {
      el.statusTag.classList.add('status-2xx');
      el.badgeText.textContent = `Подключено (${status})`;
    } else if (status >= 400 && status < 500) {
      el.statusTag.classList.add('status-4xx');
      el.badgeText.textContent = `Внимание (${status})`;
    } else {
      el.statusTag.classList.add('status-5xx');
      el.badgeText.textContent = `Ошибка (${status || 'Сеть'})`;
    }

    el.durationTag.textContent = `${durationMs} ms`;
  }

  /**
   * Обработчик метода sendMessage
   */
  async function handleSendMessage() {
    const rawChatId = el.chatIdMsg.value.trim();
    const message = el.msgText.value.trim();

    if (!rawChatId) {
      showToast('Укажите номер телефона получателя', 'error');
      el.chatIdMsg.focus();
      return;
    }
    if (!message) {
      showToast('Введите текст сообщения', 'error');
      el.msgText.focus();
      return;
    }

    const payload = {
      chatId: formatChatId(rawChatId),
      message: message
    };

    await executeRequest(el.btnSendMsg, 'POST', 'sendMessage', payload);
  }

  /**
   * Обработчик метода sendFileByUrl
   */
  async function handleSendFileByUrl() {
    const rawChatId = el.chatIdFile.value.trim();
    const urlFile = el.fileUrl.value.trim();

    if (!rawChatId) {
      showToast('Укажите номер телефона получателя', 'error');
      el.chatIdFile.focus();
      return;
    }
    if (!urlFile) {
      showToast('Укажите ссылку на файл', 'error');
      el.fileUrl.focus();
      return;
    }

    const payload = {
      chatId: formatChatId(rawChatId),
      urlFile: urlFile,
      fileName: getFileNameFromUrl(urlFile)
    };

    await executeRequest(el.btnSendFile, 'POST', 'sendFileByUrl', payload);
  }

  /**
   * Лаконичные всплывающие уведомления (Toast)
   */
  function showToast(message, type = 'info') {
    if (!el.toastBox) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    el.toastBox.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('show'));

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 200);
    }, 2800);
  }
});
