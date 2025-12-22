/**
 * Ninja-Snatch Browser Bundle v9.0
 * 
 * Self-contained IIFE for browser extension compatibility.
 * This is used by popup.js and selector.js which run as content scripts.
 * 
 * For the refactored modular version, use src/index.js
 * This file bridges the old API with the new modular architecture.
 */

// Guard against multiple injections
if (typeof window.StyleInjector !== 'undefined') {
    console.log('[Snatch] StyleInjector already loaded, skipping...');
} else {

    /**
     * Browser-compatible StyleInjector
     * This is a bundled version that doesn't require ES module support
     */
    const StyleInjector = (() => {
        // ═══════════════════════════════════════════════════════════════
        // CONFIG
        // ═══════════════════════════════════════════════════════════════

        const VERSION = '9.0.0';

        const DEFAULTS = {
            debug: false,
            defaultTitle: 'Snatched Content',
            motionDevCdn: 'https://cdn.jsdelivr.net/npm/motion@11.13.5/+esm',
            tailwindCdn: 'https://cdn.tailwindcss.com',
            durations: {
                reveal: 600,
                transform: 700,
                counter: 2000,
                marquee: 25000
            }
        };

        const EASING = {
            EXPO_OUT: [0.16, 1, 0.3, 1]
        };

        // Load patterns from SnatcherConfig if available, otherwise use defaults
        const getConfig = () => window.SnatcherConfig || {};
        const cfg = getConfig();

        const PATTERNS = {
            externalCSS: cfg.externalCSSPatterns || ['website-files.com', 'webflow.com', 'framer.com', 'assets.', '.css'],
            preserveScripts: cfg.preserveScriptPatterns || ['webflow', 'jquery', 'gsap', 'framer', 'motion', 'anime', 'lottie', 'scroll', 'animation', 'w-', 'Webflow'],
            removeScripts: cfg.removeScriptPatterns || ['chrome-extension://', 'analytics', 'gtag', 'gtm', 'google-analytics', 'facebook', 'pixel', 'hotjar', 'crisp', 'intercom', 'zendesk'],
            extensionSelectors: cfg.extensionSelectors || ['[id="moat-moat"]', '[class^="float-moat"]', '[id*="grammarly"]', '[class*="grammarly"]', '[data-grammarly-shadow-root]', 'grammarly-extension', '[id*="lastpass"]', '[data-dashlane]', 'next-route-announcer', '[src^="chrome-extension://"]'],
            removeDataPrefixes: cfg.cleanupPatterns?.removeDataPrefixes || ['data-framer-', 'data-radix-', 'data-testid', 'data-sentry-', 'data-gtm-', 'data-ga-'],
            keepDataAttributes: cfg.cleanupPatterns?.keepDataAttributes || ['data-w-id', 'data-animation', 'data-scroll', 'data-src', 'data-srcset']
        };

        // ═══════════════════════════════════════════════════════════════
        // STATE
        // ═══════════════════════════════════════════════════════════════

        let allKeyframes = [];
        let allFontFaces = [];
        let allCSSRules = [];
        let cssVariables = new Map();
        let externalStylesheets = [];
        let pageOrigin = '';

        // ═══════════════════════════════════════════════════════════════
        // UTILS
        // ═══════════════════════════════════════════════════════════════

        const _log = (level, ...args) => {
            const debug = window.SnatcherConfig?.DEBUG ?? DEFAULTS.debug;
            if (!debug && level !== 'error') return;
            console[level === 'error' ? 'error' : 'log'](`[Snatch ${level.toUpperCase()}]`, ...args);
        };

        const matchesAny = (str, patterns) => {
            if (!str) return false;
            const lower = str.toLowerCase();
            return patterns.some(p => lower.includes(p.toLowerCase()));
        };

        const fixRelativeURL = (url, origin) => {
            if (!url || url.startsWith('http') || url.startsWith('//') || url.startsWith('data:') || url.startsWith('blob:')) return url;
            return url.startsWith('/') ? origin + url : origin + '/' + url;
        };

        const fixCSSUrls = (cssText, origin) => {
            if (!cssText || !origin) return cssText;
            return cssText.replace(/url\(['"]?(?!data:|https?:|\/\/|blob:)([^'")]+)['"]?\)/gi,
                (match, url) => `url("${fixRelativeURL(url, origin)}")`);
        };

        // ═══════════════════════════════════════════════════════════════
        // CSS COLLECTION
        // ═══════════════════════════════════════════════════════════════

        const collectAllCSS = () => {
            allKeyframes = [];
            allFontFaces = [];
            allCSSRules = [];
            cssVariables = new Map();

            // Collect from document stylesheets
            for (const sheet of document.styleSheets) {
                try {
                    const rules = sheet.cssRules || sheet.rules;
                    if (!rules) continue;
                    for (const rule of rules) processRule(rule);
                } catch (e) {
                    if (sheet.href) externalStylesheets.push(sheet.href);
                }
            }

            // Collect from Shadow DOM
            collectShadowCSS(document.body);
        };

        /**
         * Recursively collect CSS from Shadow DOM elements
         * Handles open shadow roots only (closed roots are inaccessible by design)
         */
        const collectShadowCSS = (element) => {
            if (!element) return;

            const traverse = (el) => {
                if (!el) return;

                if (el.shadowRoot) {
                    _log('info', `Collecting CSS from shadow root in <${el.tagName.toLowerCase()}>`);

                    // Collect <style> tags inside shadow root
                    el.shadowRoot.querySelectorAll('style').forEach(style => {
                        try {
                            if (style.sheet?.cssRules) {
                                for (const rule of style.sheet.cssRules) {
                                    processRule(rule);
                                }
                            }
                        } catch (e) {
                            _log('warn', `Could not access shadow style: ${e.message}`);
                        }
                    });

                    // Collect adopted stylesheets if available (modern browsers)
                    if (el.shadowRoot.adoptedStyleSheets) {
                        for (const sheet of el.shadowRoot.adoptedStyleSheets) {
                            try {
                                for (const rule of sheet.cssRules) {
                                    processRule(rule);
                                }
                            } catch (e) {
                                _log('warn', `Could not access adopted stylesheet: ${e.message}`);
                            }
                        }
                    }

                    // Recurse into shadow root
                    el.shadowRoot.querySelectorAll('*').forEach(traverse);
                }

                // Traverse regular children
                for (const child of el.children) {
                    traverse(child);
                }
            };

            traverse(element);
        };

        const processRule = (rule) => {
            if (!rule) return;

            if (rule.type === CSSRule.STYLE_RULE) {
                allCSSRules.push({ selector: rule.selectorText, cssText: fixCSSUrls(rule.style.cssText, pageOrigin) });

                if (rule.selectorText === ':root') {
                    for (let i = 0; i < rule.style.length; i++) {
                        const prop = rule.style[i];
                        if (prop.startsWith('--')) cssVariables.set(prop, rule.style.getPropertyValue(prop));
                    }
                }
            } else if (rule.type === CSSRule.KEYFRAMES_RULE) {
                allKeyframes.push(rule.cssText);
            } else if (rule.type === CSSRule.FONT_FACE_RULE) {
                allFontFaces.push(fixCSSUrls(rule.cssText, pageOrigin));
            } else if (rule.type === CSSRule.MEDIA_RULE) {
                const mediaRules = [];
                for (const inner of rule.cssRules) {
                    if (inner.type === CSSRule.STYLE_RULE) {
                        mediaRules.push(`  ${inner.selectorText} { ${inner.style.cssText} }`);
                    }
                }
                if (mediaRules.length) {
                    allCSSRules.push({ selector: `@media ${rule.conditionText}`, cssText: mediaRules.join('\n') });
                }
            } else if (rule.type === CSSRule.IMPORT_RULE && rule.styleSheet) {
                try {
                    for (const r of rule.styleSheet.cssRules) processRule(r);
                } catch (e) {
                    if (rule.href) externalStylesheets.push(rule.href);
                }
            }
        };

        const collectExternalLinks = () => {
            return Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
                .filter(l => {
                    const href = l.getAttribute('href') || l.href;
                    return href && PATTERNS.externalCSS.some(p => href.toLowerCase().includes(p));
                })
                .map(l => {
                    const href = l.getAttribute('href') || l.href;
                    const resolvedHref = fixRelativeURL(href, pageOrigin);
                    return `<link rel="stylesheet" href="${resolvedHref}">`;
                })
                .join('\n');
        };

        const collectGoogleFonts = () => {
            return Array.from(document.querySelectorAll('link[href*="fonts.googleapis.com"]'))
                .map(l => `@import url('${l.href}');`)
                .join('\n');
        };

        const generateCSSVariables = () => {
            if (cssVariables.size === 0) return '';
            const vars = Array.from(cssVariables.entries()).map(([n, v]) => `  ${n}: ${v};`).join('\n');
            return `:root {\n${vars}\n}`;
        };

        // ═══════════════════════════════════════════════════════════════
        // HTML PROCESSING
        // ═══════════════════════════════════════════════════════════════

        const cleanHTML = (clone) => {
            // Remove extension elements
            for (const sel of PATTERNS.extensionSelectors) {
                try { clone.querySelectorAll(sel).forEach(el => el.remove()); } catch (e) { }
            }

            // Process scripts
            clone.querySelectorAll('script').forEach(script => {
                const combined = (script.src || '') + ' ' + (script.textContent || '');
                if (matchesAny(combined, PATTERNS.removeScripts)) {
                    script.remove();
                } else if (!matchesAny(combined, PATTERNS.preserveScripts)) {
                    if (combined.includes('gtag') || combined.includes('analytics') || combined.includes('fbq')) {
                        script.remove();
                    }
                }
            });

            // Remove tracking
            clone.querySelectorAll('img[src*="pixel"], img[src*="tracking"], noscript').forEach(el => el.remove());
            clone.querySelectorAll('iframe[src=""], iframe:not([src])').forEach(el => el.remove());

            return clone;
        };

        const fixAnimationStates = (clone) => {
            const process = (el) => {
                const style = el.getAttribute('style');
                if (!style) return;
                let newStyle = style.replace(/will-change\s*:[^;]+(;|$)/gi, '').replace(/transform-style\s*:\s*preserve-3d\s*(;|$)/gi, '');
                newStyle = newStyle.replace(/;\s*;/g, ';').replace(/^\s*;\s*/, '').trim();
                if (newStyle !== style) {
                    newStyle ? el.setAttribute('style', newStyle) : el.removeAttribute('style');
                }
            };
            process(clone);
            clone.querySelectorAll('[style]').forEach(process);
            return clone;
        };

        const fixHTMLUrls = (clone) => {
            clone.querySelectorAll('[src]').forEach(el => {
                const src = el.getAttribute('src');
                if (src && !src.startsWith('data:') && !src.startsWith('http') && !src.startsWith('//')) {
                    el.setAttribute('src', fixRelativeURL(src, pageOrigin));
                }
            });

            clone.querySelectorAll('[href]').forEach(el => {
                const href = el.getAttribute('href');
                if (href && !href.startsWith('#') && !href.startsWith('javascript:') && !href.startsWith('mailto:') && !href.startsWith('tel:') && !href.startsWith('http') && !href.startsWith('//')) {
                    el.setAttribute('href', fixRelativeURL(href, pageOrigin));
                }
            });

            clone.querySelectorAll('[srcset]').forEach(el => {
                const srcset = el.getAttribute('srcset');
                if (srcset) {
                    const fixed = srcset.split(',').map(part => {
                        const [url, desc] = part.trim().split(/\s+/);
                        return desc ? `${fixRelativeURL(url, pageOrigin)} ${desc}` : fixRelativeURL(url, pageOrigin);
                    }).join(', ');
                    el.setAttribute('srcset', fixed);
                }
            });

            return clone;
        };

        const cleanupAttributes = (clone) => {
            clone.querySelectorAll('*').forEach(el => {
                Array.from(el.attributes).forEach(attr => {
                    if (PATTERNS.keepDataAttributes.includes(attr.name)) return;
                    for (const prefix of PATTERNS.removeDataPrefixes) {
                        if (attr.name.startsWith(prefix)) {
                            el.removeAttribute(attr.name);
                            break;
                        }
                    }
                });

                ['class', 'style', 'id'].forEach(a => {
                    const v = el.getAttribute(a);
                    if (v !== null && v.trim() === '') el.removeAttribute(a);
                });
            });
            return clone;
        };

        const prettifyHTML = (html) => {
            if (!html) return '';
            const selfClosing = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
            const blockTags = new Set(['html', 'head', 'body', 'header', 'footer', 'main', 'nav', 'section', 'article', 'aside', 'div', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'table', 'tr', 'td', 'th', 'form', 'fieldset', 'script', 'style', 'link', 'meta', 'title']);
            const preserveTags = new Set(['script', 'style', 'pre', 'code', 'textarea']);

            let result = '', indent = 0, inPreserve = false, preserveTag = '';
            const tokens = html.match(/<[^>]+>|[^<]+/g) || [];

            for (const token of tokens) {
                if (token.startsWith('<')) {
                    const isClosing = token.startsWith('</');
                    const getTagName = t => { const m = t.match(/<\/?([a-zA-Z0-9]+)/); return m ? m[1].toLowerCase() : ''; };
                    const tagName = getTagName(token);
                    const isSelfClosing = token.endsWith('/>') || selfClosing.has(tagName);

                    if (preserveTags.has(tagName)) {
                        isClosing ? (inPreserve = false, preserveTag = '') : (!isSelfClosing && (inPreserve = true, preserveTag = tagName));
                    }

                    if (inPreserve && !token.includes(`<${preserveTag}`) && !token.includes(`</${preserveTag}`)) {
                        result += token;
                        continue;
                    }

                    if (isClosing) indent = Math.max(0, indent - 1);
                    if (blockTags.has(tagName)) result += '\n' + ' '.repeat(indent * 2) + token;
                    else result += token;
                    if (!isClosing && !isSelfClosing && blockTags.has(tagName)) indent++;
                } else {
                    const trimmed = token.trim();
                    if (trimmed) result += inPreserve ? token : trimmed;
                }
            }

            return result.replace(/\n{3,}/g, '\n\n').trim();
        };

        // ═══════════════════════════════════════════════════════════════
        // CSS MATCHING
        // ═══════════════════════════════════════════════════════════════

        const collectUsedClasses = (element) => {
            const classes = new Set();
            const traverse = (el) => {
                if (el.classList) el.classList.forEach(c => classes.add(c));
                for (const child of el.children) traverse(child);
            };
            traverse(element);
            return classes;
        };

        /**
         * Get all elements in the subtree (including the root)
         * Recursively traverses Shadow DOM for web components
         */
        const getAllElements = (element) => {
            const elements = [];

            const traverse = (el) => {
                if (!el) return;
                elements.push(el);

                // Traverse Shadow DOM if accessible (open mode only)
                if (el.shadowRoot) {
                    _log('info', `Found shadow root in <${el.tagName.toLowerCase()}>`);
                    el.shadowRoot.querySelectorAll('*').forEach(shadowEl => traverse(shadowEl));
                }

                // Traverse regular children
                for (const child of el.children) {
                    traverse(child);
                }
            };

            traverse(element);
            return elements;
        };

        /**
         * Check if a selector matches any element using native element.matches()
         * Handles pseudo-selectors and invalid selectors gracefully
         */
        const selectorMatchesAny = (selector, elements) => {
            // Extract base selector (remove pseudo-elements and pseudo-classes for matching)
            // e.g., ".btn:hover::before" -> ".btn"
            const baseSelector = selector
                .replace(/::[\w-]+/g, '')           // Remove pseudo-elements (::before, ::after)
                .replace(/:(?:hover|focus|active|visited|focus-visible|focus-within|disabled|checked|first-child|last-child|nth-child\([^)]*\)|nth-of-type\([^)]*\))/g, '') // Remove state pseudo-classes
                .trim();

            if (!baseSelector) return false;

            try {
                for (const el of elements) {
                    if (el.matches && el.matches(baseSelector)) {
                        return true;
                    }
                }
            } catch (e) {
                // Invalid selector - fall back to class-based matching
                _log('warn', `Invalid selector: ${selector}`);
                return false;
            }
            return false;
        };

        /**
         * NEW: Native element.matches() based CSS matching
         * This provides precise matching and eliminates CSS bloat
         */
        const getMatchedCSSRules = (usedClasses, element) => {
            const elements = getAllElements(element);
            const matched = [];
            const seen = new Set();

            for (const rule of allCSSRules) {
                const sel = rule.selector;
                if (seen.has(sel)) continue;

                let matches = false;

                // Always include these universal rules
                if (sel.startsWith('@media')) {
                    // For media queries, check if any inner selector matches
                    matches = true;
                } else if (sel === '*' || sel === 'html' || sel === 'body' || sel === ':root') {
                    matches = true;
                } else {
                    // Use native element.matches() for precise matching
                    // Split compound selectors (e.g., ".a, .b" -> [".a", ".b"])
                    const selectorParts = sel.split(',').map(s => s.trim());

                    for (const part of selectorParts) {
                        if (selectorMatchesAny(part, elements)) {
                            matches = true;
                            break;
                        }
                    }
                }

                if (matches) {
                    seen.add(sel);
                    matched.push(
                        sel.startsWith('@media')
                            ? `${sel} {\n${rule.cssText}\n}`
                            : `${sel} { ${rule.cssText} }`
                    );
                }
            }

            _log('info', `Matched ${matched.length} CSS rules out of ${allCSSRules.length} total`);
            return matched.join('\n');
        };

        const hasTailwind = () => {
            const indicators = ['flex', 'grid', 'items-center', 'justify-center', 'bg-', 'text-', 'p-', 'm-', 'rounded', 'shadow', 'hover:', 'md:'];
            const allClasses = document.body.className + ' ' + Array.from(document.querySelectorAll('[class]')).map(el => el.className).join(' ');
            return indicators.some(i => allClasses.includes(i));
        };

        // ═══════════════════════════════════════════════════════════════
        // ANIMATION GENERATION
        // ═══════════════════════════════════════════════════════════════

        const generateRevealAnimationsCSS = () => {
            const mDur = `${DEFAULTS.durations.marquee / 1000}s`;
            return `
/* Ninja-Snatch v${VERSION} Reveal Animations */
@keyframes snatch-fade-up {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}
@keyframes snatch-fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
}
section, main > div, header, .section, .hero, .hero-content, .container-wide > div, article {
    animation: snatch-fade-up 0.6s ease-out forwards;
}
section:nth-of-type(1) { animation-delay: 0s; }
section:nth-of-type(2) { animation-delay: 0.1s; }
section:nth-of-type(3) { animation-delay: 0.2s; }
section:nth-of-type(4) { animation-delay: 0.3s; }
section:nth-of-type(5) { animation-delay: 0.4s; }
section:nth-of-type(n+6) { animation-delay: 0.5s; }
.grid > * { animation: snatch-fade-up 0.5s ease-out forwards; }
.grid > *:nth-child(1) { animation-delay: 0s; }
.grid > *:nth-child(2) { animation-delay: 0.05s; }
.grid > *:nth-child(3) { animation-delay: 0.1s; }
.grid > *:nth-child(4) { animation-delay: 0.15s; }
.grid > *:nth-child(5) { animation-delay: 0.2s; }
.grid > *:nth-child(n+6) { animation-delay: 0.25s; }
.marquee-track, [class*="marquee"] > div { animation: snatch-marquee ${mDur} linear infinite; }
.marquee-reverse-track { animation: snatch-marquee ${mDur} linear infinite reverse; }
@keyframes snatch-marquee {
    from { transform: translateX(0); }
    to { transform: translateX(-50%); }
}
a:hover img, .group:hover img { transform: scale(1.02) !important; transition: transform 0.4s ease; }
button:hover, a[class*="btn"]:hover { transform: translateY(-2px) !important; transition: transform 0.2s ease; }
img { opacity: 1 !important; }
`;
        };

        const generateAnimationScript = () => {
            const eo = JSON.stringify(EASING.EXPO_OUT);
            return `
// Ninja-Snatch v${VERSION}
(async () => {
  try {
    const { animate, inView } = await import('${DEFAULTS.motionDevCdn}');
    const skip = el => el.closest('[aria-hidden]') || el.closest('.modal') || el.classList.contains('pointer-events-none') || el.closest('.pointer-events-none');
    
    document.querySelectorAll('[style*="opacity:0"], [style*="opacity: 0"]').forEach((el, i) => {
      if (skip(el)) return;
      animate(el, { opacity: 1 }, { duration: ${DEFAULTS.durations.reveal / 1000}, delay: Math.min(i * 0.08, 1), easing: ${eo} });
    });
    
    document.querySelectorAll('[style*="translateY"], [style*="translateX"]').forEach((el, i) => {
      if (skip(el) || el.closest('[class*="marquee"]') || el.parentElement?.querySelector('[class*="whitespace-nowrap"]')) return;
      if (el.classList.contains('whitespace-nowrap') && el.children.length > 4) return;
      animate(el, { transform: 'translateY(0) translateX(0)' }, { duration: ${DEFAULTS.durations.transform / 1000}, delay: Math.min(i * 0.06, 0.8), easing: ${eo} });
    });
    
    // UNIVERSAL Counter Detection
    const counterAttrs = ['data-target','data-count','data-value','data-end','data-number'];
    const suffixDefaults = {'+':50,'%':98,'k':10,'K':10,'M':1};
    document.querySelectorAll('span, [class*="counter"], [class*="stat"], [class*="number"]').forEach(el => {
      const text = el.textContent.trim();
      if (!/^[0-9]{1,2}$/.test(text) && text !== '0') return;
      let target = null;
      for (const attr of counterAttrs) {
        const val = el.getAttribute(attr) || el.closest('[' + attr + ']')?.getAttribute(attr);
        if (val) { target = parseInt(val); break; }
      }
      if (!target) {
        const sib = el.nextElementSibling;
        const suffix = sib?.textContent?.trim()?.charAt(0);
        if (suffix && suffixDefaults[suffix]) {
          target = suffixDefaults[suffix];
          if (suffix === '+') {
            const p = el.closest('[class*="grid"]');
            if (p) {
              const items = p.querySelectorAll('[class*="text-center"], [class*="stat"]');
              const idx = Array.from(items).indexOf(el.closest('[class*="text-center"], [class*="stat"]'));
              target = [50,5,100,150,200,250,300][idx] || 50;
            }
          }
        }
      }
      if (!target || target <= 0) return;
      const c = el.closest('[class*="counter"], [class*="stat"], [class*="text-center"]') || el.parentElement;
      if (!c) return;
      inView(c, () => {
        let cur = parseInt(text) || 0; const startVal = cur; const dur = ${DEFAULTS.durations.counter}, st = Date.now();
        (function u() { const p = Math.min((Date.now()-st)/dur,1); cur = Math.round(startVal + (1-Math.pow(1-p,3))*(target-startVal)); el.textContent = cur; if(p<1) requestAnimationFrame(u); })();
      }, { margin: '-50px' });
    });
    
    document.querySelectorAll('.marquee-track, [class*="marquee-track"]').forEach(el => { el.style.transform = 'translateX(0)'; el.style.animation = 'snatch-marquee ${DEFAULTS.durations.marquee / 1000}s linear infinite'; });
    document.querySelectorAll('.marquee-reverse-track, [class*="marquee-reverse-track"]').forEach(el => { el.style.transform = 'translateX(0)'; el.style.animation = 'snatch-marquee ${DEFAULTS.durations.marquee / 1000}s linear infinite reverse'; });
    document.querySelectorAll('[class*="whitespace-nowrap"], [class*="scroll"]').forEach(el => {
      if (getComputedStyle(el).animationName !== 'none' || el.closest('.pointer-events-none') || el.style.animation) return;
      const ch = el.children;
      if (ch.length >= 4 && ch[0]?.textContent?.trim() === ch[Math.floor(ch.length/2)]?.textContent?.trim()) {
        el.style.animation = 'snatch-marquee ${DEFAULTS.durations.marquee / 1000}s linear infinite';
      }
    });
    
    console.log('[Snatch] v${VERSION} animations applied');
  } catch (e) {
    document.querySelectorAll('[style*="opacity:0"], [style*="opacity: 0"]').forEach(el => el.style.opacity = '1');
    console.log('[Snatch] Fallback: revealed hidden elements');
  }
})();
`;
        };

        const generateCursorScript = () => `
// UNIVERSAL Custom Cursor Fix
(function() {
  // More specific selectors - avoid matching cursor-pointer, cursor-default etc.
  const cursorSelectors = [
    '.custom-cursor',
    '.cursor-dot',
    '.cursor-outline', 
    '.cursor-follower',
    '.mouse-follower',
    '.cursor-ball',
    '.cursor-circle',
    '[data-cursor]',
    '[data-cursor-follower]'
  ];
  
  let cursors = [];
  
  // Try specific selectors first
  for (const sel of cursorSelectors) { 
    try { 
      document.querySelectorAll(sel).forEach(el => { 
        if (!cursors.includes(el)) cursors.push(el); 
      }); 
    } catch(e) {} 
  }
  
  // Structural detection fallback - very strict criteria
  if (!cursors.length) {
    document.querySelectorAll('*').forEach(el => {
      const s = getComputedStyle(el);
      const zIndex = parseInt(s.zIndex) || 0;
      // Must be: fixed, pointer-events none, small, high z-index, no text content
      if (
        s.position === 'fixed' && 
        s.pointerEvents === 'none' && 
        el.offsetWidth < 80 && 
        el.offsetHeight < 80 &&
        el.offsetWidth > 5 &&
        el.offsetHeight > 5 &&
        zIndex > 9000 &&
        el.textContent.trim().length === 0 &&
        !el.querySelector('button, a, input, [role="button"]')
      ) {
        cursors.push(el);
      }
    });
  }
  
  if (!cursors.length) return;
  
  let mx = 0, my = 0;
  document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
  (function tick() { 
    cursors.forEach(c => c.style.transform = 'translate(' + mx + 'px, ' + my + 'px) translate(-50%, -50%)'); 
    requestAnimationFrame(tick); 
  })();
  console.log('[Snatch] Cursor activated (' + cursors.length + ' elements)');
})();
`;

        // ═══════════════════════════════════════════════════════════════
        // PUBLIC API
        // ═══════════════════════════════════════════════════════════════

        /**
         * Clone shadow DOM content into regular HTML
         * Since shadow DOM cannot be serialized directly, we extract its content
         * and insert it as regular HTML with a wrapper
         */
        const cloneShadowContent = (clone, original) => {
            const processElement = (clonedEl, originalEl) => {
                if (!originalEl || !clonedEl) return;

                if (originalEl.shadowRoot) {
                    _log('info', `Cloning shadow content from <${originalEl.tagName.toLowerCase()}>`);

                    // Create container for shadow content
                    const shadowContainer = document.createElement('div');
                    shadowContainer.className = 'snatch-shadow-content';
                    shadowContainer.setAttribute('data-snatch-shadow', 'true');

                    // Copy shadow root innerHTML
                    shadowContainer.innerHTML = originalEl.shadowRoot.innerHTML;

                    // Apply shadow styles as inline or scoped
                    originalEl.shadowRoot.querySelectorAll('style').forEach(style => {
                        const styleClone = style.cloneNode(true);
                        shadowContainer.insertBefore(styleClone, shadowContainer.firstChild);
                    });

                    // Append to cloned element
                    clonedEl.appendChild(shadowContainer);

                    // Recursively process nested shadow roots in the container
                    const shadowChildren = originalEl.shadowRoot.children;
                    const containerChildren = shadowContainer.children;

                    for (let i = 0; i < shadowChildren.length; i++) {
                        if (shadowChildren[i].shadowRoot && containerChildren[i]) {
                            processElement(containerChildren[i], shadowChildren[i]);
                        }
                    }
                }

                // Process regular children
                const origChildren = originalEl.children;
                const cloneChildren = clonedEl.children;

                for (let i = 0; i < origChildren.length; i++) {
                    if (cloneChildren[i]) {
                        processElement(cloneChildren[i], origChildren[i]);
                    }
                }
            };

            processElement(clone, original);
            return clone;
        };

        return {
            version: VERSION,

            init() {
                pageOrigin = window.location.origin;
                _log('info', `Initializing v${VERSION}`);
                collectAllCSS();
            },

            _prepareExport(element) {
                let clone = element.cloneNode(true);

                // Clone shadow DOM content into regular HTML
                clone = cloneShadowContent(clone, element);

                clone = cleanHTML(clone);
                clone = cleanupAttributes(clone);
                clone = fixAnimationStates(clone);
                clone = fixHTMLUrls(clone);

                const usedClasses = collectUsedClasses(clone);

                return {
                    clone,
                    cssData: {
                        externalLinks: collectExternalLinks(),
                        googleFonts: collectGoogleFonts(),
                        fontFaces: allFontFaces.join('\n\n'),
                        variables: generateCSSVariables(),
                        keyframes: allKeyframes.join('\n\n'),
                        matchedCSS: getMatchedCSSRules(usedClasses, clone),
                        revealAnimations: generateRevealAnimationsCSS(),
                        hasTailwind: hasTailwind()
                    }
                };
            },

            injectStyles(element) {
                this.init();
                const { clone, cssData } = this._prepareExport(element);
                return prettifyHTML(`<style>\n${cssData.variables}\n${cssData.fontFaces}\n${cssData.keyframes}\n${cssData.matchedCSS}\n${cssData.revealAnimations}\n</style>\n${clone.outerHTML}`);
            },

            createStyledDocument(element, title = DEFAULTS.defaultTitle) {
                this.init();
                const { clone, cssData } = this._prepareExport(element);
                const bodyStyle = window.getComputedStyle(document.body);
                const tailwind = cssData.hasTailwind ? `<script src="${DEFAULTS.tailwindCdn}"></script>` : '';

                return prettifyHTML(`<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
${cssData.externalLinks}
${tailwind}
<style>
/* Ninja-Snatch v${VERSION} */
${cssData.googleFonts}
${cssData.fontFaces}
${cssData.variables}
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body {
  background: ${bodyStyle.backgroundColor || '#000'};
  color: ${bodyStyle.color || '#fff'};
  font-family: ${bodyStyle.fontFamily};
  min-height: 100vh;
}
${cssData.keyframes}
${cssData.matchedCSS}
${cssData.revealAnimations}
</style>
</head>
<body>
${clone.outerHTML}
<script type="module">
${generateAnimationScript()}
${generateCursorScript()}
</script>
</body>
</html>`);
            },

            /**
             * Create LLM-friendly ULTRA-compact export
             * Strips ALL styling, keeps only structure and content
             */
            createLLMExport(element) {
                // Clone element
                let clone = element.cloneNode(true);
                clone = cleanHTML(clone);

                // Get element path for context
                const getPath = (el) => {
                    const parts = [];
                    let current = el;
                    for (let i = 0; i < 3 && current && current !== document.body; i++) {
                        let part = current.tagName.toLowerCase();
                        if (current.id) part += '#' + current.id;
                        else if (current.classList.length) {
                            // Keep only semantic class (first one that's not a utility)
                            const semantic = Array.from(current.classList).find(c =>
                                !c.includes('-') && !c.match(/^[a-z]{1,3}:/) && c.length > 2
                            );
                            if (semantic) part += '.' + semantic;
                        }
                        parts.unshift(part);
                        current = current.parentElement;
                    }
                    return parts.join(' > ');
                };

                const elementPath = getPath(element);
                const hostname = window.location.hostname;

                // BALANCED: Remove only noise classes, keep styling classes
                const noisePatterns = [
                    /^transition/,      // transition-all, transition-colors
                    /^duration-/,       // duration-300
                    /^ease-/,           // ease-in-out
                    /^delay-/,          // delay-100
                    /^animate-/,        // animate-spin, animate-on-scroll
                    /^hover:/,          // hover:bg-white
                    /^focus:/,          // focus:ring
                    /^active:/,         // active:scale
                    /^group-hover:/,    // group-hover:text-white
                    /^group$/,          // group
                    /^peer/,            // peer, peer-focus
                    /^motion-/,         // motion-safe
                    /^will-change/,     // will-change-transform
                    /^cursor-/,         // cursor-pointer
                    /^select-/,         // select-none
                    /^pointer-events/,  // pointer-events-none
                    /^outline-/,        // outline-none
                    /^ring-/,           // ring-2
                    /^sr-only/,         // screen reader only
                    /^scroll-/,         // scroll-smooth
                    /^snap-/,           // scroll snap
                    /^touch-/,          // touch-manipulation
                    /^whitespace-/,     // whitespace-nowrap (structural, not visual)
                ];

                // Clean CSS module hashes: _className_abc123 → className
                const cleanCSSModuleHash = (cls) => {
                    // Pattern: starts with _ or __, has _hash at the end
                    // Examples: _metadataGrid_payqq_223, __button_x7f2k_45
                    const match = cls.match(/^_+(.+?)_[a-z0-9]{4,}_\d+$/i);
                    if (match) {
                        return match[1]; // Return just the readable part
                    }
                    // Also handle: className_abc123 or className-abc123 (hash at end)
                    const hashMatch = cls.match(/^(.+?)[-_][a-z0-9]{5,}$/i);
                    if (hashMatch && hashMatch[1].length > 2) {
                        return hashMatch[1];
                    }
                    return cls;
                };

                clone.querySelectorAll('[class]').forEach(el => {
                    let classes = Array.from(el.classList)
                        .filter(cls => !noisePatterns.some(pattern => pattern.test(cls)))
                        .map(cleanCSSModuleHash);

                    // Remove duplicates after cleaning
                    classes = [...new Set(classes)];

                    if (classes.length === 0) {
                        el.removeAttribute('class');
                    } else {
                        // Limit to max 5 most important classes per element
                        el.className = classes.slice(0, 5).join(' ');
                    }
                });

                // Same for root
                if (clone.classList) {
                    let rootClasses = Array.from(clone.classList)
                        .filter(cls => !noisePatterns.some(pattern => pattern.test(cls)))
                        .map(cleanCSSModuleHash);
                    rootClasses = [...new Set(rootClasses)];
                    clone.className = rootClasses.slice(0, 5).join(' ');
                }

                // Remove inline styles EXCEPT key visual ones
                clone.querySelectorAll('[style]').forEach(el => {
                    const style = el.getAttribute('style');
                    // Keep only essential visual styles
                    const keepStyles = ['color', 'background', 'font-size', 'padding', 'margin', 'border', 'width', 'height', 'display', 'flex', 'grid', 'gap'];
                    const newStyles = [];

                    style.split(';').forEach(rule => {
                        const prop = rule.split(':')[0]?.trim().toLowerCase();
                        if (prop && keepStyles.some(k => prop.includes(k))) {
                            newStyles.push(rule.trim());
                        }
                    });

                    if (newStyles.length > 0) {
                        el.setAttribute('style', newStyles.join('; '));
                    } else {
                        el.removeAttribute('style');
                    }
                });

                // Remove data attributes (noise for LLM)
                clone.querySelectorAll('*').forEach(el => {
                    Array.from(el.attributes).forEach(attr => {
                        if (attr.name.startsWith('data-')) {
                            el.removeAttribute(attr.name);
                        }
                    });
                });

                // Deduplicate repeated children (marquee pattern)
                const deduplicateChildren = (parent) => {
                    const children = Array.from(parent.children);
                    if (children.length < 4) return;

                    // Check if children are repeating
                    const half = Math.floor(children.length / 2);
                    let isRepeating = true;

                    for (let i = 0; i < Math.min(half, 5); i++) {
                        if (children[i]?.textContent?.trim() !== children[i + half]?.textContent?.trim()) {
                            isRepeating = false;
                            break;
                        }
                    }

                    if (isRepeating && half > 1) {
                        // Keep only first half + add comment
                        for (let i = children.length - 1; i >= half; i--) {
                            children[i].remove();
                        }
                        const comment = document.createComment(` ... repeats ${half} more items`);
                        parent.appendChild(comment);
                    }
                };

                // Apply deduplication to all containers
                clone.querySelectorAll('*').forEach(el => {
                    if (el.children.length > 6) {
                        deduplicateChildren(el);
                    }
                });

                // Simplify nested structure - unwrap single-child divs
                let changed = true;
                while (changed) {
                    changed = false;
                    clone.querySelectorAll('div').forEach(div => {
                        if (div.children.length === 1 &&
                            div.children[0].tagName === 'DIV' &&
                            !div.textContent.trim().replace(div.children[0].textContent.trim(), '')) {
                            div.replaceWith(div.children[0]);
                            changed = true;
                        }
                    });
                }

                // Build minimal output
                const context = `<!-- ${hostname} > ${elementPath} -->`;

                // Simple formatting (no heavy prettify)
                let html = clone.outerHTML
                    .replace(/>\s+</g, '>\n<')
                    .replace(/></g, '>\n<');

                // Limit line length for readability
                const lines = html.split('\n').map(line => {
                    if (line.length > 100) {
                        return line.substring(0, 97) + '...';
                    }
                    return line;
                });

                return `${context}\n${lines.join('\n')}`;
            },

            // Legacy compatibility - functions
            collectAllCSS,
            collectUsedClasses,
            collectExternalLinks,
            collectGoogleFonts,
            generateCSSVariables,
            cleanHTML,
            fixAnimationStates,
            fixHTMLUrls,
            cleanupAttributes,
            prettifyHTML,
            generateRevealAnimations: generateRevealAnimationsCSS,
            fixRelativeURLs(cssText) { return fixCSSUrls(cssText, pageOrigin); },

            // Legacy compatibility - state (for tests)
            get pageOrigin() { return pageOrigin; },
            set pageOrigin(v) { pageOrigin = v; },
            get allKeyframes() { return allKeyframes; },
            set allKeyframes(v) { allKeyframes = v; },
            get allFontFaces() { return allFontFaces; },
            set allFontFaces(v) { allFontFaces = v; },
            get allCSSRules() { return allCSSRules; },
            set allCSSRules(v) { allCSSRules = v; },
            get cssVariables() { return cssVariables; },
            set cssVariables(v) { cssVariables = v; },
            get externalStylesheets() { return externalStylesheets; },
            set externalStylesheets(v) { externalStylesheets = v; },
            classCounter: 0  // Legacy property
        };
    })();

    // Export to window
    window.StyleInjector = StyleInjector;

} // end guard
