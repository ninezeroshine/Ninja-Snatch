/**
 * Framework Detector - Identifies CSS system and platform
 * 
 * Detects what technologies a website uses to optimize extraction.
 * Helps choose the right cleanup and normalization strategy.
 * 
 * @module smartExtract/frameworkDetector
 * @version 1.0.0
 */

// ═══════════════════════════════════════════════════════════════════════════
// DETECTION PATTERNS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Patterns for detecting CSS systems
 */
const CSS_SYSTEM_PATTERNS = {
    tailwind: {
        classPatterns: [
            /\b(text-|bg-|flex|grid|gap-|p-|m-|w-|h-|rounded-|shadow-|border-)/,
            /\b(justify-|items-|self-|content-)/,
            /\b(hover:|focus:|active:|group-|dark:|md:|lg:|xl:)/
        ],
        scriptPatterns: [/tailwind/i],
        linkPatterns: [/tailwindcss/i]
    },
    bootstrap: {
        classPatterns: [
            /\b(btn|btn-|col-|row|container|d-flex|d-grid)/,
            /\b(navbar|nav-|card|modal|dropdown)/,
            /\b(ms-|me-|mt-|mb-|ps-|pe-|pt-|pb-)\d/
        ],
        scriptPatterns: [/bootstrap/i],
        linkPatterns: [/bootstrap/i]
    },
    cssModules: {
        classPatterns: [
            /_[a-z]+_[a-z0-9]{5,}_\d+/i,  // _class_hash_1
            /^[a-z]+__[a-z]+--[a-z]+/i     // BEM patterns
        ]
    }
};

/**
 * Patterns for detecting platforms
 */
