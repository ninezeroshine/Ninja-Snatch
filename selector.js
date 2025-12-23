(function () {
    // Use namespace for guard
    window.__NINJA_SNATCH__ = window.__NINJA_SNATCH__ || {};
    if (window.__NINJA_SNATCH__.snatcherInstance) return;

    class SniperSelector {
        constructor() {
            this.overlay = document.createElement('div');
            this.overlay.className = 'snatcher-overlay';
            this.label = document.createElement('div');
            this.label.className = 'snatcher-label';
            this.overlay.appendChild(this.label);

            this.hoveredElement = null;
            this.boundMouseMove = this.onMouseMove.bind(this);
            this.boundClick = this.onClick.bind(this);
            this.boundKeyDown = this.onKeyDown.bind(this);

            this.init();
        }

        init() {
            try {
                document.body.appendChild(this.overlay);
                document.addEventListener('mousemove', this.boundMouseMove, true);
                document.addEventListener('scroll', () => this.updatePosition(), true);
                document.addEventListener('click', this.boundClick, true);
                document.addEventListener('keydown', this.boundKeyDown, true);
                document.body.style.cursor = 'crosshair';
                window.snatcherInstance = this;
            } catch (err) {
                this.showToast('Ошибка инициализации: ' + err.message, 'error');
                console.error('[Snatcher] Init error:', err);
            }
        }

        onMouseMove(e) {
            const el = e.target;
            if (el === this.overlay || el === this.label) return;

            this.hoveredElement = el;
            this.updatePosition();
        }

        updatePosition() {
            if (!this.hoveredElement) return;

            try {
                const rect = this.hoveredElement.getBoundingClientRect();

                const top = rect.top + window.pageYOffset;
                const left = rect.left + window.pageXOffset;

                this.overlay.style.width = `${rect.width}px`;
                this.overlay.style.height = `${rect.height}px`;
                this.overlay.style.top = `${top}px`;
                this.overlay.style.left = `${left}px`;
                this.overlay.style.display = 'block';

                const tagName = this.hoveredElement.tagName.toLowerCase();
                const id = this.hoveredElement.id ? '#' + this.hoveredElement.id : '';
                this.label.textContent = `${tagName}${id}`;
            } catch (err) {
                console.error('[Snatcher] Position update error:', err);
            }
        }

        onKeyDown(e) {
            if (e.key === 'Escape') this.destroy();
        }

        onClick(e) {
            e.preventDefault();
            e.stopPropagation();

            if (this.hoveredElement) {
                this.snatch(this.hoveredElement);
            }

            this.destroy();
        }

        async snatch(el) {
            const outputMode = window.__NINJA_SNATCH__?.snatcherMode || window.snatcherMode || 'copy';
            const extractMode = window.__NINJA_SNATCH__?.snatcherExtractMode || window.snatcherExtractMode || 'clean';
            const smartSettings = window.__NINJA_SNATCH__?.smartExtractSettings || {};
            const useStyles = extractMode === 'styled';
            const useCompact = extractMode === 'compact' || extractMode === 'llm';
            const useSmart = extractMode === 'smart';

            // Debug logging
            console.log('[Snatcher] Mode detection:', {
                outputMode,
                extractMode,
                useSmart,
                smartExtractAvailable: !!window.__NINJA_SNATCH__?.SmartExtract,
                smartSettings
            });

            try {
                let html;
                let fullDoc;

                if (useSmart && window.__NINJA_SNATCH__?.SmartExtract) {
                    // Smart Extract mode - use new pipeline
                    const SmartExtract = window.__NINJA_SNATCH__.SmartExtract;

                    this.showToast('Обработка Smart Extract...', 'success');

                    const result = await SmartExtract.process(el, {
                        format: smartSettings.format || 'react-tailwind',
                        enableAI: smartSettings.enableAI || false,
                        apiKey: smartSettings.apiKey || null
                    });

                    html = result.code;

                    // For download, wrap in appropriate document
                    const isReact = (smartSettings.format || 'react-tailwind').includes('react');
                    const ext = isReact ? 'jsx' : 'html';

                    if (isReact) {
                        fullDoc = result.code;
                    } else {
                        fullDoc = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Smart Extract - ${el.tagName}</title>
<script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
${result.code}
</body>
</html>`;
                    }

                    // Log metadata
                    console.log('[SmartExtract] Extraction complete:', result.metadata);

                } else if (useCompact && window.StyleInjector) {
                    // Compact mode - clean output for Tailwind/Webflow
                    html = window.StyleInjector.createCompactExport
                        ? window.StyleInjector.createCompactExport(el)
                        : window.StyleInjector.createLLMExport(el); // Fallback
                    fullDoc = html;
                } else if (useStyles && window.StyleInjector) {
                    // Styled mode - full CSS included
                    html = window.StyleInjector.injectStyles(el);
                    fullDoc = window.StyleInjector.createStyledDocument(el, `Snatched: ${el.tagName}`);
                } else {
                    // Clean mode - raw HTML
                    const rawHTML = el.outerHTML;
                    const rawDoc = `<!DOCTYPE html>\n<html>\n<head>\n<meta charset="UTF-8">\n<title>Snatched: ${el.tagName}</title>\n</head>\n<body>\n${rawHTML}\n</body>\n</html>`;

                    if (window.StyleInjector?.prettifyHTML) {
                        html = window.StyleInjector.prettifyHTML(rawHTML);
                        fullDoc = window.StyleInjector.prettifyHTML(rawDoc);
                    } else {
                        html = rawHTML;
                        fullDoc = rawDoc;
                    }
                }

                if (outputMode === 'copy') {
                    await navigator.clipboard.writeText(html);
                    const msg = useSmart
                        ? 'Smart Extract скопирован! ✨'
                        : (useCompact ? 'Compact код скопирован! 📦' : (useStyles ? 'Код со стилями скопирован! 🎨' : 'Код скопирован в буфер! 📋'));
                    this.showToast(msg, 'success');
                } else {
                    // Используем background script для скачивания
                    const title = (el.tagName + '_' + (el.id || el.className || 'element')).substring(0, 30);
                    const modeSuffix = useSmart ? '_smart' : (useCompact ? '_compact' : (useStyles ? '_styled' : ''));
                    const ext = useSmart && (smartSettings.format || '').includes('react') ? 'jsx' : 'html';
                    const filename = title.replace(/[^a-z0-9]/gi, '_') + modeSuffix + '.' + ext;

                    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
                        chrome.runtime.sendMessage({
                            action: 'download',
                            data: { content: fullDoc, filename }
                        }, (response) => {
                            if (response && response.success) {
                                const msg = useSmart
                                    ? 'Smart Extract сохранён! ✨'
                                    : (useCompact ? 'Compact файл сохранён! 📦' : (useStyles ? 'Файл со стилями сохранён! 🎨' : 'Файл сохранён! 💾'));
                                this.showToast(msg, 'success');
                            } else {
                                // Fallback к прямому скачиванию
                                this.downloadFallback(fullDoc, filename);
                            }
                        });
                    } else {
                        // Fallback если chrome.runtime недоступен
                        this.downloadFallback(fullDoc, filename);
                    }
                }
            } catch (err) {
                console.error('[Snatcher] Snatch error:', err);
                this.showToast('Ошибка: ' + err.message, 'error');
            }
        }

        /**
         * Fallback-метод скачивания через Blob URL
         */
        downloadFallback(content, filename) {
            try {
                const blob = new Blob([content], { type: 'text/html' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                this.showToast('Файл сохранён! 💾', 'success');
            } catch (err) {
                this.showToast('Ошибка скачивания: ' + err.message, 'error');
            }
        }

        showToast(message, type = 'success') {
            const toast = document.createElement('div');
            toast.className = 'snatcher-toast';

            const icon = type === 'success' ? '✅' : '❌';
            const bgColor = type === 'success' ? '#10b981' : '#ef4444';

            toast.innerHTML = `<span>${icon}</span> ${message}`;
            toast.style.background = bgColor;
            document.body.appendChild(toast);

            requestAnimationFrame(() => {
                toast.classList.add('show');
            });

            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 400);
            }, 2500);
        }

        destroy() {
            try {
                document.removeEventListener('mousemove', this.boundMouseMove, true);
                document.removeEventListener('click', this.boundClick, true);
                document.removeEventListener('keydown', this.boundKeyDown, true);
                this.overlay.remove();
                document.body.style.cursor = '';
                window.__NINJA_SNATCH__.snatcherInstance = null;
            } catch (err) {
                console.error('[Snatcher] Destroy error:', err);
            }
        }
    }

    // Глобальный error handler
    try {
        new SniperSelector();
    } catch (err) {
        console.error('[Snatcher] Failed to initialize:', err);
    }
})();
