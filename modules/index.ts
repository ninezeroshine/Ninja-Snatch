/**
 * Modules Index
 *
 * Central export point for all Ninja Snatch modules.
 *
 * @module modules
 */

export { scanDocument, extractUrlsFromCss, isValidAssetUrl } from './AssetScanner';
export { ZipBuilder, createZipBuilder } from './ZipBuilder';
export { extractStyles, getStyledHtml } from './StyleExtractor';
export {
    extractStylesheets,
    buildExtractedCSS,
    extractCSSVariablesMap,
    type ExtractedStylesheet,
} from './StylesheetExtractor';

export {
    hydrateElement,
    hydrateTree,
    dehydrateTree,
    getTruthString,
    getHydratedHtml,
    isDefaultValue,
    type HydrationOptions,
    type HydrationResult,
} from './StyleHydrator';

export {
    MotionSampler,
    createSampler,
    recordAnimation,
    recordMultiple,
    snapshotState,
    type RecordingOptions,
    type RecordingState,
} from './MotionSampler';
