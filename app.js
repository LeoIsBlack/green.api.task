document.addEventListener('DOMContentLoaded', () => {
  const el = {
    idInstance: document.getElementById('idInstance'),
    apiToken: document.getElementById('apiTokenInstance'),
    apiHost: document.getElementById('apiUrlHost'),
    btnToggleToken: document.getElementById('btnToggleToken'),

    btnHelp: document.getElementById('btnHelp'),
    helpOverlay: document.getElementById('helpOverlay'),
    helpClose: document.getElementById('helpClose'),

    btnGetSettings: document.getElementById('btnGetSettings'),
    btnGetStateInstance: document.getElementById('btnGetStateInstance'),

    chatIdMsg: document.getElementById('chatIdMessage'),
    msgText: document.getElementById('messageText'),
    btnSendMsg: document.getElementById('btnSendMessage'),

    chatIdFile: document.getElementById('chatIdFile'),
    fileMethodName: document.getElementById('fileMethodName'),
    fileUrl: document.getElementById('fileUrl'),
    fileCaption: document.getElementById('fileCaption'),
    btnSendFile: document.getElementById('btnSendFile'),
    btnSendFileText: document.getElementById('btnSendFileText'),

    tabByFile: document.getElementById('tabByFile'),
    tabByUrl: document.getElementById('tabByUrl'),
    panelFile: document.getElementById('panelFile'),
    panelUrl: document.getElementById('panelUrl'),

    fileInput: document.getElementById('fileInput'),
    dropZone: document.getElementById('dropZone'),
    filePreviewCard: document.getElementById('filePreviewCard'),
    filePreviewThumb: document.getElementById('filePreviewThumb'),
    filePreviewName: document.getElementById('filePreviewName'),
    filePreviewSize: document.getElementById('filePreviewSize'),
    btnRemoveFile: document.getElementById('btnRemoveFile'),

    responseOutput: document.getElementById('responseOutput'),
    responseEmpty: document.getElementById('responseEmpty'),
    statusTag: document.getElementById('statusTag'),
    durationTag: document.getElementById('durationTag'),
    btnCopy: document.getElementById('btnCopyResponse'),
    btnClear: document.getElementById('btnClearResponse'),
    badgeText: document.getElementById('connectionBadgeText'),
    toastBox: document.getElementById('toastContainer')
  };

  let fileMode = 'file';
  let selectedFile = null;

  const STORAGE_KEYS = {
    ID: 'green_api_id_instance',
    TOKEN: 'green_api_token_instance',
    HOST: 'green_api_host'
  };

  el.idInstance.value = localStorage.getItem(STORAGE_KEYS.ID) || '';
  el.apiToken.value = localStorage.getItem(STORAGE_KEYS.TOKEN) || '';
  if (localStorage.getItem(STORAGE_KEYS.HOST)) {
    el.apiHost.value = localStorage.getItem(STORAGE_KEYS.HOST);
  }

  el.idInstance.addEventListener('input', (e) => localStorage.setItem(STORAGE_KEYS.ID, e.target.value.trim()));
  el.apiToken.addEventListener('input', (e) => localStorage.setItem(STORAGE_KEYS.TOKEN, e.target.value.trim()));
  el.apiHost.addEventListener('input', (e) => localStorage.setItem(STORAGE_KEYS.HOST, e.target.value.trim()));

  el.btnToggleToken.addEventListener('click', () => {
    const isPass = el.apiToken.type === 'password';
    el.apiToken.type = isPass ? 'text' : 'password';
    el.btnToggleToken.setAttribute('aria-pressed', isPass ? 'true' : 'false');
  });

  function openHelp() {
    el.helpOverlay.classList.add('is-open');
    el.helpOverlay.setAttribute('aria-hidden', 'false');
    el.helpClose.focus();
  }

  function closeHelp() {
    el.helpOverlay.classList.remove('is-open');
    el.helpOverlay.setAttribute('aria-hidden', 'true');
    el.btnHelp.focus();
  }

  el.btnHelp.addEventListener('click', openHelp);
  el.helpClose.addEventListener('click', closeHelp);

  el.helpOverlay.addEventListener('click', (e) => {
    if (e.target === el.helpOverlay) closeHelp();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && el.helpOverlay.classList.contains('is-open')) closeHelp();
  });

  function switchFileTab(mode) {
    fileMode = mode;
    if (mode === 'file') {
      el.tabByFile.classList.add('active');
      el.tabByUrl.classList.remove('active');
      el.panelFile.style.display = 'block';
      el.panelUrl.style.display = 'none';
      if (el.fileMethodName) el.fileMethodName.textContent = 'sendFileByUpload';
      if (el.btnSendFileText) el.btnSendFileText.textContent = 'Отправить выбранный файл';
    } else {
      el.tabByUrl.classList.add('active');
      el.tabByFile.classList.remove('active');
      el.panelFile.style.display = 'none';
      el.panelUrl.style.display = 'block';
      if (el.fileMethodName) el.fileMethodName.textContent = 'sendFileByUrl';
      if (el.btnSendFileText) el.btnSendFileText.textContent = 'Отправить файл по ссылке';
    }
  }

  el.tabByFile.addEventListener('click', () => switchFileTab('file'));
  el.tabByUrl.addEventListener('click', () => switchFileTab('url'));

  document.querySelectorAll('.preset-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      const url = chip.getAttribute('data-url');
      if (url && el.fileUrl) {
        el.fileUrl.value = url;
        el.fileUrl.focus();
        showToast('Пример ссылки вставлен', 'info');
      }
    });
  });

  function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function handleFileSelected(file) {
    if (!file) return;
    selectedFile = file;

    el.filePreviewName.textContent = file.name;
    el.filePreviewSize.textContent = formatBytes(file.size);

    el.filePreviewThumb.innerHTML = '';
    if (file.type.startsWith('image/')) {
      const img = document.createElement('img');
      img.src = URL.createObjectURL(file);
      img.alt = file.name;
      el.filePreviewThumb.appendChild(img);
    } else {
      const ext = (file.name.split('.').pop() || 'FILE').toUpperCase().slice(0, 4);
      const badge = document.createElement('span');
      badge.className = 'file-icon-badge';
      badge.textContent = ext;
      el.filePreviewThumb.appendChild(badge);
    }

    el.dropZone.style.display = 'none';
    el.filePreviewCard.style.display = 'flex';
    showToast(`Файл выбран: ${file.name}`, 'info');
  }

  function clearSelectedFile() {
    selectedFile = null;
    el.fileInput.value = '';
    el.filePreviewThumb.innerHTML = '';
    el.filePreviewCard.style.display = 'none';
    el.dropZone.style.display = 'flex';
  }

  el.dropZone.addEventListener('click', () => el.fileInput.click());
  el.dropZone.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      el.fileInput.click();
    }
  });

  el.dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    el.dropZone.classList.add('drag-over');
  });
  el.dropZone.addEventListener('dragleave', () => {
    el.dropZone.classList.remove('drag-over');
  });
  el.dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    el.dropZone.classList.remove('drag-over');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  });

  el.fileInput.addEventListener('change', () => {
    if (el.fileInput.files && el.fileInput.files[0]) {
      handleFileSelected(el.fileInput.files[0]);
    }
  });

  el.btnRemoveFile.addEventListener('click', (e) => {
    e.stopPropagation();
    clearSelectedFile();
  });

  el.btnGetSettings.addEventListener('click', () => executeRequest(el.btnGetSettings, 'GET', 'getSettings'));
  el.btnGetStateInstance.addEventListener('click', () => executeRequest(el.btnGetStateInstance, 'GET', 'getStateInstance'));
  el.btnSendMsg.addEventListener('click', handleSendMessage);
  el.btnSendFile.addEventListener('click', handleSendFile);

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

  function formatChatId(value) {
    const clean = value.trim();
    if (!clean) return '';
    if (clean.includes('@')) return clean;

    let digits = clean.replace(/\D/g, '');

    if (digits.length === 11 && digits.startsWith('8')) {
      digits = '7' + digits.slice(1);
    }

    return digits ? `${digits}@c.us` : '';
  }

  function getFileNameFromUrl(url) {
    try {
      const parts = new URL(url).pathname.split('/').filter(Boolean);
      return parts.pop() || 'file.png';
    } catch {
      return 'file.png';
    }
  }

  async function executeRequest(button, httpMethod, apiMethod, payload = null) {
    const creds = getCredentials();
    if (!creds) return;

    let host = creds.host;
    if (apiMethod === 'sendFileByUpload' || apiMethod === 'uploadFile') {
      if (host.includes('api.green-api.com')) {
        host = host.replace('api.green-api.com', 'media.green-api.com');
      } else if (host.includes('.api.greenapi.com')) {
        host = host.replace('.api.greenapi.com', '.media.greenapi.com');
      }
    }

    const url = `${host}/waInstance${creds.idInstance}/${apiMethod}/${creds.apiTokenInstance}`;

    button.classList.add('is-loading');
    button.disabled = true;

    const startTime = performance.now();

    try {
      const requestOptions = {
        method: httpMethod,
        headers: {}
      };

      if (payload !== null) {
        if (payload instanceof FormData) {
          requestOptions.body = payload;
        } else {
          requestOptions.headers['Content-Type'] = 'application/json';
          requestOptions.body = JSON.stringify(payload);
        }
      }

      let response;
      try {
        response = await fetch(url, requestOptions);
      } catch (fetchErr) {
        if (host !== creds.host) {
          const fallbackUrl = `${creds.host}/waInstance${creds.idInstance}/${apiMethod}/${creds.apiTokenInstance}`;
          response = await fetch(fallbackUrl, requestOptions);
        } else {
          throw fetchErr;
        }
      }

      const duration = Math.round(performance.now() - startTime);

      let responseData;
      const text = await response.text();
      try {
        responseData = JSON.parse(text);
      } catch {
        responseData = text;
      }

      renderResponse(response.status, response.statusText, responseData, duration);
      showToast(response.ok ? `Успешно: ${apiMethod}` : `Ответ ${response.status}`, response.ok ? 'success' : 'warn');

    } catch (err) {
      const duration = Math.round(performance.now() - startTime);
      renderResponse(0, 'Network Error', { error: true, message: err.message }, duration);
      showToast('Ошибка сети при выполнении запроса', 'error');
    } finally {
      button.classList.remove('is-loading');
      button.disabled = false;
    }
  }

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

  async function handleSendFile() {
    const rawChatId = el.chatIdFile.value.trim();

    if (!rawChatId) {
      showToast('Укажите номер телефона получателя', 'error');
      el.chatIdFile.focus();
      return;
    }

    if (fileMode === 'file') {
      if (!selectedFile) {
        showToast('Выберите файл на устройстве или перетащите его', 'error');
        el.fileInput.click();
        return;
      }

      const formData = new FormData();
      formData.append('chatId', formatChatId(rawChatId));
      formData.append('file', selectedFile, selectedFile.name);
      formData.append('fileName', selectedFile.name);

      const caption = el.fileCaption ? el.fileCaption.value.trim() : '';
      if (caption) {
        formData.append('caption', caption);
      }

      await executeRequest(el.btnSendFile, 'POST', 'sendFileByUpload', formData);

    } else {
      const urlFile = el.fileUrl.value.trim();
      if (!urlFile) {
        showToast('Укажите ссылку на файл или выберите пример', 'error');
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
  }

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
