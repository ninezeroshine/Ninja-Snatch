/**
 * Ninja-Snatch Style Injector v9.0
 * 
 * Refactored modular architecture:
 * - Config-driven with centralized settings
 * - Extracted CSS, HTML, Animation modules
 * - Fully testable components
 * - Single source of truth for version
 * 
 * @module core/StyleInjector
 */

import { VERSION, DEFAULTS } from '../config/index.js';
import { Logger } from '../utils/index.js';

// CSS modules
import {
    initCollector,
    collectAllCSS,
    collectExternalLinks,
    collectGoogleFonts,
    generateCSSVariables,
    getState as getCSSState,
    getKeyframesCSS,
    getFontFacesCSS,
    collectUsedClasses,
    getMatchedCSSRules,
    hasTailwind
} from '../modules/css/index.js';

// HTML modules
import {
    fullCleanup,
    fullFix,
    prettifyHTML
} from '../modules/html/index.js';

// Animation modules
import {
    generateAnimationScript,
    generateCursorScript,
    generateRevealAnimationsCSS
} from '../modules/animation/index.js';

/**
 * Main StyleInjector API
 */
export const StyleInjector = {
    /** Current version */
    version: VERSION,

    /**
     * Initialize StyleInjector
     * Collects all CSS from the current page
     */
    init() {
        const origin = window.location.origin;
        Logger.info(`Initializing StyleInjector v${VERSION}`);

        initCollector(origin);
        collectAllCSS();

        Logger.info('Initialization complete');
    },

    /**
     * Prepare element for export
     * @private
     * @param {HTMLElement} element 
     * @returns {{clone: HTMLElement, cssData: Object}}
     */
    _prepareExport(element) {
        // Clone and clean
        let clone = element.cloneNode(true);
        clone = fullCleanup(clone);
        clone = fullFix(clone, window.location.origin);

        // Collect CSS data
        const usedClasses = collectUsedClasses(clone);
        const cssState = getCSSState();

        return {
            clone,
            cssData: {
                externalLinks: collectExternalLinks(),
                googleFonts: collectGoogleFonts(),
                fontFaces: getFontFacesCSS(),
                variables: generateCSSVariables(),
                keyframes: getKeyframesCSS(),
                matchedCSS: getMatchedCSSRules(usedClasses, clone, cssState.allCSSRules),
                revealAnimations: generateRevealAnimationsCSS(),
                hasTailwind: hasTailwind()
            }
        };
    },

    /**
     * Inject styles and return HTML snippet (for clipboard)
     * @param {HTMLElement} element 
     * @returns {string} Formatted HTML with embedded styles
     */
    injectStyles(element) {
        this.init();
        const { clone, cssData } = this._prepareExport(element);

        // Build style block
        const styleBlock = `
<style>
${cssData.variables}
${cssData.fontFaces}
${cssData.keyframes}
${cssData.matchedCSS}
${cssData.revealAnimations}
</style>`;

        return prettifyHTML(styleBlock + '\n' + clone.outerHTML);
    },

    /**
     * Create complete styled HTML document (for download)
     * @param {HTMLElement} element 
     * @param {string} title 
     * @returns {string} Complete HTML document
     */
    createStyledDocument(element, title = DEFAULTS.defaultTitle) {
        this.init();
        const { clone, cssData } = this._prepareExport(element);

        // Get body styles
        const bodyStyle = window.getComputedStyle(document.body);

        // Tailwind CDN
        const tailwindScript = cssData.hasTailwind
            ? `<script src="${DEFAULTS.tailwindCdn}"></script>`
            : '';

        // Build document
        const html = `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
${cssData.externalLinks}
${tailwindScript}
<style>
/* Ninja-Snatch v${VERSION} */
${cssData.googleFonts}

${cssData.fontFaces}

${cssData.variables}

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

${cssData.keyframes}

${cssData.matchedCSS}

${cssData.revealAnimations}
</style>
</head>
<body>
${clone.outerHTML}

<!-- Motion.dev for animations + Cursor fix -->
<script type="module">
${generateAnimationScript()}

${generateCursorScript()}
</script>
</body>
</html>`;

        return prettifyHTML(html);
    }
};

/**
 * Export version for external access
 */
export { VERSION };
