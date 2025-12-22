/**
 * Ninja-Snatch CSS Module Index
 * @module css
 */

export {
    init as initCollector,
    resetState,
    collectAllCSS,
    collectExternalLinks,
    collectGoogleFonts,
    generateCSSVariables,
    getState,
    getKeyframesCSS,
    getFontFacesCSS
} from './CSSCollector.js';

export {
    collectUsedClasses,
    collectUsedIds,
    collectUsedTags,
    getMatchedCSSRules,
    hasTailwind
} from './CSSMatcher.js';
