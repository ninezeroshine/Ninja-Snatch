/**
 * Ninja-Snatch v9.0
 * 
 * Modular website content extraction tool
 * Extracts HTML with all CSS and animations preserved
 * 
 * @example
 * import { StyleInjector } from './src/index.js';
 * 
 * StyleInjector.init();
 * const html = StyleInjector.createStyledDocument(document.body, 'My Page');
 * 
 * @module ninja-snatch
 */

// Re-export main API
export { StyleInjector, VERSION } from './core/index.js';

// Re-export config for customization
export { DEFAULTS, EASING } from './config/index.js';

// Re-export individual modules for advanced usage
export * as css from './modules/css/index.js';
export * as html from './modules/html/index.js';
export * as animation from './modules/animation/index.js';
export * as utils from './utils/index.js';
