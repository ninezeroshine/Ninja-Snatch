/**
 * Ninja-Snatch Platform Detection Patterns
 * Centralized patterns for CSS, scripts, and cleanup
 * @module config/patterns
 */

/**
 * External CSS domain patterns to capture
 */
export const EXTERNAL_CSS_PATTERNS = [
    'website-files.com',   // Webflow
    'webflow.com',         // Webflow CDN
    'framer.com',          // Framer
    'assets.',             // Various CDNs
    '.css'                 // Any CSS file
];

/**
 * Scripts to preserve for animations
 */
export const PRESERVE_SCRIPT_PATTERNS = [
    'webflow',
    'jquery',
    'gsap',
    'framer',
    'motion',
    'anime',
    'lottie',
    'scroll',
    'animation',
    'w-',        // Webflow widgets
    'Webflow'
];

/**
 * Scripts to remove (analytics, extensions)
 */
export const REMOVE_SCRIPT_PATTERNS = [
    'chrome-extension://',
    'analytics',
    'gtag',
    'gtm',
    'google-analytics',
    'facebook',
    'pixel',
    'hotjar',
    'crisp',
    'intercom',
    'zendesk'
];

/**
 * Browser extension selectors to remove
 */
export const EXTENSION_SELECTORS = [
    '[id="moat-moat"]',
    '[class^="float-moat"]',
    '[id*="grammarly"]',
    '[class*="grammarly"]',
    '[data-grammarly-shadow-root]',
    'grammarly-extension',
    '[id*="lastpass"]',
    '[data-dashlane]',
    'next-route-announcer',
    '[src^="chrome-extension://"]'
];

/**
 * Data attributes to remove (prefix match)
 */
export const REMOVE_DATA_PREFIXES = [
    'data-framer-',      // Framer internal
    'data-radix-',       // Radix UI
    'data-testid',       // Testing
    'data-sentry-',      // Sentry
    'data-gtm-',         // Google Tag Manager
    'data-ga-'           // Google Analytics
];

/**
 * Data attributes to KEEP (even if matched above)
 */
export const KEEP_DATA_ATTRIBUTES = [
    'data-w-id',         // Webflow animations
    'data-animation',    // Generic animations
    'data-scroll',       // Scroll triggers
    'data-src',          // Lazy loading
    'data-srcset'        // Responsive images
];

/**
 * Elements to skip during animation processing
 */
export const SKIP_ANIMATION_SELECTORS = [
    '.pointer-events-none',
    '[aria-hidden="true"]',
    '.modal',
    '[class*="cursor"]'
];

/**
 * Marquee detection patterns
 */
export const MARQUEE_PATTERNS = {
    /** Class-based detection */
    classPatterns: [
        '.marquee-track',
        '.marquee-reverse-track',
        '[class*="marquee-track"]',
        '[class*="marquee-reverse-track"]'
    ],

    /** Generic patterns (React/Next.js style) */
    genericPatterns: [
        '[class*="whitespace-nowrap"]',
        '[class*="scroll"]'
    ],

    /** Minimum children for auto-detection */
    minChildren: 4
};

/**
 * Cursor detection patterns - UNIVERSAL
 * Covers: React, Vue, Framer, Webflow, vanilla JS cursors
 */
export const CURSOR_PATTERNS = {
    /** Class-based detection (most reliable) */
    classPatterns: [
        // Tailwind z-index patterns
        '[class*="z-[9999]"]',
        '[class*="z-[999]"]',
        '[class*="z-50"]',
        // Explicit cursor classes
        '[class*="cursor"]',
        '[class*="Cursor"]',
        '.custom-cursor',
        '.cursor-dot',
        '.cursor-outline',
        '.cursor-follower',
        // Framer patterns
        '[class*="pointer"]',
        // Generic fixed overlay patterns
        '.cursor-wrapper',
        '.mouse-follower'
    ],

    /** Style-based detection */
    stylePatterns: [
        'pointer-events: none',
        'position: fixed'
    ],

    /** Structural detection - elements that look like cursors */
    structuralHints: {
        /** Cursor usually has these CSS properties */
        requiredStyles: ['pointer-events: none'],
        /** Cursor is usually small (under 100x100) */
        maxSize: 100,
        /** Cursor usually has high z-index */
        minZIndex: 9000
    }
};

/**
 * Counter detection patterns - UNIVERSAL
 * Detects animated number counters across frameworks
 */
export const COUNTER_PATTERNS = {
    /** Data attributes for target value (highest priority) */
    targetAttributes: [
        'data-target',
        'data-count',
        'data-value',
        'data-end',
        'data-number',
        'data-counter'
    ],

    /** Sibling text that indicates counter type */
    suffixPatterns: {
        '+': { defaultValue: 50, description: 'Projects/clients count' },
        '%': { defaultValue: 98, description: 'Percentage' },
        'k': { defaultValue: 10, description: 'Thousands' },
        'K': { defaultValue: 10, description: 'Thousands' },
        'M': { defaultValue: 1, description: 'Millions' },
        '+': { defaultValue: 50, description: 'Plus indicator' }
    },

    /** Container classes that help identify counters */
    containerPatterns: [
        '[class*="counter"]',
        '[class*="stat"]',
        '[class*="number"]',
        '[class*="metric"]',
        '[class*="achievement"]'
    ],

    /** Animation duration range (ms) */
    duration: { min: 1500, max: 3000, default: 2000 }
};

/**
 * Reveal animation detection patterns - UNIVERSAL
 */
export const REVEAL_PATTERNS = {
    /** Elements with these inline styles need reveal animation */
    hiddenStyles: [
        'opacity: 0',
        'opacity:0',
        'visibility: hidden',
        'transform: translateY',
        'transform: translateX',
        'transform: scale(0',
        'transform:translateY',
        'transform:translateX'
    ],

    /** Data attributes indicating scroll-triggered animation */
    scrollTriggerAttributes: [
        'data-aos',           // AOS library
        'data-scroll',        // Locomotive Scroll
        'data-sal',           // SAL library
        'data-animate',       // Generic
        'data-reveal',        // Generic
        'data-inview',        // Custom
        'data-w-id'           // Webflow
    ],

    /** Class patterns for animated elements */
    animatedClassPatterns: [
        '[class*="aos-"]',
        '[class*="animate-"]',
        '[class*="reveal"]',
        '[class*="fade-"]',
        '[class*="slide-"]'
    ]
};

/**
 * Parallax/Scroll effect detection - UNIVERSAL
 */
export const PARALLAX_PATTERNS = {
    /** Style indicators of parallax elements */
    styleIndicators: [
        'will-change: transform',
        'transform: translate3d',
        'transform: scale3d',
        'transform:translate3d'
    ],

    /** Class patterns */
    classPatterns: [
        '[class*="parallax"]',
        '[class*="Parallax"]',
        '[data-parallax]',
        '[data-speed]',
        '[data-scroll-speed]'
    ],

    /** Elements to skip (they have their own animation) */
    skipPatterns: [
        '.marquee-track',
        '.marquee-reverse-track',
        '[class*="marquee"]'
    ]
};
