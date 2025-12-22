/**
 * Ninja-Snatch CSS Matcher
 * Matches CSS rules to elements
 * @module css/CSSMatcher
 */

import { Logger } from '../utils/logger.js';

/**
 * Collect all CSS classes used by an element and its descendants
 * @param {HTMLElement} element 
 * @returns {Set<string>} Set of class names
 */
export function collectUsedClasses(element) {
    const classes = new Set();

    /**
     * Traverse element tree
     * @param {HTMLElement} el 
     */
    const traverse = (el) => {
        if (el.classList) {
            el.classList.forEach(cls => classes.add(cls));
        }

        for (const child of el.children) {
            traverse(child);
        }
    };

    traverse(element);
    return classes;
}

/**
 * Collect all IDs used by an element and its descendants
 * @param {HTMLElement} element 
 * @returns {Set<string>}
 */
export function collectUsedIds(element) {
    const ids = new Set();

    if (element.id) {
        ids.add(element.id);
    }

    element.querySelectorAll('[id]').forEach(el => {
        if (el.id) ids.add(el.id);
    });

    return ids;
}

/**
 * Collect all tag names used by an element and its descendants
 * @param {HTMLElement} element 
 * @returns {Set<string>}
 */
export function collectUsedTags(element) {
    const tags = new Set();

    tags.add(element.tagName.toLowerCase());

    element.querySelectorAll('*').forEach(el => {
        tags.add(el.tagName.toLowerCase());
    });

    return tags;
}

/**
 * Get CSS rules that match the used classes, IDs, and tags
 * @param {Set<string>} usedClasses 
 * @param {HTMLElement} element 
 * @param {Array<{selector: string, cssText: string}>} allRules 
 * @returns {string} Matched CSS rules as string
 */
export function getMatchedCSSRules(usedClasses, element, allRules) {
    const usedIds = collectUsedIds(element);
    const usedTags = collectUsedTags(element);

    // Also collect attribute selectors that might match
    const selectors = new Set();

    /**
     * Collect all possible selectors an element might match
     * @param {HTMLElement} el 
     */
    const collectSelectors = (el) => {
        // Tag
        selectors.add(el.tagName.toLowerCase());

        // Classes
        if (el.classList) {
            el.classList.forEach(cls => selectors.add(`.${cls}`));
        }

        // ID
        if (el.id) {
            selectors.add(`#${el.id}`);
        }

        // Data attributes
        Array.from(el.attributes).forEach(attr => {
            if (attr.name.startsWith('data-')) {
                selectors.add(`[${attr.name}]`);
            }
        });
    };

    collectSelectors(element);
    element.querySelectorAll('*').forEach(collectSelectors);

    // Match rules
    const matched = [];
    const seen = new Set();

    for (const rule of allRules) {
        const selector = rule.selector;

        // Skip if already seen
        if (seen.has(selector)) continue;

        // Check if selector might match any of our elements
        let matches = false;

        // Media queries - always include
        if (selector.startsWith('@media')) {
            matches = true;
        }
        // Universal selectors
        else if (selector === '*' || selector === 'html' || selector === 'body') {
            matches = true;
        }
        // Check against collected selectors
        else {
            // Simple matching - check if any collected selector is in the rule selector
            for (const sel of selectors) {
                if (selector.includes(sel.replace('.', '').replace('#', ''))) {
                    matches = true;
                    break;
                }
            }

            // Also check classes directly
            if (!matches) {
                for (const cls of usedClasses) {
                    if (selector.includes(cls)) {
                        matches = true;
                        break;
                    }
                }
            }
        }

        if (matches) {
            seen.add(selector);

            if (selector.startsWith('@media')) {
                matched.push(`${selector} {\n${rule.cssText}\n}`);
            } else {
                matched.push(`${selector} { ${rule.cssText} }`);
            }
        }
    }

    Logger.debug(`Matched ${matched.length} of ${allRules.length} rules`);

    return matched.join('\n');
}

/**
 * Check if document uses Tailwind CSS
 * @returns {boolean}
 */
export function hasTailwind() {
    // Check for Tailwind classes
    const tailwindIndicators = [
        'flex', 'grid', 'items-center', 'justify-center',
        'bg-', 'text-', 'p-', 'm-', 'w-', 'h-',
        'rounded', 'shadow', 'hover:', 'md:', 'lg:'
    ];

    const allClasses = document.body.className + ' ' +
        Array.from(document.querySelectorAll('[class]'))
            .map(el => el.className)
            .join(' ');

    return tailwindIndicators.some(indicator => allClasses.includes(indicator));
}
