/**
 * Ninja-Snatch Shared Helpers
 * Common utility functions
 * @module utils/helpers
 */

import { SKIP_ANIMATION_SELECTORS } from '../config/patterns.js';

/**
 * Check if element should be skipped during animation processing
 * @param {HTMLElement} element 
 * @returns {boolean}
 */
export function shouldSkipElement(element) {
    if (!element) return true;

    for (const selector of SKIP_ANIMATION_SELECTORS) {
        if (element.matches(selector) || element.closest(selector)) {
            return true;
        }
    }

    return false;
}

/**
 * Check if string matches any pattern in array
 * @param {string} str - String to check
 * @param {string[]} patterns - Patterns to match against
 * @returns {boolean}
 */
export function matchesAnyPattern(str, patterns) {
    if (!str || !patterns) return false;
    const lowerStr = str.toLowerCase();
    return patterns.some(pattern => lowerStr.includes(pattern.toLowerCase()));
}

/**
 * Sanitize string for use as filename
 * @param {string} str - Input string
 * @param {number} maxLength - Maximum length
 * @returns {string} Safe filename
 */
export function sanitizeFilename(str, maxLength = 30) {
    return str.replace(/[^a-z0-9а-яё]/gi, '_').substring(0, maxLength) || 'snatched';
}

/**
 * Deep clone an HTML element
 * @param {HTMLElement} element 
 * @returns {HTMLElement}
 */
export function cloneElement(element) {
    return element.cloneNode(true);
}

/**
 * Check if element has animation-related inline styles
 * @param {HTMLElement} element 
 * @returns {boolean}
 */
export function hasAnimatedStyles(element) {
    const style = element.getAttribute('style') || '';
    return style.includes('opacity') ||
        style.includes('transform') ||
        style.includes('translate');
}

/**
 * Remove empty attributes from element
 * @param {HTMLElement} element 
 * @param {string[]} attributes - Attributes to check
 */
export function removeEmptyAttributes(element, attributes = ['class', 'style', 'id']) {
    for (const attr of attributes) {
        const value = element.getAttribute(attr);
        if (value !== null && value.trim() === '') {
            element.removeAttribute(attr);
        }
    }
}

/**
 * Get computed style value with fallback
 * @param {HTMLElement} element 
 * @param {string} property 
 * @param {string} fallback 
 * @returns {string}
 */
export function getStyleValue(element, property, fallback = '') {
    try {
        const computed = window.getComputedStyle(element);
        return computed[property] || fallback;
    } catch (e) {
        return fallback;
    }
}

/**
 * Debounce function execution
 * @param {Function} fn 
 * @param {number} delay 
 * @returns {Function}
 */
export function debounce(fn, delay = 100) {
    let timer;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}
