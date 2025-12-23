const status = document.getElementById("status");
const modeBtns = document.querySelectorAll('.mode-btn');
const extractModeRadios = document.querySelectorAll('input[name="extractMode"]');
const smartSettings = document.getElementById('smartSettings');
const enableAI = document.getElementById('enableAI');
const apiKeySection = document.getElementById('apiKeySection');
const apiKeyInput = document.getElementById('apiKey');
const targetFormatSelect = document.getElementById('targetFormat');

let outputMode = 'copy'; // copy или download
let extractMode = 'clean'; // clean, styled, compact, smart

// 1. Инициализация из хранилища
chrome.storage.local.get(['outputMode', 'extractMode', 'smartExtractSettings'], (result) => {
  if (result.outputMode) {
    outputMode = result.outputMode;
    updateOutputModeUI();
  }
  if (result.extractMode) {
    extractMode = result.extractMode;
    updateExtractModeUI();
  }
  // Smart Extract settings
  if (result.smartExtractSettings) {
    const settings = result.smartExtractSettings;
    if (settings.format && targetFormatSelect) {
      targetFormatSelect.value = settings.format;
    }
    if (settings.enableAI && enableAI) {
      enableAI.checked = settings.enableAI;
      toggleApiKeySection();
    }
    if (settings.apiKey && apiKeyInput) {
      apiKeyInput.value = settings.apiKey;
    }
  }
});

// 2. Переключатель режима вывода (копировать/скачать)
modeBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    outputMode = btn.dataset.mode;
    chrome.storage.local.set({ outputMode });
    updateOutputModeUI();
  });
});

// 3. Переключатель режима извлечения (чистый/со стилями/compact/smart)
extractModeRadios.forEach(radio => {
  radio.addEventListener('change', () => {
    extractMode = radio.value;
    chrome.storage.local.set({ extractMode });
    toggleSmartSettings();
  });
});

// 4. Smart Extract Settings
function toggleSmartSettings() {
  if (smartSettings) {
    smartSettings.classList.toggle('hidden', extractMode !== 'smart');
  }
}

function toggleApiKeySection() {
  if (apiKeySection && enableAI) {
    apiKeySection.classList.toggle('hidden', !enableAI.checked);
  }
}

if (enableAI) {
  enableAI.addEventListener('change', () => {
    toggleApiKeySection();
    saveSmartSettings();
  });
}

if (apiKeyInput) {
  apiKeyInput.addEventListener('change', saveSmartSettings);
}

if (targetFormatSelect) {
  targetFormatSelect.addEventListener('change', saveSmartSettings);
}

function saveSmartSettings() {
  const settings = {
    format: targetFormatSelect?.value || 'react-tailwind',
    enableAI: enableAI?.checked || false,
    apiKey: apiKeyInput?.value || ''
  };
  chrome.storage.local.set({ smartExtractSettings: settings });
}

function updateOutputModeUI() {
  modeBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === outputMode);
  });
}

function updateExtractModeUI() {
  extractModeRadios.forEach(radio => {
    radio.checked = radio.value === extractMode;
  });
  toggleSmartSettings();
}

// ============================================
// СЕКЦИЯ 1: IFRAME (aura.build)
// ============================================
document.getElementById("stealIframeBtn").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (isRestrictedPage(tab.url)) {
    showError("На этой странице не работает");
    return;
  }

  showStatus("Ищем iframe...");

  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: extractIframeContent
    });

    if (!results?.[0]?.result) {
      throw new Error("Не удалось получить данные");
    }

    const { html, title, found } = results[0].result;

    if (!found) {
      showError("iframe не найден");
      return;
    }

    await handleOutput(html, title, 'iframe');
  } catch (err) {
    showError(err.message);
  }
});

// ============================================
// СЕКЦИЯ 2: ЛЮБОЙ САЙТ
// ============================================

// Visual Sniper
document.getElementById("visualSelectBtn").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (isRestrictedPage(tab.url)) {
    showError("На этой странице не работает");
    return;
  }

  try {
    await chrome.scripting.insertCSS({ target: { tabId: tab.id }, files: ['selector.css'] });

    // Инжектируем config.js и styleInjector для prettify и стилей
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['config.js'] });
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['styleInjector.js'] });

    // Инжектируем smartStyleInjector.js и smartExtract.js если режим smart
    if (extractMode === 'smart') {
      await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['smartStyleInjector.js'] });
      await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['smartExtract.js'] });
    }

    // Получаем настройки Smart Extract
    const smartSettings = await new Promise(resolve => {
      chrome.storage.local.get(['smartExtractSettings'], result => {
        resolve(result.smartExtractSettings || {});
      });
    });

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (mode, extract, smartOpts) => {
        // Initialize namespace
        window.__NINJA_SNATCH__ = window.__NINJA_SNATCH__ || {};
        window.__NINJA_SNATCH__.snatcherMode = mode;
        window.__NINJA_SNATCH__.snatcherExtractMode = extract;
        window.__NINJA_SNATCH__.smartExtractSettings = smartOpts;
        // Legacy compatibility
        window.snatcherMode = mode;
        window.snatcherExtractMode = extract;
      },
      args: [outputMode, extractMode, smartSettings]
    });

    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['selector.js'] });
    window.close();
  } catch (err) {
    showError("Не удалось запустить Sniper");
  }
});

