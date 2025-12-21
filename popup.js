const status = document.getElementById("status");
const modeBtns = document.querySelectorAll('.mode-btn');
let currentMode = 'copy';

// 1. Инициализация режима из хранилища
chrome.storage.local.get(['snackMode'], (result) => {
  if (result.snackMode) {
    currentMode = result.snackMode;
    updateModeUI();
  }
});

// 2. Переключатель режимов
modeBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    currentMode = btn.dataset.mode;
    chrome.storage.local.set({ snackMode: currentMode });
    updateModeUI();
  });
});

function updateModeUI() {
  modeBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === currentMode);
  });
}

// 3. Основная логика извлечения
async function startSnatch(type) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  // Проверка на служебные страницы Chrome
  if (tab.url.startsWith('chrome://') || tab.url.startsWith('https://chrome.google.com/webstore')) {
    showError("На этой странице расширение не работает");
    return;
  }

  status.textContent = "Работаем... 🥷";
  status.style.color = "#94a3b8";

  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: snatchData
    });

    if (!results || !results[0] || !results[0].result) {
      throw new Error("Не удалось получить данные");
    }

    const data = results[0].result;
    const targetContent = (type === 'content') ? (data.iframeHTML || data.mainHTML) : data.mainHTML;

    if (currentMode === 'copy') {
      try {
        await navigator.clipboard.writeText(targetContent);
        status.textContent = "Код скопирован! 📋";
      } catch (err) {
        throw new Error("Ошибка буфера обмена");
      }
    } else {
      const sanitize = (str) => str.replace(/[^a-z0-9а-яё]/gi, '_').substring(0, 30) || "site";
      const title = sanitize(data.title);
      const suffix = type === 'content' ? 'content' : 'full';

      const blob = new Blob([targetContent], { type: "text/html" });
      const reader = new FileReader();
      reader.onload = () => {
        chrome.downloads.download({
          url: reader.result,
          filename: `${title}_${suffix}.html`,
          saveAs: false
        });
      };
      reader.readAsDataURL(blob);
      status.textContent = "Файл сохранен! 💾";
    }

    setTimeout(() => { if (status.textContent !== "") status.textContent = ""; }, 3000);
  } catch (err) {
    showError(err.message);
  }
}

function showError(msg) {
  status.textContent = "Ошибка: " + msg;
  status.style.color = "#f87171";
}

// 4. Слушатели кнопок
document.getElementById("visualSelectBtn").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  try {
    await chrome.scripting.insertCSS({ target: { tabId: tab.id }, files: ['selector.css'] });
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (mode) => { window.snatcherMode = mode; },
      args: [currentMode]
    });
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['selector.js'] });
    window.close();
  } catch (err) {
    showError("Не удалось запустить Sniper");
  }
});

document.getElementById("stealContentBtn").addEventListener("click", () => startSnatch('content'));
document.getElementById("stealMainBtn").addEventListener("click", () => startSnatch('main'));

// 5. Функция-инжектор (выполняется на странице)
function snatchData() {
  function getFullHTML(doc) {
    const doctype = doc.doctype ?
      new XMLSerializer().serializeToString(doc.doctype) :
      "<!DOCTYPE html>";
    return doctype + "\n" + doc.documentElement.outerHTML;
  }

  const iframes = Array.from(document.querySelectorAll('iframe'));
  const targetIframe = iframes.find(i => i.srcdoc) || iframes.find(i => {
    try { return i.contentDocument && i.contentDocument.documentElement; }
    catch (e) { return false; }
  });

  return {
    mainHTML: getFullHTML(document),
    iframeHTML: targetIframe ? (targetIframe.srcdoc || getFullHTML(targetIframe.contentDocument)) : null,
    title: document.title
  };
}