const PLATFORM_PATTERNS = {
    webflow: {
        classPatterns: [/^w-/, /^wf-/],
        globalVars: ['Webflow'],
        metaPatterns: [/webflow/i]
    },
    framer: {
        attributePatterns: [/^data-framer-/],
        classPatterns: [/^framer-/],
        metaPatterns: [/framer/i]
    },
    nextjs: {
        globalVars: ['__NEXT_DATA__'],
        attributePatterns: [/^data-reactroot/]
    },
    nuxt: {
        globalVars: ['__NUXT__'],
        metaPatterns: [/nuxt/i]
    },
    squarespace: {
        metaPatterns: [/squarespace/i],
        classPatterns: [/^sqs-/]
    },
    shopify: {
        metaPatterns: [/shopify/i],
        globalVars: ['Shopify']
    },
    wordpress: {
        classPatterns: [/^wp-/],
        metaPatterns: [/wordpress/i, /developer.wordpress/i]
    }
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN CLASS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * FrameworkDetector - Identifies what tech stack a page uses
 * 
 * @example
 * const detector = new FrameworkDetector();
 * const info = detector.detect(document);
 * // Returns: { cssSystem: 'tailwind', platform: 'nextjs', confidence: 0.85 }
 */
export class FrameworkDetector {
    constructor() {
        this.cache = null;
    }

    /**
     * Detect framework and CSS system from document
     * 
     * @param {Document} doc - Document to analyze
     * @returns {Object} Detection result
     */
    detect(doc = document) {
        // Return cached result if available
        if (this.cache) return this.cache;

        const result = {
            cssSystem: this._detectCSSSystem(doc),
            platform: this._detectPlatform(doc),
            jsFramework: this._detectJSFramework(doc),
            confidence: 0,
            details: {}
        };

        // Calculate overall confidence
        result.confidence = this._calculateConfidence(result);

        // Cache result
        this.cache = result;

        return result;
    }

    /**
     * Clear cached detection result
     */
    clearCache() {
        this.cache = null;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // CSS SYSTEM DETECTION
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * @private
     */
    _detectCSSSystem(doc) {
        const scores = {
            tailwind: 0,
            bootstrap: 0,
            cssModules: 0,
            custom: 0
        };

        // Collect all classes from body
        const allClasses = this._collectAllClasses(doc.body);
        const classString = allClasses.join(' ');

        // Check Tailwind
        for (const pattern of CSS_SYSTEM_PATTERNS.tailwind.classPatterns) {
            if (pattern.test(classString)) {
                scores.tailwind += 10;
            }
        }

        // Check for Tailwind CDN
        const scripts = doc.querySelectorAll('script[src]');
        for (const script of scripts) {
            if (/tailwind/i.test(script.src)) {
                scores.tailwind += 30;
            }
            if (/bootstrap/i.test(script.src)) {
                scores.bootstrap += 30;
            }
        }

        // Check stylesheets
        const links = doc.querySelectorAll('link[rel="stylesheet"]');
        for (const link of links) {
            if (/tailwind/i.test(link.href)) {
                scores.tailwind += 30;
            }
            if (/bootstrap/i.test(link.href)) {
                scores.bootstrap += 30;
            }
        }

        // Check Bootstrap
        for (const pattern of CSS_SYSTEM_PATTERNS.bootstrap.classPatterns) {
            if (pattern.test(classString)) {
                scores.bootstrap += 10;
            }
        }

        // Check CSS Modules
        for (const pattern of CSS_SYSTEM_PATTERNS.cssModules.classPatterns) {
            if (pattern.test(classString)) {
                scores.cssModules += 15;
            }
        }

        // Determine winner
        const maxScore = Math.max(...Object.values(scores));
        if (maxScore < 10) return 'custom';

        const winner = Object.entries(scores).find(([, score]) => score === maxScore);
        return winner ? winner[0] : 'custom';
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PLATFORM DETECTION
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * @private
     */
    _detectPlatform(doc) {
        // Check global variables
        for (const [platform, patterns] of Object.entries(PLATFORM_PATTERNS)) {
            if (patterns.globalVars) {
                for (const varName of patterns.globalVars) {
                    if (typeof window !== 'undefined' && window[varName]) {
                        return platform;
                    }
                }
            }
        }

        // Check meta tags
        const metaTags = doc.querySelectorAll('meta[name="generator"], meta[content]');
        for (const meta of metaTags) {
            const content = meta.getAttribute('content') || '';
            for (const [platform, patterns] of Object.entries(PLATFORM_PATTERNS)) {
                if (patterns.metaPatterns) {
                    for (const pattern of patterns.metaPatterns) {
                        if (pattern.test(content)) {
                            return platform;
                        }
                    }
                }
            }
        }

        // Check class patterns
        const allClasses = this._collectAllClasses(doc.body).join(' ');
        for (const [platform, patterns] of Object.entries(PLATFORM_PATTERNS)) {
            if (patterns.classPatterns) {
                for (const pattern of patterns.classPatterns) {
                    if (pattern.test(allClasses)) {
                        return platform;
                    }
                }
            }
        }

        // Check data attributes
        const firstElement = doc.body.querySelector('*');
        if (firstElement) {
            for (const [platform, patterns] of Object.entries(PLATFORM_PATTERNS)) {
                if (patterns.attributePatterns) {
                    for (const attr of firstElement.attributes) {
                        for (const pattern of patterns.attributePatterns) {
                            if (pattern.test(attr.name)) {
                                return platform;
                            }
                        }
                    }
                }
            }
        }

        return 'custom';
    }

    // ═══════════════════════════════════════════════════════════════════════
    // JS FRAMEWORK DETECTION
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * @private
     */
    _detectJSFramework(doc) {
        if (typeof window === 'undefined') return 'unknown';

        // React
        if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__ ||
            doc.querySelector('[data-reactroot]') ||
            doc.querySelector('[data-reactid]')) {
            return 'react';
        }

        // Vue
        if (window.__VUE__ || window.Vue) {
            return 'vue';
        }

        // Svelte
        if (doc.querySelector('[data-svelte]') ||
            doc.querySelector('.__svelte')) {
            return 'svelte';
        }

        // Angular
        if (window.ng || doc.querySelector('[ng-version]')) {
            return 'angular';
        }

        return 'vanilla';
    }

    // ═══════════════════════════════════════════════════════════════════════
    // UTILITIES
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Collect all CSS classes from an element tree
     * @private
     */
    _collectAllClasses(element, limit = 500) {
        const classes = [];
        const walk = (el, count = 0) => {
            if (count > limit) return;
            if (el.classList) {
                classes.push(...el.classList);
            }
            for (const child of el.children) {
                walk(child, count + 1);
            }
        };
        if (element) walk(element);
        return classes;
    }

    /**
     * Calculate detection confidence score
     * @private
     */
    _calculateConfidence(result) {
        let confidence = 0.5; // Base confidence

        if (result.cssSystem !== 'custom') {
            confidence += 0.2;
        }

        if (result.platform !== 'custom') {
            confidence += 0.2;
        }

        if (result.jsFramework !== 'unknown' && result.jsFramework !== 'vanilla') {
            confidence += 0.1;
        }

        return Math.min(confidence, 1.0);
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// STANDALONE FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Detect framework from document
 * Standalone function for direct usage
 * 
 * @param {Document} doc 
 * @returns {Object}
 */
export function detectFramework(doc = document) {
    const detector = new FrameworkDetector();
    return detector.detect(doc);
}

// Default export
export default FrameworkDetector;
