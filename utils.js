/**
 * Ninja-Snatch Shared Utilities
 * Общая логика извлечения HTML для popup и selector
 */

const SnatcherUtils = {
    /**
     * Получает полный HTML документа включая DOCTYPE
     * @param {Document} doc - DOM документ
     * @returns {string} Полный HTML
     */
    getFullHTML(doc) {
        const doctype = doc.doctype
            ? new XMLSerializer().serializeToString(doc.doctype)
            : "<!DOCTYPE html>";
        return doctype + "\n" + doc.documentElement.outerHTML;
    },

    /**
     * Оборачивает HTML-фрагмент в полный документ
     * @param {string} html - HTML-фрагмент
     * @param {string} [title] - Заголовок страницы
     * @returns {string} Полный HTML-документ
     */
    wrapAsDocument(html, title = 'Snatched Content') {
        return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>${title}</title>
</head>
<body>
${html}
</body>
</html>`;
    },

    /**
     * Санитизирует строку для использования в имени файла
     * @param {string} str - Исходная строка
     * @param {number} [maxLen=30] - Максимальная длина
     * @returns {string} Безопасное имя файла
     */
    sanitizeFilename(str, maxLen = 30) {
        return str.replace(/[^a-z0-9а-яё]/gi, '_').substring(0, maxLen) || 'snatched';
    },

    /**
     * Находит целевой iframe для извлечения
     * @returns {HTMLIFrameElement|null}
     */
    findTargetIframe() {
        const iframes = Array.from(document.querySelectorAll('iframe'));
        return iframes.find(i => i.srcdoc) || iframes.find(i => {
            try {
                return i.contentDocument && i.contentDocument.documentElement;
            } catch (e) {
                return false;
            }
        }) || null;
    },

    /**
     * Извлекает данные со страницы
     * @returns {Object} { mainHTML, iframeHTML, title }
     */
    extractPageData() {
        const targetIframe = this.findTargetIframe();

        return {
            mainHTML: this.getFullHTML(document),
            iframeHTML: targetIframe
                ? (targetIframe.srcdoc || this.getFullHTML(targetIframe.contentDocument))
                : null,
            title: document.title
        };
    }
};
// Initialize namespace and export
if (typeof window !== 'undefined') {
    window.__NINJA_SNATCH__ = window.__NINJA_SNATCH__ || {};
    window.__NINJA_SNATCH__.SnatcherUtils = SnatcherUtils;

    // Legacy compatibility
    window.SnatcherUtils = SnatcherUtils;
}
