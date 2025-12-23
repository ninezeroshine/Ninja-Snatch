/**
 * Smart Extract v2.0
 * 
 * Полное извлечение сайта с сохранением визуальной идентичности
 * и организацией кода для читаемости.
 * 
 * Архитектура:
 * 1. Использует StyleInjector для получения полной копии
 * 2. Code Organizer группирует inline стили в классы
 * 3. Опциональное AI улучшение имён и структуры
 */

// Initialize namespace
window.__NINJA_SNATCH__ = window.__NINJA_SNATCH__ || {};

// Guard against multiple injections
if (typeof window.__NINJA_SNATCH__.SmartExtract !== 'undefined') {
    console.log('[SmartExtract] Already loaded, skipping...');
} else {

    (function () {
        'use strict';

        const VERSION = '2.0.0';

        // ═══════════════════════════════════════════════════════════════════════
        // FRAMEWORK DETECTION (сохранено из v1)
        // ═══════════════════════════════════════════════════════════════════════

        const FRAMEWORK_SIGNATURES = {
            'next.js': ['__NEXT_DATA__', '_next', 'next/'],
            'nuxt': ['__NUXT__', '_nuxt', 'nuxt/'],
            'gatsby': ['___gatsby', 'gatsby-'],
            'react': ['__react', 'data-reactroot', 'react-'],
            'vue': ['__vue__', 'data-v-', 'v-'],
            'angular': ['ng-', '_ngcontent', 'ng-version'],
            'svelte': ['svelte-', '__svelte'],
            'webflow': ['w-', 'wf-', 'webflow'],
            'framer': ['framer-', '__framer']
        };

        function detectFramework() {
            const detected = [];
            const html = document.documentElement.outerHTML.substring(0, 50000);
            const scripts = Array.from(document.scripts).map(s => s.src + ' ' + s.textContent).join(' ');

            for (const [name, sigs] of Object.entries(FRAMEWORK_SIGNATURES)) {
                if (sigs.some(sig => html.includes(sig) || scripts.includes(sig))) {
                    detected.push(name);
                }
            }

            // Detect animation libraries
            const animationLibs = [];
            if (html.includes('framer-motion') || html.includes('motion/')) animationLibs.push('framer-motion');
            if (html.includes('gsap') || html.includes('greensock')) animationLibs.push('gsap');
            if (html.includes('lenis') || html.includes('scroll-smooth')) animationLibs.push('lenis');
            if (html.includes('locomotive')) animationLibs.push('locomotive-scroll');
            if (html.includes('anime.js') || html.includes('animejs')) animationLibs.push('anime.js');
            if (html.includes('lottie')) animationLibs.push('lottie');

            return {
                framework: detected[0] || 'unknown',
                all: detected,
                animations: animationLibs
            };
        }

        // ═══════════════════════════════════════════════════════════════════════
        // PATTERN RECOGNITION (сохранено из v1)
        // ═══════════════════════════════════════════════════════════════════════

        function getElementSignature(el) {
            const tag = el.tagName.toLowerCase();
            const classes = Array.from(el.classList).sort().join('.');
            const childTags = Array.from(el.children).map(c => c.tagName.toLowerCase()).join(',');
            return `${tag}|${classes}|${childTags}`;
        }

        function calculateSimilarity(sig1, sig2) {
            if (sig1 === sig2) return 1;
            const parts1 = sig1.split('|');
            const parts2 = sig2.split('|');
            let score = 0;
            if (parts1[0] === parts2[0]) score += 0.3; // same tag
            if (parts1[1] === parts2[1]) score += 0.4; // same classes
            if (parts1[2] === parts2[2]) score += 0.3; // same children
            return score;
        }

        function findRepeatingPatterns(element, minOccurrences = 2) {
            const signatureMap = new Map();
            const traverse = (el) => {
                if (el.children.length > 0) {
                    const sig = getElementSignature(el);
                    if (!signatureMap.has(sig)) signatureMap.set(sig, []);
                    signatureMap.get(sig).push(el);
                }
                for (const child of el.children) traverse(child);
            };
            traverse(element);

            return Array.from(signatureMap.entries())
                .filter(([_, els]) => els.length >= minOccurrences)
                .map(([sig, els]) => ({
                    signature: sig,
                    count: els.length,
                    elements: els,
                    tag: sig.split('|')[0]
                }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 10);
        }

        // ═══════════════════════════════════════════════════════════════════════
        // CODE ORGANIZER (новый модуль v2)
        // ═══════════════════════════════════════════════════════════════════════

        /**
         * Извлекает все inline стили из HTML
         * @param {Document} doc - Parsed HTML document
         * @returns {Map} Map of style string -> array of elements
         */
        function extractInlineStyles(doc) {
            const styleMap = new Map();

            doc.querySelectorAll('[style]').forEach(el => {
                const style = el.getAttribute('style');
                if (!style || style.trim() === '') return;

                // Нормализуем стиль для сравнения
                const normalized = normalizeStyleString(style);

                if (!styleMap.has(normalized)) {
                    styleMap.set(normalized, {
                        original: style,
                        elements: [],
                        count: 0
                    });
                }

                styleMap.get(normalized).elements.push(el);
                styleMap.get(normalized).count++;
            });

            return styleMap;
        }

        /**
         * Нормализует строку стилей для сравнения
         */
        function normalizeStyleString(style) {
            return style
                .split(';')
                .map(s => s.trim())
                .filter(s => s)
                .sort()
                .join(';');
        }

        /**
         * Генерирует семантическое имя класса на основе контекста
         */
        function generateClassName(el, index, styleHint) {
            // Пытаемся определить назначение элемента
            const tag = el.tagName.toLowerCase();
            // className может быть SVGAnimatedString для SVG элементов
            const existingClass = typeof el.className === 'string' ? el.className : (el.className?.baseVal || '');
            const text = el.textContent?.trim().substring(0, 20) || '';

            // Приоритет: существующий семантический класс
            const semanticClasses = existingClass.split(/\s+/).find(c =>
                !c.includes('_') &&
                !c.match(/^[a-z0-9]{20,}$/) &&
                c.length > 2 &&
                c.length < 30
            );

            if (semanticClasses) {
                return `snatch-${semanticClasses}`;
            }

            // Определяем по тегу и позиции
            const tagHints = {
                'header': 'header',
                'nav': 'nav',
                'main': 'main',
                'section': 'section',
                'article': 'article',
                'aside': 'sidebar',
                'footer': 'footer',
                'button': 'btn',
                'a': 'link',
                'img': 'img',
                'h1': 'title',
                'h2': 'heading',
                'h3': 'subheading',
                'p': 'text',
                'ul': 'list',
                'li': 'item',
                'form': 'form',
                'input': 'input'
            };

            const base = tagHints[tag] || 'element';
            return `snatch-${base}-${index}`;
        }

        /**
         * Группирует дублирующиеся стили и создаёт классы
         * @param {Map} styleMap - Результат extractInlineStyles
         * @returns {Object} { classes: Map, cssRules: string }
         */
        function groupDuplicateStyles(styleMap) {
            const classes = new Map(); // style -> className
            const cssRules = [];
            let classIndex = 0;

            // Сортируем по количеству использований (больше = выше приоритет)
            const sorted = Array.from(styleMap.entries())
                .filter(([_, data]) => data.count >= 2) // Только повторяющиеся
                .sort((a, b) => b[1].count - a[1].count);

            for (const [normalizedStyle, data] of sorted) {
                classIndex++;
                const firstEl = data.elements[0];
                const className = generateClassName(firstEl, classIndex, data.original);

                classes.set(normalizedStyle, className);
                cssRules.push(`.${className} { ${data.original} }`);
            }

            return {
                classes,
                cssRules: cssRules.join('\n')
            };
        }

        /**
         * Заменяет inline стили на классы
         */
        function replaceInlineWithClasses(doc, classes) {
            doc.querySelectorAll('[style]').forEach(el => {
                const style = el.getAttribute('style');
                if (!style) return;

                const normalized = normalizeStyleString(style);
                const className = classes.get(normalized);

                if (className) {
                    // Добавляем класс
                    el.classList.add(className);
                    // Удаляем inline стиль
                    el.removeAttribute('style');
                }
            });

            return doc;
        }

        /**
         * Очищает CSS module хеши из классов
         * ВАЖНО: Удаляет только настоящие хеши, сохраняет Tailwind классы!
         */
        function cleanCSSModuleHashes(doc) {
            // Общие суффиксы Tailwind которые НЕ являются хешами
            const validSuffixes = new Set([
                'primary', 'secondary', 'tertiary', 'muted',
                'center', 'between', 'around', 'evenly', 'start', 'end',
                'auto', 'none', 'full', 'screen', 'hidden', 'visible',
                'wrap', 'nowrap', 'reverse', 'grow', 'shrink',
                'normal', 'medium', 'bold', 'light', 'semibold',
                'black', 'white', 'transparent', 'current',
                'hover', 'focus', 'active', 'disabled',
                'small', 'large', 'default', 'accent', 'warm'
            ]);

            doc.querySelectorAll('[class]').forEach(el => {
                try {
                    const cleaned = Array.from(el.classList)
                        .map(cls => {
                            // Pattern 1: CSS Modules с подчёркиванием и числами
                            // Example: __className_hash_123 -> className
                            const cssModuleMatch = cls.match(/^_+(.+?)_[a-z0-9]{4,}_\d+$/i);
                            if (cssModuleMatch) return cssModuleMatch[1];

                            // Pattern 2: Next.js module pattern с __ в середине
                            // Example: module__WBQBPq__variable -> variable
                            const nextModuleMatch = cls.match(/^[a-z]+_[a-z0-9]+__([a-z]+)$/i);
                            if (nextModuleMatch) return nextModuleMatch[1];

                            // Pattern 3: Хеш в конце - ТОЛЬКО если это именно хеш (не слово)
                            // Хеш должен быть: только буквы+цифры, смешанные, 6+ символов
                            const hashEndMatch = cls.match(/^(.+?)[-_]([a-z0-9]{6,})$/i);
                            if (hashEndMatch) {
                                const suffix = hashEndMatch[2].toLowerCase();
                                // Пропускаем если это валидный суффикс Tailwind
                                if (validSuffixes.has(suffix)) return cls;
                                // Проверяем что это похоже на хеш: содержит И буквы И цифры
                                const hasLetters = /[a-z]/i.test(suffix);
                                const hasDigits = /[0-9]/.test(suffix);
                                if (hasLetters && hasDigits) {
                                    return hashEndMatch[1];
                                }
                            }

                            return cls;
                        })
                        .filter((cls, i, arr) => arr.indexOf(cls) === i); // Remove duplicates

                    // Use setAttribute for SVG compatibility
                    el.setAttribute('class', cleaned.join(' '));
                } catch (e) {
                    // Skip elements that can't be modified
                }
            });

            return doc;
        }

        /**
         * Форматирует HTML с читаемыми отступами
         */
        function formatHTML(html) {
            const selfClosing = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
            const blockTags = new Set(['html', 'head', 'body', 'header', 'footer', 'main', 'nav', 'section', 'article', 'aside', 'div', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'table', 'tr', 'td', 'th', 'form', 'fieldset', 'script', 'style', 'link', 'meta', 'title']);
            const preserveTags = new Set(['script', 'style', 'pre', 'code', 'textarea']);

            let result = '', indent = 0, inPreserve = false, preserveTag = '';
            const tokens = html.match(/<[^>]+>|[^<]+/g) || [];

            for (const token of tokens) {
                if (token.startsWith('<')) {
                    const isClosing = token.startsWith('</');
                    const tagMatch = token.match(/<\/?([a-zA-Z0-9]+)/);
                    const tagName = tagMatch ? tagMatch[1].toLowerCase() : '';
                    const isSelfClosing = token.endsWith('/>') || selfClosing.has(tagName);

                    if (preserveTags.has(tagName)) {
                        if (isClosing) { inPreserve = false; preserveTag = ''; }
                        else if (!isSelfClosing) { inPreserve = true; preserveTag = tagName; }
                    }

                    if (inPreserve && !token.includes(`<${preserveTag}`) && !token.includes(`</${preserveTag}`)) {
                        result += token;
                        continue;
                    }

                    if (isClosing) indent = Math.max(0, indent - 1);
                    if (blockTags.has(tagName)) result += '\n' + '  '.repeat(indent) + token;
                    else result += token;
                    if (!isClosing && !isSelfClosing && blockTags.has(tagName)) indent++;
                } else {
                    const trimmed = token.trim();
                    if (trimmed) result += inPreserve ? token : trimmed;
                }
            }

            return result.replace(/\n{3,}/g, '\n\n').trim();
        }

        // ═══════════════════════════════════════════════════════════════════════
        // AI ENHANCER (обновлённый с поддержкой SmartStyleInjector)
        // ═══════════════════════════════════════════════════════════════════════

        const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
        const DEFAULT_MODEL = 'google/gemini-2.0-flash-001';

        /**
         * Generates rich AI prompt with extraction context
         * @param {string} html - HTML to enhance
         * @param {Object} context - Extraction context from SmartStyleInjector
         * @returns {string}
         */
        function generateAIPrompt(html, context = {}) {
            let prompt = `Ты эксперт по веб-разработке. Улучши этот HTML для максимальной читаемости и функциональности.

## Задачи:
1. Переименуй классы snatch-* в семантические имена (hero-section, nav-menu, card-grid)
2. Сгруппируй похожие CSS правила
3. Добавь комментарии к основным секциям
4. НЕ МЕНЯЙ функциональность и стили

`;

            // Add animation context if available
            if (context.animations && context.animations.length > 0) {
                prompt += `## Найденные анимации (${context.animations.length}):\n`;
                context.animations.slice(0, 5).forEach((anim, i) => {
                    prompt += `${i + 1}. ${anim.type} (trigger: ${anim.trigger}, duration: ${anim.duration}ms)\n`;
                    if (anim.from && Object.keys(anim.from).length > 0) {
                        prompt += `   From: ${JSON.stringify(anim.from)}\n`;
                    }
                });
                prompt += `\nУбедись, что анимации работают корректно в итоговом коде.\n\n`;
            }

            // Add cursor context if available
            if (context.cursors && context.cursors.length > 0) {
                prompt += `## Кастомные курсоры (${context.cursors.length}):\n`;
                context.cursors.forEach((cursor, i) => {
                    prompt += `${i + 1}. ${cursor.type}\n`;
                    if (cursor.styles) {
                        prompt += `   Размер: ${cursor.styles.width || 'auto'} x ${cursor.styles.height || 'auto'}\n`;
                        prompt += `   Фон: ${cursor.styles.backgroundColor || 'none'}\n`;
                        prompt += `   Граница: ${cursor.styles.border || 'none'}\n`;
                        prompt += `   Тень: ${cursor.styles.boxShadow || 'none'}\n`;
                    }
                });
                prompt += `\nВоссоздай курсоры с ТОЧНЫМИ стилями и поведением.\n\n`;
            }

            // Add counter context if available
            if (context.counters && context.counters.length > 0) {
                prompt += `## Анимированные счётчики (${context.counters.length}):\n`;
                context.counters.forEach((counter, i) => {
                    prompt += `${i + 1}. Цель: ${counter.target || counter.targetValue || 0}${counter.suffix || ''}\n`;
                });
                prompt += `\nУбедись, что счётчики анимируются до этих значений.\n\n`;
            }

            // Add marquee context if available
            if (context.marquees && context.marquees.length > 0) {
                prompt += `## Бегущие строки (${context.marquees.length}):\n`;
                context.marquees.forEach((marquee, i) => {
                    prompt += `${i + 1}. Направление: ${marquee.direction || 'left'}, Длительность: ${marquee.duration || 25000}ms\n`;
                    if (marquee.items && marquee.items.length > 0) {
                        prompt += `   Элементы: ${marquee.items.slice(0, 3).join(' • ')}...\n`;
                    }
                });
                prompt += `\n`;
            }

            // Add HTML
            const truncatedHTML = html.length > 30000 ? html.substring(0, 30000) : html;
            const isTruncated = html.length > 30000;

            if (isTruncated) {
                prompt += `## ВАЖНО: HTML обрезан (${html.length} → 30000 символов), верни только то что видишь.\n\n`;
            }

            prompt += `## HTML для улучшения:
\`\`\`html
${truncatedHTML}
\`\`\`

Верни ТОЛЬКО улучшенный HTML без markdown обёртки:`;

            return prompt;
        }

        /**
         * Enhances HTML with AI using rich context
         * @param {string} html - HTML to enhance
         * @param {string} apiKey - OpenRouter API key
         * @param {Object} context - Extraction context from SmartStyleInjector
         */
        async function enhanceWithAI(html, apiKey, context = {}) {
            if (!apiKey) return { success: false, html, error: 'No API key' };

            // Для очень больших файлов пропускаем AI (будет обрезан)
            if (html.length > 200000) {
                console.log('[SmartExtract] AI skipped - file too large:', html.length);
                return { success: false, html, error: 'File too large for AI enhancement' };
            }

            const prompt = generateAIPrompt(html, context);
            const isTruncated = html.length > 30000;

            try {
                const response = await fetch(OPENROUTER_URL, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json',
                        'HTTP-Referer': 'https://ninja-snatch.extension',
                        'X-Title': 'Ninja Snatch Smart Extract'
                    },
                    body: JSON.stringify({
                        model: DEFAULT_MODEL,
                        messages: [{ role: 'user', content: prompt }],
                        max_tokens: 16000,
                        temperature: 0.2
                    })
                });

                if (!response.ok) {
                    const error = await response.json().catch(() => ({}));
                    return { success: false, html, error: error.error?.message || 'API error' };
                }

                const data = await response.json();
                let content = data.choices?.[0]?.message?.content;

                if (!content) {
                    return { success: false, html, error: 'Empty AI response' };
                }

                // Удаляем markdown обёртку если есть
                content = content.trim();

                // Убираем начальный ```html или ```
                if (content.startsWith('```')) {
                    const firstNewline = content.indexOf('\n');
                    if (firstNewline !== -1) {
                        content = content.substring(firstNewline + 1);
                    }
                }

                // Убираем конечный ```
                if (content.endsWith('```')) {
                    content = content.substring(0, content.length - 3).trim();
                }

                // Если AI обрезал файл (не заканчивается на </html>), вернём оригинал
                if (isTruncated && !content.includes('</html>')) {
                    console.log('[SmartExtract] AI returned truncated output, using original');
                    return { success: false, html, error: 'AI output was truncated' };
                }

                return {
                    success: true,
                    html: content || html
                };
            } catch (error) {
                return { success: false, html, error: error.message };
            }
        }

        // ═══════════════════════════════════════════════════════════════════════
        // MAIN PIPELINE
        // ═══════════════════════════════════════════════════════════════════════

        /**
         * Основная функция Smart Extract v2
         * 
         * @param {HTMLElement} element - Элемент для извлечения
         * @param {Object} options - Опции
         * @param {boolean} [options.enableAI=false] - Включить AI улучшение
         * @param {string} [options.apiKey] - OpenRouter API key
         * @returns {Promise<{code: string, metadata: Object}>}
         */
        async function process(element, options = {}) {
            const enableAI = options.enableAI || false;
            const apiKey = options.apiKey || null;

            const metadata = {
                version: VERSION,
                startTime: Date.now(),
                source: window.location.hostname
            };

            try {
                // Stage 1: Framework Detection
                console.log('[SmartExtract] Stage 1: Framework Detection');
                const framework = detectFramework();
                metadata.framework = framework;

                // Stage 2: Pattern Recognition
                console.log('[SmartExtract] Stage 2: Pattern Recognition');
                const patterns = findRepeatingPatterns(element);
                metadata.patterns = patterns.length;

                // Stage 3: Get styled document via StyleInjector
                console.log('[SmartExtract] Stage 3: Getting styled document');
                const StyleInjector = window.__NINJA_SNATCH__.StyleInjector;
                const SmartStyleInjector = window.__NINJA_SNATCH__.SmartStyleInjector;

                const title = document.title || 'Smart Extract';
                let styledHTML = '';
                let extractionContext = {};

                // Use SmartStyleInjector if available (preferred for Smart Extract mode)
                if (SmartStyleInjector && SmartStyleInjector.createEnhancedDocument) {
                    console.log('[SmartExtract] Using SmartStyleInjector v' + SmartStyleInjector.version);

                    const result = SmartStyleInjector.createEnhancedDocument(document.documentElement, title);
                    styledHTML = result.html;

                    extractionContext = {
                        cursors: result.context?.cursors || [],
                        counters: result.context?.counters || [],
                        animations: SmartStyleInjector.analyzeAnimations(document.documentElement),
                        marquees: SmartStyleInjector.analyzeMarquees(document.documentElement)
                    };

                    metadata.smartAnalysis = {
                        cursorsFound: extractionContext.cursors.length,
                        countersFound: extractionContext.counters.length,
                        animationsFound: extractionContext.animations.length,
                        marqueesFound: extractionContext.marquees.length
                    };

                    console.log('[SmartExtract] Smart analysis:', metadata.smartAnalysis);
                } else if (StyleInjector) {
                    // Fallback to regular StyleInjector
                    console.log('[SmartExtract] Fallback: Using StyleInjector');
                    StyleInjector.init();
                    styledHTML = StyleInjector.createStyledDocument(document.documentElement, title);
                } else {
                    throw new Error('Neither SmartStyleInjector nor StyleInjector available');
                }

                metadata.styledHTMLLength = styledHTML.length;
                console.log('[SmartExtract] Styled HTML length:', styledHTML.length);


                // Stage 4: Parse and organize code
                console.log('[SmartExtract] Stage 4: Organizing code');
                const parser = new DOMParser();
                const doc = parser.parseFromString(styledHTML, 'text/html');

                // 4.1: Extract and group inline styles
                const styleMap = extractInlineStyles(doc);
                metadata.inlineStylesFound = styleMap.size;

                // 4.2: Create classes for duplicate styles
                const { classes, cssRules } = groupDuplicateStyles(styleMap);
                metadata.classesGenerated = classes.size;

                // 4.3: Replace inline styles with classes
                replaceInlineWithClasses(doc, classes);

                // 4.4: Clean CSS module hashes
                cleanCSSModuleHashes(doc);

                // 4.5: Inject generated CSS rules
                if (cssRules) {
                    const styleEl = doc.createElement('style');
                    styleEl.textContent = `\n/* Smart Extract v${VERSION} - Generated Classes */\n${cssRules}\n`;
                    doc.head.appendChild(styleEl);
                }

                // Stage 5: Serialize and format
                console.log('[SmartExtract] Stage 5: Formatting');
                let finalHTML = '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;
                finalHTML = formatHTML(finalHTML);

                // Stage 6: AI Enhancement (optional) - now with rich context!
                console.log('[SmartExtract] AI check:', { enableAI, hasApiKey: !!apiKey });
                if (enableAI && apiKey) {
                    console.log('[SmartExtract] Stage 6: AI Enhancement with rich context...');
                    const enhanced = await enhanceWithAI(finalHTML, apiKey, extractionContext);
                    console.log('[SmartExtract] AI result:', enhanced.success ? 'success' : enhanced.error);
                    if (enhanced.success) {
                        finalHTML = enhanced.html;
                        metadata.aiEnhanced = true;
                    } else {
                        metadata.aiError = enhanced.error;
                    }
                } else {
                    console.log('[SmartExtract] AI Enhancement skipped - enableAI:', enableAI, 'apiKey:', apiKey ? 'present' : 'missing');
                }

                metadata.endTime = Date.now();
                metadata.duration = metadata.endTime - metadata.startTime;

                console.log('[SmartExtract] Complete:', metadata);

                return { code: finalHTML, metadata };

            } catch (error) {
                metadata.error = error.message;
                console.error('[SmartExtract] Error:', error);
                throw error;
            }
        }

        // ═══════════════════════════════════════════════════════════════════════
        // PUBLIC API
        // ═══════════════════════════════════════════════════════════════════════

        window.__NINJA_SNATCH__.SmartExtract = {
            process,
            detectFramework,
            findRepeatingPatterns,
            calculateSimilarity,
            enhanceWithAI,
            // Экспортируем утилиты для тестирования
            _internals: {
                extractInlineStyles,
                groupDuplicateStyles,
                replaceInlineWithClasses,
                cleanCSSModuleHashes,
                formatHTML
            },
            version: VERSION
        };

        console.log(`[SmartExtract] Loaded v${VERSION}`);
    })();

}
