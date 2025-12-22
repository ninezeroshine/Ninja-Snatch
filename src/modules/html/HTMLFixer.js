/**
 * Ninja-Snatch HTML Fixer
 * Fixes animation states and URLs for export
 * @module html/HTMLFixer
 */

import { fixElementUrls } from '../utils/urlFixer.js';
import { Logger } from '../utils/logger.js';

/**
 * Fix animation states - PRESERVES opacity/transform for Motion.dev
 * Removes will-change and transform-style hints
 * 
 * @param {HTMLElement} element - Cloned DOM element
 * @returns {HTMLElement} Fixed element
 */
export function fixAnimationStates(element) {
    /**
     * Process a single element's style
     * @param {HTMLElement} el 
     */
    const processElement = (el) => {
        const style = el.getAttribute('style');
        if (!style) return;

        let newStyle = style;

        // Remove optimization hints (but keep opacity and transform!)
        newStyle = newStyle.replace(/will-change\s*:[^;]+(;|$)/gi, '');
        newStyle = newStyle.replace(/transform-style\s*:\s*preserve-3d\s*(;|$)/gi, '');

        // Clean up multiple semicolons and whitespace
        newStyle = newStyle.replace(/;\s*;/g, ';').replace(/^\s*;\s*/, '').trim();

        if (newStyle !== style) {
            if (newStyle) {
                el.setAttribute('style', newStyle);
            } else {
                el.removeAttribute('style');
            }
        }
    };

    // Process root element
    processElement(element);

    // Process all descendants
    element.querySelectorAll('[style]').forEach(processElement);

    return element;
}

/**
 * Fix all URLs in HTML for standalone export
 * Converts relative URLs to absolute
 * 
 * @param {HTMLElement} element - Cloned DOM element
 * @param {string} origin - Page origin (e.g., https://example.com)
 * @returns {HTMLElement} Fixed element
 */
export function fixHTMLUrls(element, origin) {
    if (!origin) {
        Logger.warn('No origin provided for URL fixing');
        return element;
    }

    fixElementUrls(element, origin);

    return element;
}

/**
 * Fix Next.js/React specific issues
 * @param {HTMLElement} element 
 * @returns {HTMLElement}
 */
export function fixFrameworkIssues(element) {
    // Fix Next.js Image components
    element.querySelectorAll('img[data-nimg]').forEach(img => {
        // Ensure src is set from srcset if missing
        if (!img.getAttribute('src') && img.getAttribute('srcset')) {
            const srcset = img.getAttribute('srcset');
            const firstSrc = srcset.split(',')[0].trim().split(' ')[0];
            img.setAttribute('src', firstSrc);
        }
    });

    // Fix lazy-loaded images
    element.querySelectorAll('img[loading="lazy"]').forEach(img => {
        const dataSrc = img.getAttribute('data-src');
        if (dataSrc && !img.getAttribute('src')) {
            img.setAttribute('src', dataSrc);
        }
    });

    return element;
}

/**
 * Full HTML fix pipeline
 * @param {HTMLElement} element 
 * @param {string} origin 
 * @returns {HTMLElement}
 */
export function fullFix(element, origin) {
    let fixed = fixAnimationStates(element);
    fixed = fixHTMLUrls(fixed, origin);
    fixed = fixFrameworkIssues(fixed);
    return fixed;
}
