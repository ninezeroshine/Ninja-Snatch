/**
 * Cleanup Patterns for HTML Processing
 * 
 * Ported from v1 config.js with TypeScript typing.
 * Used to remove browser extensions, tracking scripts, and framework junk.
 */

/**
 * Scripts patterns to PRESERVE (animation libraries)
 */
export const PRESERVE_SCRIPT_PATTERNS = [
    // Animation Libraries
    'webflow',
    'gsap',
    'framer',
    'motion',
    'anime',
    'lottie',
    'scroll',
    'animation',
    'locomotive',
    'aos',
    'swiper',
    'splide',
    'glide',
    'barba',
    // Core Libraries
    'jquery',
    // Platform-specific
    'w-',
    'Webflow',
] as const;

/**
 * Scripts patterns to REMOVE (analytics, tracking)
 */
export const REMOVE_SCRIPT_PATTERNS = [
    // Browser Extensions
    'chrome-extension://',
    'moz-extension://',
    // Google
    'analytics',
    'gtag',
    'gtm',
    'google-analytics',
    'googletagmanager',
    // Social/Ads
    'facebook',
    'fbevents',
    'pixel',
    'twitter',
    'linkedin',
    'tiktok',
    // Analytics Platforms
    'hotjar',
    'mixpanel',
    'segment',
    'amplitude',
    'heap',
    'fullstory',
    'clarity',
    'mouseflow',
    'luckyorange',
    'crazyegg',
    // Customer Support
    'crisp',
    'intercom',
    'zendesk',
    'hubspot',
    'drift',
    'freshdesk',
] as const;

/**
 * CSS selectors for browser extension elements to remove
 */
export const EXTENSION_SELECTORS = [
    // Ad blockers
    '[id="moat-moat"]',
    '[class^="float-moat"]',
    // Grammar checkers
    '[id*="grammarly"]',
    '[class*="grammarly"]',
    '[data-grammarly-shadow-root]',
    'grammarly-extension',
    // Password managers
    '[id*="lastpass"]',
    '[data-dashlane]',
    '[id*="1password"]',
    '[class*="bitwarden"]',
    '[data-protonpass]',
    // Framework artifacts
    'next-route-announcer',
    // Generic extension elements
    '[src^="chrome-extension://"]',
    '[src^="moz-extension://"]',
    // Our own extension (avoid self-capture)
    'ninja-snatch-panel',
    '#ninja-highlight-overlay',
    '#ninja-highlight-label',
] as const;

/**
 * Data attribute prefixes to REMOVE
 */
export const REMOVE_DATA_PREFIXES = [
    // Framework internals
    'data-framer-',
    'data-radix-',
    'data-headlessui-',
    'data-testid',
    'data-cy',
    'data-test-',
    // Analytics/Tracking
    'data-sentry-',
    'data-gtm-',
    'data-ga-',
    'data-analytics-',
    // React/Vue/Next internals
    'data-react-',
    'data-v-',
    'data-next-',
] as const;

/**
 * Data attributes to KEEP (functionality related)
 */
export const KEEP_DATA_ATTRIBUTES = [
    // Webflow
    'data-w-id',
    'data-wf-',
    // Animation libraries
    'data-animation',
    'data-aos',
    'data-aos-delay',
    'data-aos-duration',
    'data-scroll',
    'data-scroll-speed',
    'data-speed',
    'data-delay',
    // Counters
    'data-target',
    'data-count',
    'data-value',
    'data-end',
    'data-number',
    // Images
    'data-src',
    'data-srcset',
    'data-sizes',
    // Sliders
    'data-swiper-',
    'data-splide-',
    'data-slide-',
    // Our data-truth for AI
    'data-truth',
] as const;

/**
 * Animation reset patterns for inline style cleaning
 */
export const ANIMATION_RESET_CONFIG = {
    /** Opacity below this threshold will be reset to 1 */
    opacityThreshold: 0.5,

    /** Transform patterns to remove from inline styles */
    transformPatterns: [
        /transform\s*:\s*translate3d\([^)]+\)[^;]*(;|$)/gi,
        /transform\s*:\s*translateY\([^)]+\)[^;]*(;|$)/gi,
        /transform\s*:\s*translateX\([^)]+\)[^;]*(;|$)/gi,
    ],

    /** Additional properties to remove */
    removeProperties: [
        /will-change\s*:[^;]+(;|$)/gi,
        /transform-style\s*:\s*preserve-3d\s*(;|$)/gi,
    ],
} as const;

/**
 * External CSS domain patterns to capture
 */
export const EXTERNAL_CSS_PATTERNS = [
    // Website Builders
    'website-files.com',
    'webflow.com',
    'framer.com',
    'squarespace.com',
    'wix.com',
    'shopify.com',
    'cargo.site',
    // CDNs
    'assets.',
    'cdn.',
    'static.',
    // Generic
    '.css',
] as const;
