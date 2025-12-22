/**
 * Ninja-Snatch Logger
 * Conditional debug logging with structured output
 * @module utils/logger
 */

import { DEFAULTS } from '../config/defaults.js';

/**
 * Log levels
 * @enum {string}
 */
export const LogLevel = {
    DEBUG: 'debug',
    INFO: 'info',
    WARN: 'warn',
    ERROR: 'error'
};

/**
 * Logger instance with conditional output
 */
export const Logger = {
    /**
     * Check if debug mode is enabled
     * @returns {boolean}
     */
    isDebugEnabled() {
        return (typeof window !== 'undefined' && window.SnatcherConfig?.DEBUG) ||
            DEFAULTS.debug;
    },

    /**
     * Format log message with prefix
     * @param {string} level 
     * @returns {string}
     */
    _prefix(level) {
        return `[Snatch ${level.toUpperCase()}]`;
    },

    /**
     * Log debug message (only in debug mode)
     * @param {...any} args 
     */
    debug(...args) {
        if (!this.isDebugEnabled()) return;
        console.log(this._prefix(LogLevel.DEBUG), ...args);
    },

    /**
     * Log info message (only in debug mode)
     * @param {...any} args 
     */
    info(...args) {
        if (!this.isDebugEnabled()) return;
        console.log(this._prefix(LogLevel.INFO), ...args);
    },

    /**
     * Log warning message (only in debug mode)
     * @param {...any} args 
     */
    warn(...args) {
        if (!this.isDebugEnabled()) return;
        console.warn(this._prefix(LogLevel.WARN), ...args);
    },

    /**
     * Log error message (always shown)
     * @param {...any} args 
     */
    error(...args) {
        console.error(this._prefix(LogLevel.ERROR), ...args);
    },

    /**
     * Log with timing info
     * @param {string} label 
     * @param {Function} fn 
     * @returns {any} Result of fn
     */
    time(label, fn) {
        if (!this.isDebugEnabled()) return fn();

        const start = performance.now();
        const result = fn();
        const duration = (performance.now() - start).toFixed(2);
        console.log(this._prefix(LogLevel.DEBUG), `${label}: ${duration}ms`);
        return result;
    }
};
