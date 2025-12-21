const status = document.getElementById("status");
const modeBtns = document.querySelectorAll('.mode-btn');
const extractModeRadios = document.querySelectorAll('input[name="extractMode"]');

let outputMode = 'copy'; // copy или download
let extractMode = 'clean'; // clean или styled

// 1. Инициализация из хранилища
chrome.storage.local.get(['outputMode', 'extractMode'], (result) => {
  if (result.outputMode) {
    outputMode = result.outputMode;
    updateOutputModeUI();
  }
  if (result.extractMode) {
    extractMode = result.extractMode;
    updateExtractModeUI();
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

// 3. Переключатель режима извлечения (чистый/со стилями)
extractModeRadios.forEach(radio => {
  radio.addEventListener('change', () => {
    extractMode = radio.value;
    chrome.storage.local.set({ extractMode });
  });
});

function updateOutputModeUI() {
  modeBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === outputMode);
  });
}

function updateExtractModeUI() {
  extractModeRadios.forEach(radio => {
    radio.checked = radio.value === extractMode;
  });
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

    // Инжектируем styleInjector для prettify и стилей
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['styleInjector.js'] });

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (mode, extract) => {
        window.snatcherMode = mode;
        window.snatcherExtractMode = extract;
      },
      args: [outputMode, extractMode]
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

  showStatus("Извлекаем страницу...");

  try {
    // Инжектируем styleInjector для prettify и стилей
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['styleInjector.js']
    });

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: extractPageContent,
      args: [extractMode]
    });

    if (!results?.[0]?.result) {
      throw new Error("Не удалось получить данные");
    }

    const { html, title } = results[0].result;
    await handleOutput(html, title, 'page');
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

async function handleOutput(content, title, suffix) {
  const sanitizedTitle = title.replace(/[^a-z0-9а-яё]/gi, '_').substring(0, 30) || 'snatched';
  const styleSuffix = extractMode === 'styled' ? '_styled' : '';
  const filename = `${sanitizedTitle}_${suffix}${styleSuffix}.html`;

  if (outputMode === 'copy') {
    try {
      await navigator.clipboard.writeText(content);
      const msg = extractMode === 'styled' ? "Со стилями скопировано! 🎨" : "Скопировано! 📋";
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
        const msg = extractMode === 'styled' ? "Файл со стилями сохранён! 🎨" : "Файл сохранён! 💾";
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

function extractPageContent(mode) {
  function getFullHTML(doc) {
    const doctype = doc.doctype
      ? new XMLSerializer().serializeToString(doc.doctype)
      : "<!DOCTYPE html>";
    return doctype + "\n" + doc.documentElement.outerHTML;
  }

  let html;

  if (mode === 'styled' && window.StyleInjector) {
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
    title: document.title
  };
}
