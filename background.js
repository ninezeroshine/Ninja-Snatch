/**
 * Ninja-Snatch Background Service Worker
 * Координирует сообщения между popup и content scripts
 * Обрабатывает downloads через chrome.downloads API
 */

// Слушаем сообщения от content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'download') {
    handleDownload(message.data)
      .then(result => sendResponse({ success: true, result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Async response
  }

  if (message.action === 'copyToClipboard') {
    // Clipboard API requires user gesture, handle via offscreen document if needed
    sendResponse({ success: true });
    return false;
  }
});

/**
 * Обрабатывает скачивание файла через chrome.downloads API
 * @param {Object} data - { content: string, filename: string, mimeType?: string }
 */
async function handleDownload({ content, filename, mimeType = 'text/html' }) {
  const blob = new Blob([content], { type: mimeType });
  const reader = new FileReader();

  return new Promise((resolve, reject) => {
    reader.onload = () => {
      chrome.downloads.download({
        url: reader.result,
        filename: filename,
        saveAs: false
      }, (downloadId) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(downloadId);
        }
      });
    };
    reader.onerror = () => reject(new Error('Failed to read blob'));
    reader.readAsDataURL(blob);
  });
}

// Обработка установки расширения
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('🥷 Ninja-Snatch installed successfully!');
  } else if (details.reason === 'update') {
    console.log('🥷 Ninja-Snatch updated to version', chrome.runtime.getManifest().version);
  }
});
