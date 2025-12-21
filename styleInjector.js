/**
 * Ninja-Snatch Style Injector v7.6
 * + External CSS: Webflow CDN, Framer stylesheets
 * + Improved matching: tags, IDs, data-*, universal selectors
 */

// Guard against multiple injections
if (typeof window.StyleInjector !== 'undefined') {
    console.log('StyleInjector already loaded, skipping...');
} else {

    const StyleInjector = {
        classCounter: 0,
        allKeyframes: [],
        allFontFaces: [],
        allCSSRules: [],
        cssVariables: new Map(),
        externalStylesheets: [],
        pageOrigin: '',

        /**
         * Инициализация
         */
        init() {
            this.pageOrigin = window.location.origin;
            this.allKeyframes = [];
            this.allFontFaces = [];
            this.allCSSRules = [];
            this.cssVariables = new Map();
            this.externalStylesheets = [];
            this.classCounter = 0;

            this.collectAllCSS();
        },

        /**
         * Собирает ВСЕ CSS со страницы
         */
        collectAllCSS() {
            // Inline стили
            document.querySelectorAll('style').forEach(style => {
                try {
                    if (style.sheet?.cssRules) {
                        for (const rule of style.sheet.cssRules) {
                            this.processRule(rule);
                        }
                    }
                } catch (e) { }
            });

            // Внешние таблицы стилей
            for (const sheet of document.styleSheets) {
                try {
                    const rules = sheet.cssRules || sheet.rules;
                    if (!rules) continue;
                    for (const rule of rules) {
                        this.processRule(rule);
                    }
                } catch (e) {
                    // Cross-origin — сохраняем ссылку для включения в экспорт
                    if (sheet.href) {
                        this.externalStylesheets.push(sheet.href);
                    }
                }
            }
        },

        /**
         * Собирает внешние стили (link tags)
         */
        collectExternalLinks() {
            const links = [];
            document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
                const href = link.getAttribute('href');
                if (href && (
                    href.includes('website-files.com') ||    // Webflow
                    href.includes('webflow.com') ||           // Webflow
                    href.includes('framer.com') ||            // Framer
                    href.includes('assets.') ||               // Various CDNs
                    href.startsWith('/') ||                   // Relative URLs
                    href.includes('.css')                     // Any CSS file
                )) {
                    // Конвертируем относительные в абсолютные
                    let absoluteHref = href;
                    if (href.startsWith('/') && !href.startsWith('//')) {
                        absoluteHref = this.pageOrigin + href;
                    }
                    links.push(`<link rel="stylesheet" href="${absoluteHref}">`);
                }
            });
            return [...new Set(links)].join('\n');
        },

        /**
         * Обрабатывает CSS правило
         */
        processRule(rule) {
            if (!rule) return;

            // Keyframes
            if (rule.type === CSSRule.KEYFRAMES_RULE) {
                this.allKeyframes.push(rule.cssText);
                return;
            }

            // Font-face — фиксим относительные URL
            if (rule.type === CSSRule.FONT_FACE_RULE) {
                let cssText = rule.cssText;
                // Конвертируем относительные URL в абсолютные
                cssText = this.fixRelativeURLs(cssText);
                this.allFontFaces.push(cssText);
                return;
            }

            // Style rules
            if (rule.type === CSSRule.STYLE_RULE) {
                this.allCSSRules.push({
                    selector: rule.selectorText,
                    cssText: rule.cssText
                });

                // CSS переменные
                if (rule.selectorText === ':root' || rule.selectorText === 'html') {
                    for (let i = 0; i < rule.style.length; i++) {
                        const prop = rule.style[i];
                        if (prop.startsWith('--')) {
                            this.cssVariables.set(prop, rule.style.getPropertyValue(prop));
                        }
                    }
                }
                return;
            }

            // Media queries — рекурсивно
            if (rule.type === CSSRule.MEDIA_RULE) {
                for (const innerRule of rule.cssRules) {
                    this.processRule(innerRule);
                }
            }
        },

        /**
         * Фиксит относительные URL на абсолютные
         */
        fixRelativeURLs(cssText) {
            return cssText.replace(/url\(["']?(\.\.\/[^"')]+|\.\/[^"')]+)["']?\)/g, (match, path) => {
                try {
                    const absoluteUrl = new URL(path, this.pageOrigin).href;
                    return `url("${absoluteUrl}")`;
                } catch {
                    return match;
                }
            });
        },

        /**
         * Очищает клон от browser extensions (БЕЗОПАСНО)
         */
        cleanHTML(clone) {
            // Удаляем только очевидные расширения по специфичным селекторам
            const extensionSelectors = [
                '[id="moat-moat"]',           // Drawbridge/Moat
                '[class^="float-moat"]',
                '[id*="grammarly"]',          // Grammarly
                '[class*="grammarly"]',
                '[data-grammarly-shadow-root]',
                'grammarly-extension',
                '[id*="lastpass"]',           // LastPass  
                '[data-dashlane]',            // Dashlane
                'next-route-announcer',       // Next.js internal
                '[src^="chrome-extension://"]'
            ];

            extensionSelectors.forEach(selector => {
                try {
                    clone.querySelectorAll(selector).forEach(el => el.remove());
                } catch (e) { }
            });

            // ВАЖНО: Сохраняем скрипты анимаций (Webflow, GSAP, Framer Motion)
            // Удаляем только скрипты расширений и аналитики
            clone.querySelectorAll('script').forEach(script => {
                const src = script.getAttribute('src') || '';
                const content = script.textContent || '';

                // Скрипты, которые нужно СОХРАНИТЬ для анимаций
                const keepPatterns = [
                    'webflow',
                    'jquery',
                    'gsap',
                    'framer',
                    'motion',
                    'anime',
                    'lottie',
                    'scroll',
                    'animation',
                    'w-', // Webflow widgets
                    'Webflow'
                ];

                // Скрипты, которые УДАЛЯЕМ (аналитика, расширения)
                const removePatterns = [
                    'chrome-extension://',
                    'analytics',
                    'gtag',
                    'gtm',
                    'google-analytics',
                    'facebook',
                    'pixel',
                    'hotjar',
                    'crisp',
                    'intercom',
                    'zendesk'
                ];

                // Проверяем нужно ли сохранить
                const shouldKeep = keepPatterns.some(pattern =>
                    src.toLowerCase().includes(pattern) ||
                    content.toLowerCase().includes(pattern)
                );

                // Проверяем нужно ли удалить
                const shouldRemove = removePatterns.some(pattern =>
                    src.toLowerCase().includes(pattern)
                );

                // Удаляем только если явно нужно удалить И не нужно сохранять
                if (shouldRemove && !shouldKeep) {
                    script.remove();
                }
            });

            return clone;
        },

        /**
         * Исправляет состояния анимаций — сбрасывает начальные состояния JS-анимаций
         * Делает элементы видимыми без JavaScript
         */
        fixAnimationStates(clone) {
            // Паттерны inline-стилей, которые скрывают элементы (начальные состояния анимаций)
            clone.querySelectorAll('[style]').forEach(el => {
                const style = el.getAttribute('style');
                if (!style) return;

                // Пропускаем если это display:none (это не анимация, это скрытый элемент)
                if (/display\s*:\s*none/i.test(style)) return;

                let fixed = style;

                // УДАЛЯЕМ opacity полностью если оно низкое (< 0.5) — это начальные состояния анимаций
                // Матчим: opacity: 0, opacity: 0.1, opacity: 0.0674 и т.д.
                const opacityMatch = fixed.match(/opacity\s*:\s*([\d.]+)/i);
                if (opacityMatch) {
                    const opacityValue = parseFloat(opacityMatch[1]);
                    if (opacityValue < 0.5) {
                        // Удаляем opacity полностью, чтобы CSS анимации работали
                        fixed = fixed.replace(/opacity\s*:\s*[\d.]+\s*(;|$)/gi, '$1');
                    }
                }

                // УДАЛЯЕМ transform с translate полностью (чтобы CSS анимации работали!)
                fixed = fixed.replace(/transform\s*:\s*translate3d\([^)]+\)[^;]*(;|$)/gi, '$1');
                fixed = fixed.replace(/transform\s*:\s*translateY\([^)]+\)[^;]*(;|$)/gi, '$1');
                fixed = fixed.replace(/transform\s*:\s*translateX\([^)]+\)[^;]*(;|$)/gi, '$1');

                // Убираем will-change (оптимизация для JS-анимаций, не нужна в статике)
                fixed = fixed.replace(/will-change\s*:[^;]+(;|$)/gi, '$1');

                // Убираем transform-style: preserve-3d (не нужен без transform)
                fixed = fixed.replace(/transform-style\s*:\s*preserve-3d\s*(;|$)/gi, '$1');

                // Чистим лишние точки с запятой и пробелы
                fixed = fixed.replace(/;\s*;+/g, ';').replace(/^\s*;+\s*/g, '').replace(/\s*;+\s*$/g, '').trim();

                if (fixed !== style) {
                    if (fixed) {
                        el.setAttribute('style', fixed);
                    } else {
                        el.removeAttribute('style');
                    }
                }
            });

            return clone;
        },

        /**
         * Фиксит URL в HTML атрибутах (src, href, srcset)
         */
        fixHTMLUrls(clone) {
            const urlAttributes = ['src', 'href', 'srcset', 'data-src', 'poster'];

            clone.querySelectorAll('*').forEach(el => {
                urlAttributes.forEach(attr => {
                    const value = el.getAttribute(attr);
                    if (!value) return;

                    // Пропускаем data: URL и абсолютные URL
                    if (value.startsWith('data:') || value.startsWith('http://') ||
                        value.startsWith('https://') || value.startsWith('//')) {
                        return;
                    }

                    // Фиксим /_next/ и другие относительные пути
                    if (value.startsWith('/')) {
                        try {
                            const absoluteUrl = new URL(value, this.pageOrigin).href;

                            // Для srcset нужна особая обработка
                            if (attr === 'srcset') {
                                const fixed = value.split(',').map(part => {
                                    const [url, size] = part.trim().split(/\s+/);
                                    if (url.startsWith('/')) {
                                        return new URL(url, this.pageOrigin).href + (size ? ' ' + size : '');
                                    }
                                    return part;
                                }).join(', ');
                                el.setAttribute(attr, fixed);
                            } else {
                                el.setAttribute(attr, absoluteUrl);
                            }
                        } catch (e) { }
                    }
                });
            });

            // Фиксим inline стили с url()
            clone.querySelectorAll('[style]').forEach(el => {
                const style = el.getAttribute('style');
                if (style && style.includes('url(')) {
                    const fixed = style.replace(/url\(["']?([^"')]+)["']?\)/g, (match, path) => {
                        if (path.startsWith('/') && !path.startsWith('//')) {
                            try {
                                return `url("${new URL(path, this.pageOrigin).href}")`;
                            } catch (e) { }
                        }
                        return match;
                    });
                    el.setAttribute('style', fixed);
                }
            });

            return clone;
        },

        /**
         * Форматирует HTML для читаемости
         */
        prettifyHTML(html) {
            // Теги, которые не нужно разбивать
            const inlineTags = ['a', 'span', 'strong', 'em', 'b', 'i', 'u', 'small', 'sub', 'sup', 'code'];

            let formatted = '';
            let indent = 0;
            const indentStr = '  '; // 2 пробела

            // Разбиваем по тегам
            const tokens = html.replace(/>\s*</g, '>\n<').split('\n');

            for (let token of tokens) {
                token = token.trim();
                if (!token) continue;

                // Закрывающий тег — уменьшаем отступ
                if (token.match(/^<\/\w/) && !token.match(/^<\/(a|span|strong|em|b|i|u|small|sub|sup|code)>/i)) {
                    indent = Math.max(0, indent - 1);
                }

                // Добавляем строку с отступом
                formatted += indentStr.repeat(indent) + token + '\n';

                // Открывающий тег (не self-closing и не inline) — увеличиваем отступ
                if (token.match(/^<\w[^>]*[^\/]>$/) &&
                    !token.match(/^<(img|br|hr|input|meta|link|area|base|col|embed|param|source|track|wbr)/i) &&
                    !token.match(/^<(a|span|strong|em|b|i|u|small|sub|sup|code)\s/i) &&
                    !token.includes('</')) {
                    indent++;
                }

                // Self-closing тег — не меняем отступ
                if (token.match(/\/>$/)) {
                    // do nothing
                }
            }

            // Чистим пустые строки подряд
            formatted = formatted.replace(/\n\s*\n\s*\n/g, '\n\n');

            return formatted;
        },

        /**
         * Собирает все классы, используемые элементом и потомками
         */
        collectUsedClasses(element) {
            const classes = new Set();

            const traverse = (el) => {
                if (el.nodeType !== Node.ELEMENT_NODE) return;
                el.classList.forEach(c => classes.add(c));
                for (const child of el.children) traverse(child);
            };

            traverse(element);
            return classes;
        },

        /**
         * Находит CSS правила, которые матчат использованные классы, теги, IDs
         */
        getMatchedCSSRules(usedClasses, element) {
            const matchedRules = [];

            // Собираем все использованные теги и IDs
            const usedTags = new Set();
            const usedIds = new Set();
            const usedDataAttrs = new Set();

            const collectSelectors = (el) => {
                if (el.nodeType !== Node.ELEMENT_NODE) return;
                usedTags.add(el.tagName.toLowerCase());
                if (el.id) usedIds.add(el.id);
                // Собираем data-атрибуты
                for (const attr of el.attributes) {
                    if (attr.name.startsWith('data-')) {
                        usedDataAttrs.add(attr.name);
                    }
                }
                for (const child of el.children) collectSelectors(child);
            };

            if (element) collectSelectors(element);

            for (const rule of this.allCSSRules) {
                const selector = rule.selector;
                let shouldInclude = false;

                // 1. Проверяем классы
                for (const cls of usedClasses) {
                    if (selector.includes('.' + cls)) {
                        shouldInclude = true;
                        break;
                    }
                }

                // 2. Проверяем теги
                if (!shouldInclude) {
                    for (const tag of usedTags) {
                        // Матчим tag в начале или после пробела/запятой
                        const tagPattern = new RegExp(`(^|[\\s,>+~])${tag}([\\s,.:#\\[>+~]|$)`, 'i');
                        if (tagPattern.test(selector)) {
                            shouldInclude = true;
                            break;
                        }
                    }
                }

                // 3. Проверяем IDs
                if (!shouldInclude) {
                    for (const id of usedIds) {
                        if (selector.includes('#' + id)) {
                            shouldInclude = true;
                            break;
                        }
                    }
                }

                // 4. Проверяем data-атрибутные селекторы
                if (!shouldInclude) {
                    for (const dataAttr of usedDataAttrs) {
                        if (selector.includes('[' + dataAttr)) {
                            shouldInclude = true;
                            break;
                        }
                    }
                }

                // 5. Универсальные правила (*, :root, html, body)
                if (!shouldInclude) {
                    if (selector === '*' ||
                        selector.startsWith('*,') ||
                        selector.includes(' *') ||
                        selector === ':root' ||
                        selector === 'html' ||
                        selector === 'body' ||
                        selector.startsWith('html ') ||
                        selector.startsWith('body ') ||
                        selector.startsWith(':root ') ||
                        selector.includes('::selection') ||
                        selector.includes(':focus') ||
                        selector.includes(':hover') ||
                        selector.includes('::before') ||
                        selector.includes('::after') ||
                        selector.includes('::-webkit') ||
                        selector.includes('::placeholder')) {
                        shouldInclude = true;
                    }
                }

                // 6. Keyframe-связанные селекторы (animation-)
                if (!shouldInclude && selector.includes('[class*=')) {
                    shouldInclude = true;
                }

                if (shouldInclude) {
                    matchedRules.push(rule.cssText);
                }
            }

            return [...new Set(matchedRules)];
        },

        /**
         * Собирает Google Fonts
         */
        collectGoogleFonts() {
            const fonts = [];

            document.querySelectorAll('link[href*="fonts.googleapis.com"]').forEach(link => {
                fonts.push(`@import url('${link.href}');`);
            });

            return fonts.join('\n');
        },

        /**
         * Генерирует CSS переменные
         */
        generateCSSVariables() {
            if (this.cssVariables.size === 0) return '';

            let css = ':root {\n';
            this.cssVariables.forEach((value, name) => {
                css += `  ${name}: ${value};\n`;
            });
            css += '}\n\n';

            return css;
        },

        /**
         * Генерирует CSS reveal-анимации (универсально для всех фреймворков)
         * Webflow, Next.js, Framer Motion, GSAP — все получают CSS fallback
         */
        generateRevealAnimations(element) {
            // Проверяем наличие элементов с inline style (признак JS-анимаций)
            const hasAnimatedElements = element.querySelector('[style*="opacity"]') !== null ||
                element.querySelector('[style*="transform"]') !== null ||
                element.querySelector('[data-w-id]') !== null;

            // Всегда генерируем CSS для Next.js/Framer Motion (они не имеют data-w-id)
            // но имеют inline styles с opacity и transform

            return `
/* Ninja-Snatch Universal Reveal Animations v7.5 */

/* CRITICAL: Force visibility - override ALL inline opacity/transform */
*[style*="opacity"] {
    opacity: 1 !important;
}

*[style*="transform"] {
    transform: none !important;
}

/* Webflow specific */
[data-w-id] {
    opacity: 1 !important;
    transform: none !important;
}

/* Framer Motion / React specific */
[style*="opacity: 0"],
[style*="opacity:0"] {
    opacity: 1 !important;
}

/* Entrance animations with staggered delays */
@keyframes snatch-fade-up {
    from { 
        opacity: 0; 
        transform: translateY(20px); 
    }
    to { 
        opacity: 1; 
        transform: translateY(0); 
    }
}

@keyframes snatch-fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
}

/* Apply to common section patterns */
section,
main > div,
header,
.section,
.hero,
.hero-content,
.container-wide > div,
article {
    animation: snatch-fade-up 0.6s ease-out forwards;
}

/* Staggered cascade effect */
section:nth-of-type(1) { animation-delay: 0s; }
section:nth-of-type(2) { animation-delay: 0.1s; }
section:nth-of-type(3) { animation-delay: 0.2s; }
section:nth-of-type(4) { animation-delay: 0.3s; }
section:nth-of-type(5) { animation-delay: 0.4s; }
section:nth-of-type(n+6) { animation-delay: 0.5s; }

/* Grid children animation */
.grid > * {
    animation: snatch-fade-up 0.5s ease-out forwards;
}

.grid > *:nth-child(1) { animation-delay: 0s; }
.grid > *:nth-child(2) { animation-delay: 0.05s; }
.grid > *:nth-child(3) { animation-delay: 0.1s; }
.grid > *:nth-child(4) { animation-delay: 0.15s; }
.grid > *:nth-child(5) { animation-delay: 0.2s; }
.grid > *:nth-child(n+6) { animation-delay: 0.25s; }

/* Marquee animations (Webflow style) */
.marquee-track, [class*="marquee"] > div {
    animation: snatch-marquee 25s linear infinite;
}

.marquee-reverse-track {
    animation: snatch-marquee 25s linear infinite reverse;
}

@keyframes snatch-marquee {
    from { transform: translateX(0) !important; }
    to { transform: translateX(-50%) !important; }
}

/* Hover effects */
a:hover img,
.group:hover img {
    transform: scale(1.02) !important;
    transition: transform 0.4s ease;
}

button:hover,
a[class*="btn"]:hover {
    transform: translateY(-2px) !important;
    transition: transform 0.2s ease;
}

/* Ensure images are visible */
img {
    opacity: 1 !important;
}
`;
        },

        /**
         * Применяет стили и возвращает HTML
         * НЕ УБИРАЕТ оригинальные классы!
         */
        injectStyles(element) {
            this.init();

            let clone = element.cloneNode(true);

            // Очистка от расширений и фикс URL
            clone = this.cleanHTML(clone);
            clone = this.fixHTMLUrls(clone);
            clone = this.fixAnimationStates(clone);

            const usedClasses = this.collectUsedClasses(element);
            const matchedRules = this.getMatchedCSSRules(usedClasses, element);

            // Google Fonts
            const googleFonts = this.collectGoogleFonts();

            // Font-faces
            const fontFaces = [...new Set(this.allFontFaces)].join('\n\n');

            // Keyframes
            const keyframes = [...new Set(this.allKeyframes)].join('\n\n');

            // CSS variables
            const variables = this.generateCSSVariables();

            // Matched CSS rules
            const matchedCSS = matchedRules.join('\n\n');

            // Reveal animations
            const revealAnimations = this.generateRevealAnimations(element);

            // External stylesheets (Webflow, Framer, etc.)
            const externalLinks = this.collectExternalLinks();

            const rawHTML = `${externalLinks}
<style>
/* Ninja-Snatch v7.6 */
${googleFonts}

${fontFaces}

${variables}

${keyframes}

${matchedCSS}

${revealAnimations}
</style>

${clone.outerHTML}`;

            return this.prettifyHTML(rawHTML);
        },

        /**
         * Создаёт полный документ
         */
        createStyledDocument(element, title = 'Snatched Content') {
            this.init();

            let clone = element.cloneNode(true);

            // Очистка от расширений и фикс URL
            clone = this.cleanHTML(clone);
            clone = this.fixHTMLUrls(clone);
            clone = this.fixAnimationStates(clone);

            const usedClasses = this.collectUsedClasses(element);
            const matchedRules = this.getMatchedCSSRules(usedClasses, element);

            // Google Fonts
            const googleFonts = this.collectGoogleFonts();

            // Font-faces с абсолютными URL
            const fontFaces = [...new Set(this.allFontFaces)].join('\n\n');

            // Keyframes
            const keyframes = [...new Set(this.allKeyframes)].join('\n\n');

            // CSS variables
            const variables = this.generateCSSVariables();

            // Matched CSS rules
            const matchedCSS = matchedRules.join('\n\n');

            // Tailwind detection
            const hasTailwind = usedClasses.size > 20 &&
                [...usedClasses].some(c => /^(flex|grid|hidden|p-|m-|w-|h-|text-|bg-)/.test(c));

            const tailwindScript = hasTailwind
                ? '<script src="https://cdn.tailwindcss.com"></script>'
                : '';

            // Reveal animations for Webflow elements
            const revealAnimations = this.generateRevealAnimations(element);

            // External stylesheets (Webflow, Framer, etc.)
            const externalLinks = this.collectExternalLinks();

            // Body styles
            const bodyStyle = window.getComputedStyle(document.body);

            const rawHTML = `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
${externalLinks}
${tailwindScript}
<style>
/* Ninja-Snatch v7.6 + External CSS */
${googleFonts}

${fontFaces}

${variables}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  background: ${bodyStyle.backgroundColor || '#000'};
  color: ${bodyStyle.color || '#fff'};
  font-family: ${bodyStyle.fontFamily};
  min-height: 100vh;
}

${keyframes}

${matchedCSS}

${revealAnimations}
</style>
</head>
<body>
${clone.outerHTML}
</body>
</html>`;

            return this.prettifyHTML(rawHTML);
        }
    };

    if (typeof window !== 'undefined') {
        window.StyleInjector = StyleInjector;
    }

} // end guard
