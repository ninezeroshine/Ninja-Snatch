/**
 * Ninja-Snatch Configuration v9.0
 * Centralized settings and platform patterns
 * 
 * This file contains all configurable patterns for:
 * - External CSS detection
 * - Script preservation/removal
 * - Browser extension cleanup
 * - Data attribute handling
 */

// Guard against multiple injections
if (typeof window.SnatcherConfig === 'undefined') {

    const SnatcherConfig = {
        /** Version */
        VERSION: '9.0',

        /** Debug mode - enables verbose logging */
        DEBUG: false,

        /**
         * External CSS domain patterns to capture
         * Used in collectExternalLinks()
         */
        externalCSSPatterns: [
            // Website Builders
            'website-files.com',   // Webflow
            'webflow.com',         // Webflow CDN
            'framer.com',          // Framer
            'squarespace.com',     // Squarespace
            'wix.com',             // Wix
            'shopify.com',         // Shopify
            'cargo.site',          // Cargo
            // CDNs
            'assets.',             // Various CDNs
            'cdn.',                // Generic CDN prefix
            'static.',             // Static assets
            // Generic
            '.css'                 // Any CSS file
        ],

        /**
         * Scripts to preserve for animations
         * Used in cleanHTML()
         */
        preserveScriptPatterns: [
            // Animation Libraries
            'webflow',
            'gsap',
            'framer',
            'motion',
            'anime',
            'lottie',
            'scroll',
            'animation',
            'locomotive',          // Locomotive Scroll
            'aos',                 // Animate On Scroll
            'swiper',              // Swiper.js
            'splide',              // Splide.js
            'glide',               // Glide.js
            'barba',               // Barba.js (page transitions)
            // Core Libraries
            'jquery',
            // Platform-specific
            'w-',                  // Webflow widgets
            'Webflow'
        ],

        /**
         * Scripts to remove (analytics, tracking, extensions)
         * Used in cleanHTML()
         */
        removeScriptPatterns: [
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
            'clarity',             // Microsoft Clarity
            'mouseflow',
            'luckyorange',
            'crazyegg',
            // Customer Support
            'crisp',
            'intercom',
            'zendesk',
            'hubspot',
            'drift',
            'freshdesk'
        ],

        /**
         * Browser extension selectors to remove
         * Used in cleanHTML()
         */
        extensionSelectors: [
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
            '[src^="moz-extension://"]'
        ],

        /**
         * Animation-related properties to clean from inline styles
         */
        animationResetPatterns: {
            /** Opacity below this threshold will be removed */
            opacityThreshold: 0.5,

            /** Transform patterns to remove */
            transformPatterns: [
                /transform\s*:\s*translate3d\([^)]+\)[^;]*(;|$)/gi,
                /transform\s*:\s*translateY\([^)]+\)[^;]*(;|$)/gi,
                /transform\s*:\s*translateX\([^)]+\)[^;]*(;|$)/gi
            ],

            /** Additional properties to remove */
            removeProperties: [
                /will-change\s*:[^;]+(;|$)/gi,
                /transform-style\s*:\s*preserve-3d\s*(;|$)/gi
            ]
        },

        /**
         * Cleanup patterns for removing framework junk (CONSERVATIVE)
         * Keep data-w-id for Webflow animations!
         */
        cleanupPatterns: {
            /** Data attributes to remove (prefix match) */
            removeDataPrefixes: [
                // Framework internals
                'data-framer-',      // Framer internal
                'data-radix-',       // Radix UI
                'data-headlessui-',  // Headless UI
                'data-testid',       // Testing
                'data-cy',           // Cypress testing
                'data-test-',        // Generic testing
                // Analytics/Tracking
                'data-sentry-',      // Sentry
                'data-gtm-',         // Google Tag Manager
                'data-ga-',          // Google Analytics
                'data-analytics-',   // Generic analytics
                // React/Vue/Next internals
                'data-react-',       // React internals
                'data-v-',           // Vue scoped styles
                'data-next-'         // Next.js internals
            ],

            /** Data attributes to KEEP (animation/functionality related) */
            keepDataAttributes: [
                // Webflow
                'data-w-id',         // Webflow animations
                'data-wf-',          // Webflow general
                // Animation libraries
                'data-animation',    // Generic animations
                'data-aos',          // Animate On Scroll
                'data-aos-delay',
                'data-aos-duration',
                'data-scroll',       // Locomotive/generic scroll
                'data-scroll-speed',
                'data-speed',        // Parallax speed
                'data-delay',        // Animation delay
                // Counters
                'data-target',       // Counter target value
                'data-count',        // Count animation
                'data-value',        // Value for animations
                'data-end',          // End value
                'data-number',       // Number display
                // Images
                'data-src',          // Lazy loading
                'data-srcset',       // Responsive images
                'data-sizes',        // Image sizes
                // Sliders
                'data-swiper-',      // Swiper.js
                'data-splide-',      // Splide.js
                'data-slide-'        // Generic sliders
            ],

            /** Attributes to remove if empty */
            removeIfEmpty: ['class', 'style', 'id']
        },

        /**
         * Motion.dev CDN for advanced animations
         */
        motionDev: {
            enabled: true,
            cdnUrl: 'https://cdn.jsdelivr.net/npm/motion@11.13.5/mini/+esm',
            version: '11.13.5'
        },

        /**
         * HTML/CSS beautify options (js-beautify compatible)
         */
        beautifyOptions: {
            html: {
                indent_size: 2,
                wrap_line_length: 120,
                preserve_newlines: true,
                max_preserve_newlines: 2,
                indent_inner_html: true,
                extra_liners: ['head', 'body', 'main', 'section', 'header', 'footer', 'nav']
            },
            css: {
                indent_size: 2,
                selector_separator_newline: true,
                end_with_newline: true
            }
        }
    };

    // Export to window
    if (typeof window !== 'undefined') {
        window.SnatcherConfig = SnatcherConfig;
    }

} // end guard
