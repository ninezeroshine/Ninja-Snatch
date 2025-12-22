/**
 * Ninja-Snatch Configuration v1.2
 * Centralized settings and platform patterns
 */

// Guard against multiple injections
if (typeof window.SnatcherConfig === 'undefined') {

    const SnatcherConfig = {
        /** Version */
        VERSION: '8.0',

        /** Debug mode - enables verbose logging */
        DEBUG: false,

        /**
         * External CSS domain patterns to capture
         * Used in collectExternalLinks()
         */
        externalCSSPatterns: [
            'website-files.com',   // Webflow
            'webflow.com',         // Webflow CDN
            'framer.com',          // Framer
            'assets.',             // Various CDNs
            '.css'                 // Any CSS file
        ],

        /**
         * Scripts to preserve for animations
         * Used in cleanHTML()
         */
        preserveScriptPatterns: [
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
        ],

        /**
         * Scripts to remove (analytics, extensions)
         * Used in cleanHTML()
         */
        removeScriptPatterns: [
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
        ],

        /**
         * Browser extension selectors to remove
         * Used in cleanHTML()
         */
        extensionSelectors: [
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
                'data-framer-',      // Framer internal
                'data-radix-',       // Radix UI
                'data-testid',       // Testing
                'data-sentry-',      // Sentry
                'data-gtm-',         // Google Tag Manager
                'data-ga-'           // Google Analytics
            ],

            /** Data attributes to KEEP (even if matched above) */
            keepDataAttributes: [
                'data-w-id',         // Webflow animations
                'data-animation',    // Generic animations
                'data-scroll',       // Scroll triggers
                'data-src',          // Lazy loading
                'data-srcset'        // Responsive images
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
