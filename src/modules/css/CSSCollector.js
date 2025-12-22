/**
 * Ninja-Snatch CSS Collector
 * Collects CSS from page stylesheets and inline styles
 * @module css/CSSCollector
 */

import { EXTERNAL_CSS_PATTERNS } from '../config/patterns.js';
import { fixCSSUrls } from '../utils/urlFixer.js';
import { Logger } from '../utils/logger.js';

/**
 * CSS collection state
 */
const state = {
    /** @type {string[]} */
    allKeyframes: [],
    /** @type {string[]} */
    allFontFaces: [],
    /** @type {Array<{selector: string, cssText: string}>} */
    allCSSRules: [],
    /** @type {Map<string, string>} */
    cssVariables: new Map(),
    /** @type {string[]} */
    externalStylesheets: [],
    /** @type {string} */
    pageOrigin: ''
};

/**
 * Reset collection state
 */
export function resetState() {
    state.allKeyframes = [];
    state.allFontFaces = [];
    state.allCSSRules = [];
    state.cssVariables = new Map();
    state.externalStylesheets = [];
    state.pageOrigin = '';
}

/**
 * Initialize collector with page origin
 * @param {string} origin 
 */
export function init(origin) {
    resetState();
    state.pageOrigin = origin;
    Logger.info('CSS Collector initialized');
}

/**
 * Collect all CSS from page stylesheets
 */
export function collectAllCSS() {
    const sheets = Array.from(document.styleSheets);

    for (const sheet of sheets) {
        try {
            const rules = sheet.cssRules || sheet.rules;
            if (!rules) continue;

            for (const rule of rules) {
                processRule(rule);
            }
        } catch (e) {
            // Cross-origin stylesheet, try to get href
            if (sheet.href) {
                state.externalStylesheets.push(sheet.href);
            }
        }
    }

    Logger.debug(`Collected ${state.allCSSRules.length} rules, ${state.allKeyframes.length} keyframes`);
}

/**
 * Process a single CSS rule
 * @param {CSSRule} rule 
 */
function processRule(rule) {
    if (!rule) return;

    // Regular style rule
    if (rule.type === CSSRule.STYLE_RULE) {
        const cssText = fixCSSUrls(rule.style.cssText, state.pageOrigin);
        state.allCSSRules.push({
            selector: rule.selectorText,
            cssText: cssText
        });

        // Extract CSS variables from :root
        if (rule.selectorText === ':root') {
            for (let i = 0; i < rule.style.length; i++) {
                const prop = rule.style[i];
                if (prop.startsWith('--')) {
                    state.cssVariables.set(prop, rule.style.getPropertyValue(prop));
                }
            }
        }
    }
    // Keyframes
    else if (rule.type === CSSRule.KEYFRAMES_RULE) {
        state.allKeyframes.push(rule.cssText);
    }
    // Font-face
    else if (rule.type === CSSRule.FONT_FACE_RULE) {
        const fontCSS = fixCSSUrls(rule.cssText, state.pageOrigin);
        state.allFontFaces.push(fontCSS);
    }
    // Media query - process nested rules
    else if (rule.type === CSSRule.MEDIA_RULE) {
        const mediaRules = [];
        for (const innerRule of rule.cssRules) {
            if (innerRule.type === CSSRule.STYLE_RULE) {
                mediaRules.push(`  ${innerRule.selectorText} { ${innerRule.style.cssText} }`);
            }
        }
        if (mediaRules.length > 0) {
            state.allCSSRules.push({
                selector: `@media ${rule.conditionText}`,
                cssText: mediaRules.join('\n')
            });
        }
    }
    // Import - process imported stylesheet
    else if (rule.type === CSSRule.IMPORT_RULE && rule.styleSheet) {
        try {
            for (const importedRule of rule.styleSheet.cssRules) {
                processRule(importedRule);
            }
        } catch (e) {
            // Cross-origin import
            if (rule.href) {
                state.externalStylesheets.push(rule.href);
            }
        }
    }
}

/**
 * Collect external stylesheet links
 * @returns {string} HTML link tags
 */
export function collectExternalLinks() {
    const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
    const collected = [];

    for (const link of links) {
        const href = link.href;
        if (!href) continue;

        // Check if matches external patterns
        const isExternal = EXTERNAL_CSS_PATTERNS.some(pattern =>
            href.toLowerCase().includes(pattern.toLowerCase())
        );

        if (isExternal || !href.startsWith(state.pageOrigin)) {
            collected.push(`<link rel="stylesheet" href="${href}">`);
        }
    }

    return collected.join('\n');
}

/**
 * Collect Google Fonts imports
 * @returns {string} CSS @import rules
 */
export function collectGoogleFonts() {
    const links = Array.from(document.querySelectorAll('link[href*="fonts.googleapis.com"]'));

    return links.map(link =>
        `@import url('${link.href}');`
    ).join('\n');
}

/**
 * Generate CSS variables block
 * @returns {string} CSS :root block
 */
export function generateCSSVariables() {
    if (state.cssVariables.size === 0) return '';

    const vars = Array.from(state.cssVariables.entries())
        .map(([name, value]) => `  ${name}: ${value};`)
        .join('\n');

    return `:root {\n${vars}\n}`;
}

/**
 * Get collected state (for export)
 */
export function getState() {
    return { ...state };
}

/**
 * Get all keyframes as CSS string
 * @returns {string}
 */
export function getKeyframesCSS() {
    return state.allKeyframes.join('\n\n');
}

/**
 * Get all font-faces as CSS string
 * @returns {string}
 */
export function getFontFacesCSS() {
    return state.allFontFaces.join('\n\n');
}
