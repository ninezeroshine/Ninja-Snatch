/**
 * Ninja-Snatch Configuration Defaults
 * Single source of truth for version and settings
 * @module config/defaults
 */

export const VERSION = '10.0.0';

export const DEFAULTS = {
    /** Debug mode - enables verbose logging */
    debug: false,

    /** Document title when none provided */
    defaultTitle: 'Snatched Content',

    /** Motion.dev CDN configuration */
    motionDev: {
        enabled: true,
        cdnUrl: 'https://cdn.jsdelivr.net/npm/motion@11.13.5/+esm',
        version: '11.13.5'
    },

    /** Tailwind CDN */
    tailwindCdn: 'https://cdn.tailwindcss.com',

    /** Animation durations (ms) */
    durations: {
        reveal: 600,
        transform: 700,
        counter: 2000,
        marquee: 25000
    },

    /** Delays */
    delays: {
        maxReveal: 1000,
        maxTransform: 800,
        stagger: 0.08
    }
};
