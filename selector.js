(function () {
    if (window.snatcherInstance) return;

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
            document.body.appendChild(this.overlay);
            document.addEventListener('mousemove', this.boundMouseMove, true);
            document.addEventListener('scroll', () => this.updatePosition(), true);
            document.addEventListener('click', this.boundClick, true);
            document.addEventListener('keydown', this.boundKeyDown, true);
            document.body.style.cursor = 'crosshair';
            window.snatcherInstance = this;
        }

        onMouseMove(e) {
            const el = e.target;
            if (el === this.overlay || el === this.label) return;

            this.hoveredElement = el;
            this.updatePosition();
        }

        updatePosition() {
            if (!this.hoveredElement) return;

            const rect = this.hoveredElement.getBoundingClientRect();

            // Используем координаты относительно документа для корректного отображения при скролле
            const top = rect.top + window.pageYOffset;
            const left = rect.left + window.pageXOffset;

            this.overlay.style.width = `${rect.width}px`;
            this.overlay.style.height = `${rect.height}px`;
            this.overlay.style.top = `${top}px`;
            this.overlay.style.left = `${left}px`;
            this.overlay.style.display = 'block';

            this.label.textContent = `${this.hoveredElement.tagName.toLowerCase()}${this.hoveredElement.id ? '#' + this.hoveredElement.id : ''}`;
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
            const mode = window.snatcherMode || 'copy';
            let html = el.outerHTML;

            const fullDoc = `<!DOCTYPE html>\n<html>\n<head>\n<meta charset="UTF-8">\n</head>\n<body>\n${html}\n</body>\n</html>`;

            if (mode === 'copy') {
                const textToCopy = html; // Копируем только кусок HTML для сниппетов
                try {
                    await navigator.clipboard.writeText(textToCopy);
                    this.showToast("Код скопирован в буфер! 📋");
                } catch (err) {
                    console.error("Copy failed", err);
                }
            } else {
                const title = (el.tagName + '_' + (el.id || el.className || 'element')).substring(0, 30);
                this.download(fullDoc, `${title.replace(/[^a-z0-9]/gi, '_')}.html`);
            }
        }

        showToast(message) {
            const toast = document.createElement('div');
            toast.className = 'snatcher-toast';
            toast.innerHTML = `<span>✅</span> ${message}`;
            document.body.appendChild(toast);

            // Показываем с задержкой для инициализации анимации
            requestAnimationFrame(() => {
                toast.classList.add('show');
            });

            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 400);
            }, 2500);
        }

        download(content, filename) {
            const blob = new Blob([content], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }

        destroy() {
            document.removeEventListener('mousemove', this.boundMouseMove, true);
            document.removeEventListener('click', this.boundClick, true);
            document.removeEventListener('keydown', this.boundKeyDown, true);
            this.overlay.remove();
            document.body.style.cursor = '';
            window.snatcherInstance = null;
        }
    }

    new SniperSelector();
})();