// Вся страница
document.getElementById("stealPageBtn").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (isRestrictedPage(tab.url)) {
    showError("На этой странице не работает");
    return;
  }

  const isSmart = extractMode === 'smart';

  try {
    // Step 1: Inject base scripts
    showStatus(isSmart ? "⏳ Загрузка модулей..." : "Извлекаем страницу...");

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['config.js']
    });
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['styleInjector.js']
    });

    // Step 2: Inject Smart StyleInjector + Extract if needed
    if (isSmart) {
      showStatus("⏳ Инициализация Smart Extract...");
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['smartStyleInjector.js']
      });
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['smartExtract.js']
      });
    }

    // Step 3: Get settings
    const smartSettings = await new Promise(resolve => {
      chrome.storage.local.get(['smartExtractSettings'], result => {
        resolve(result.smartExtractSettings || {});
      });
    });

    // Step 4: Extract content
    showStatus(isSmart ? "⏳ Анализ структуры страницы..." : "Извлекаем...");

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: extractPageContent,
      args: [extractMode, smartSettings]
    });

    if (!results?.[0]?.result) {
      throw new Error("Не удалось получить данные");
    }

    // Step 5: Handle output
    showStatus(isSmart ? "⏳ Генерация кода..." : "Сохранение...");

    const { html, title, ext } = results[0].result;
    await handleOutput(html, title, 'page', ext);
  } catch (err) {
    showError(err.message);
  }
});

// ============================================
// ОБЩИЕ ФУНКЦИИ
// ============================================

function isRestrictedPage(url) {
  return url.startsWith('chrome://') ||
    url.startsWith('https://chrome.google.com/webstore') ||
    url.startsWith('edge://');
}

async function handleOutput(content, title, suffix, fileExt = 'html') {
  const sanitizedTitle = title.replace(/[^a-z0-9а-яё]/gi, '_').substring(0, 30) || 'snatched';
  const modeSuffix = extractMode === 'smart' ? '_smart' : (extractMode === 'styled' ? '_styled' : '');
  const ext = extractMode === 'smart' ? fileExt : 'html';
  const filename = `${sanitizedTitle}_${suffix}${modeSuffix}.${ext}`;

  if (outputMode === 'copy') {
    try {
      await navigator.clipboard.writeText(content);
      const msg = extractMode === 'smart'
        ? "Smart Extract скопирован! ✨"
        : (extractMode === 'styled' ? "Со стилями скопировано! 🎨" : "Скопировано! 📋");
      showSuccess(msg);
    } catch (err) {
      showError("Ошибка буфера обмена");
    }
  } else {
    chrome.runtime.sendMessage({
      action: 'download',
      data: { content, filename }
    }, (response) => {
      if (response?.success) {
        const msg = extractMode === 'smart'
          ? "Smart Extract сохранён! ✨"
          : (extractMode === 'styled' ? "Файл со стилями сохранён! 🎨" : "Файл сохранён! 💾");
        showSuccess(msg);
      } else {
        showError(response?.error || "Ошибка скачивания");
      }
    });
  }
}

function showStatus(msg) {
  status.textContent = msg;
  status.style.color = "#94a3b8";
}

function showSuccess(msg) {
  status.textContent = msg;
  status.style.color = "#10b981";
  setTimeout(() => { status.textContent = ""; }, 3000);
}

function showError(msg) {
  status.textContent = "Ошибка: " + msg;
  status.style.color = "#f87171";
}

// ============================================
// ФУНКЦИИ-ИНЖЕКТОРЫ (выполняются на странице)
// ============================================

function extractIframeContent() {
  function getFullHTML(doc) {
    const doctype = doc.doctype
      ? new XMLSerializer().serializeToString(doc.doctype)
      : "<!DOCTYPE html>";
    return doctype + "\n" + doc.documentElement.outerHTML;
  }

  const iframes = Array.from(document.querySelectorAll('iframe'));

  // Приоритет: srcdoc iframe
  const srcdocIframe = iframes.find(i => i.srcdoc);
  if (srcdocIframe) {
    return {
      html: srcdocIframe.srcdoc,
      title: document.title,
      found: true
    };
  }

  // Fallback: same-origin iframe с контентом
  const accessibleIframe = iframes.find(i => {
    try { return i.contentDocument?.documentElement; }
    catch (e) { return false; }
  });

  if (accessibleIframe) {
    return {
      html: getFullHTML(accessibleIframe.contentDocument),
      title: document.title,
      found: true
    };
  }

  return { html: null, title: null, found: false };
}

async function extractPageContent(mode, smartSettings = {}) {
  function getFullHTML(doc) {
    const doctype = doc.doctype
      ? new XMLSerializer().serializeToString(doc.doctype)
      : "<!DOCTYPE html>";
    return doctype + "\n" + doc.documentElement.outerHTML;
  }

  let html;
  let ext = 'html';

  // Smart Extract mode
  if (mode === 'smart' && window.__NINJA_SNATCH__?.SmartExtract) {
    try {
      const SmartExtract = window.__NINJA_SNATCH__.SmartExtract;
      const result = await SmartExtract.process(document.body, {
        enableAI: smartSettings.enableAI || false,
        apiKey: smartSettings.apiKey || null
      });

      html = result.code;
      ext = 'html'; // Smart Extract v2 always outputs HTML

      console.log('[SmartExtract] Page extraction complete:', result.metadata);
    } catch (err) {
      console.error('[SmartExtract] Error:', err);
      // Fallback to clean HTML
      html = getFullHTML(document);
    }
  } else if (mode === 'styled' && window.StyleInjector) {
    html = window.StyleInjector.createStyledDocument(document.documentElement, document.title);
  } else {
    // Raw HTML - тоже форматируем if prettifier available
    const rawHTML = getFullHTML(document);
    html = window.StyleInjector?.prettifyHTML
      ? window.StyleInjector.prettifyHTML(rawHTML)
      : rawHTML;
  }

  return {
    html,
    title: document.title,
    ext
  };
}
