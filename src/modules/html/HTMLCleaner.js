/**
 * Ninja-Snatch HTML Cleaner
 * Removes browser extensions, analytics, and unwanted elements
 * @module html/HTMLCleaner
 */

import {
    EXTENSION_SELECTORS,
    REMOVE_SCRIPT_PATTERNS,
    PRESERVE_SCRIPT_PATTERNS,
    REMOVE_DATA_PREFIXES,
    KEEP_DATA_ATTRIBUTES
} from '../config/patterns.js';
import { matchesAnyPattern, removeEmptyAttributes } from '../utils/helpers.js';
import { Logger } from '../utils/logger.js';

/**
 * Clean HTML by removing browser extensions and analytics
 * Preserves animation scripts
 * 
 * @param {HTMLElement} element - Cloned DOM element
 * @returns {HTMLElement} Cleaned element
 */
export function cleanHTML(element) {
    let removedCount = 0;

    // Remove browser extension elements
    for (const selector of EXTENSION_SELECTORS) {
        try {
            element.querySelectorAll(selector).forEach(el => {
                el.remove();
                removedCount++;
            });
        } catch (e) {
            // Invalid selector, skip
        }
    }

    // Process scripts
    element.querySelectorAll('script').forEach(script => {
        const src = script.src || '';
        const content = script.textContent || '';
        const combined = src + ' ' + content;

        // Check if should be removed
        if (matchesAnyPattern(combined, REMOVE_SCRIPT_PATTERNS)) {
            script.remove();
            removedCount++;
            return;
        }

        // Check if should be preserved
        if (matchesAnyPattern(combined, PRESERVE_SCRIPT_PATTERNS)) {
            return; // Keep
        }

        // Remove inline analytics scripts
        if (content.includes('gtag') || content.includes('analytics') ||
            content.includes('fbq') || content.includes('_satellite')) {
            script.remove();
            removedCount++;
        }
    });

    // Remove tracking pixels
    element.querySelectorAll('img[src*="pixel"], img[src*="tracking"], noscript').forEach(el => {
        el.remove();
        removedCount++;
    });

    // Remove empty iframes (often analytics)
    element.querySelectorAll('iframe[src=""], iframe:not([src])').forEach(el => {
        el.remove();
        removedCount++;
    });

    Logger.debug(`Cleaned ${removedCount} elements`);

    return element;
}

/**
 * Clean up framework-specific junk attributes
 * CONSERVATIVE - preserves animation-related attributes
 * 
 * @param {HTMLElement} element - Cloned DOM element
 * @returns {HTMLElement} Cleaned element
 */
export function cleanupAttributes(element) {
    const allElements = element.querySelectorAll('*');

    allElements.forEach(el => {
        // Get all attributes
        const attrs = Array.from(el.attributes);

        for (const attr of attrs) {
            const name = attr.name;

            // Skip if in keep list
            if (KEEP_DATA_ATTRIBUTES.includes(name)) {
                continue;
            }

            // Remove if matches remove prefix
            for (const prefix of REMOVE_DATA_PREFIXES) {
                if (name.startsWith(prefix)) {
                    el.removeAttribute(name);
                    break;
                }
            }
        }

        // Remove empty standard attributes
        removeEmptyAttributes(el, ['class', 'style', 'id']);
    });

    return element;
}

/**
 * Full HTML cleanup pipeline
 * @param {HTMLElement} element 
 * @returns {HTMLElement}
 */
export function fullCleanup(element) {
    const cleaned = cleanHTML(element);
    return cleanupAttributes(cleaned);
}
