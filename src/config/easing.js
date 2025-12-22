/**
 * Ninja-Snatch Easing Presets
 * Centralized animation easing curves
 * @module config/easing
 */

/**
 * Easing curves as cubic-bezier arrays [x1, y1, x2, y2]
 * Compatible with Motion.dev and CSS
 */
export const EASING = {
    /** Smooth exponential ease-out - primary animation curve */
    EXPO_OUT: [0.16, 1, 0.3, 1],

    /** Quart ease-out - secondary animations */
    QUART_OUT: [0.25, 1, 0.5, 1],

    /** Linear - for continuous animations like marquee */
    LINEAR: [0, 0, 1, 1],

    /** Smooth ease-out for UI interactions */
    EASE_OUT: [0, 0, 0.2, 1],

    /** Cubic ease-out for counters */
    CUBIC_OUT: 'cubic-out' // Special case for counter animation
};

/**
 * Get CSS cubic-bezier string from easing array
 * @param {number[]} easing - Easing array [x1, y1, x2, y2]
 * @returns {string} CSS cubic-bezier function
 */
export function toCSSEasing(easing) {
    if (typeof easing === 'string') return easing;
    return `cubic-bezier(${easing.join(', ')})`;
}

/**
 * CSS custom properties for easing
 * Can be injected into document for CSS-only animations
 */
export const CSS_EASING_VARS = `
:root {
    --ease-expo-out: cubic-bezier(0.16, 1, 0.3, 1);
    --ease-quart-out: cubic-bezier(0.25, 1, 0.5, 1);
    --ease-out: cubic-bezier(0, 0, 0.2, 1);
}
`;
