/**
 * Pattern Recognizer - Core of Smart Extract Pipeline
 * 
 * Analyzes DOM structure to find repeating patterns (cards, lists, grids)
 * and component boundaries. Uses fuzzy matching to handle variations
 * like badges, different content, or modifier classes.
 * 
 * @module smartExtract/patternRecognizer
 * @version 1.0.0
 */

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Similarity threshold for considering elements as "same pattern"
 * Elements with similarity >= 70% are grouped together
 */
const SIMILARITY_THRESHOLD = 70;

/**
 * Minimum group size to be considered a "repeating pattern"
 * Groups smaller than this are treated as individual elements
 */
const MIN_REPEATING_GROUP_SIZE = 2;

/**
 * Weights for similarity calculation
 * Adjust these to change how similarity is computed
 */
const SIMILARITY_WEIGHTS = {
    tag: 30,        // Same HTML tag
    structure: 40,  // Similar child tree structure
    classes: 20,    // Overlapping static CSS classes
    attributes: 10  // Same attribute keys (not values)
};

/**
 * Patterns for dynamic/modifier classes to ignore in comparison
 * These classes change per-instance and shouldn't affect similarity
 */
const DYNAMIC_CLASS_PATTERNS = [
    /_[a-z0-9]{5,}_\d+$/i,          // CSS Modules hashes
    /^(hover|focus|active|group-):/,  // Tailwind state variants
    /^is-/,                           // State indicator classes
    /^has-/,                          // Content indicator classes
    /^js-/,                           // JavaScript hook classes
    /--\d+$/,                         // BEM modifiers with numbers
    /^\d+-/,                          // Numeric prefixes
];

// ═══════════════════════════════════════════════════════════════════════════
// MAIN CLASS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * PatternRecognizer - Finds repeating patterns in DOM
 * 
 * @example
 * const recognizer = new PatternRecognizer();
 * const patterns = recognizer.analyze(containerElement);
 * // Returns: [{ type: 'repeating', elements: [...], template: Element }]
 */
export class PatternRecognizer {
    constructor(options = {}) {
        this.options = {
            threshold: options.threshold || SIMILARITY_THRESHOLD,
            minGroupSize: options.minGroupSize || MIN_REPEATING_GROUP_SIZE,
            weights: { ...SIMILARITY_WEIGHTS, ...options.weights }
        };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PUBLIC API
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Analyze an element and find all patterns
     * 
     * @param {HTMLElement} element - Root element to analyze
     * @param {Object} [frameworkInfo] - Optional framework detection info
     * @returns {Array<Pattern>} Found patterns
     */
    analyze(element, frameworkInfo = null) {
        if (!element || !(element instanceof HTMLElement)) {
            throw new Error('PatternRecognizer: element must be an HTMLElement');
        }

        const patterns = [];

        // Find repeating patterns among direct children
        const directPatterns = this.findRepeatingPatterns(element);
        patterns.push(...directPatterns);

        // Recursively analyze non-repeating children
        const processedElements = new Set(
            directPatterns.flatMap(p => p.elements)
        );

        for (const child of element.children) {
            if (!processedElements.has(child) && child.children.length > 0) {
                const childPatterns = this.analyze(child, frameworkInfo);
                patterns.push(...childPatterns);
            }
        }

        return patterns;
    }

    /**
     * Find repeating patterns among direct children of an element
     * 
     * @param {HTMLElement} parent - Parent element
     * @returns {Array<Pattern>} Repeating patterns found
     */
    findRepeatingPatterns(parent) {
        const children = [...parent.children];
        if (children.length < this.options.minGroupSize) {
            return [];
        }

        const groups = [];
        let currentGroup = [];
        let templateElement = null;

        for (let i = 0; i < children.length; i++) {
            const child = children[i];

            if (currentGroup.length === 0) {
                // Start new group
                currentGroup.push(child);
                templateElement = child;
            } else {
                // Compare with template
                const similarity = this.calculateSimilarity(child, templateElement);

                if (similarity >= this.options.threshold) {
                    // Add to current group
                    currentGroup.push(child);
                } else {
                    // Save current group if large enough
                    if (currentGroup.length >= this.options.minGroupSize) {
                        groups.push({
                            type: 'repeating',
                            elements: [...currentGroup],
                            template: templateElement,
                            similarity: this._calculateGroupSimilarity(currentGroup)
                        });
                    }
                    // Start new group
                    currentGroup = [child];
                    templateElement = child;
                }
            }
        }

        // Don't forget last group
        if (currentGroup.length >= this.options.minGroupSize) {
            groups.push({
                type: 'repeating',
                elements: [...currentGroup],
                template: templateElement,
                similarity: this._calculateGroupSimilarity(currentGroup)
            });
        }

        return groups;
    }

    /**
     * Calculate similarity between two elements (0-100)
     * 
     * @param {HTMLElement} el1 - First element
     * @param {HTMLElement} el2 - Second element
     * @returns {number} Similarity score (0-100)
     */
    calculateSimilarity(el1, el2) {
        if (!el1 || !el2) return 0;

        const weights = this.options.weights;
        let score = 0;

        // 1. Tag match (30%)
        if (el1.tagName === el2.tagName) {
            score += weights.tag;
        }

        // 2. Structure match (40%)
        const structureScore = this._compareStructure(el1, el2);
        score += (structureScore / 100) * weights.structure;

        // 3. Static classes match (20%)
        const classScore = this._compareClasses(el1, el2);
        score += classScore * weights.classes;

        // 4. Attribute keys match (10%)
        const attrScore = this._compareAttributeKeys(el1, el2);
        score += (attrScore / 100) * weights.attributes;

        return Math.round(score);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STRUCTURE COMPARISON
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Compare structural similarity of two element trees
     * 
     * @private
     * @param {HTMLElement} el1 
     * @param {HTMLElement} el2 
     * @returns {number} Structure similarity (0-100)
     */
    _compareStructure(el1, el2) {
        const sig1 = this._getStructureSignature(el1);
        const sig2 = this._getStructureSignature(el2);

        if (sig1 === sig2) return 100;

        // Calculate Levenshtein-like similarity for signatures
        const maxLen = Math.max(sig1.length, sig2.length);
        if (maxLen === 0) return 100;

        const distance = this._calculateSignatureDistance(sig1, sig2);
        return Math.round((1 - distance / maxLen) * 100);
    }

    /**
     * Get a structural signature of an element (tags only, no content)
     * 
     * @private
     * @param {HTMLElement} el 
     * @param {number} [depth=3] - Max depth to traverse
     * @returns {string} Structural signature
     */
    _getStructureSignature(el, depth = 3) {
        if (depth === 0 || !el.children.length) {
            return el.tagName;
        }

        const childSignatures = [...el.children]
            .map(child => this._getStructureSignature(child, depth - 1))
            .join(',');

        return `${el.tagName}[${childSignatures}]`;
    }

    /**
     * Calculate edit distance between two signatures
     * Simplified version for performance
     * 
     * @private
     */
    _calculateSignatureDistance(sig1, sig2) {
        // Split into tokens
        const tokens1 = sig1.match(/[A-Z]+|\[|\]|,/g) || [];
        const tokens2 = sig2.match(/[A-Z]+|\[|\]|,/g) || [];

        const set1 = new Set(tokens1);
        const set2 = new Set(tokens2);

        // Count differences
        let differences = 0;
        for (const token of set1) {
            if (!set2.has(token)) differences++;
        }
        for (const token of set2) {
            if (!set1.has(token)) differences++;
        }

        return differences;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // CLASS COMPARISON
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Compare CSS classes between elements, ignoring dynamic ones
     * 
     * @private
     * @param {HTMLElement} el1 
     * @param {HTMLElement} el2 
     * @returns {number} Class overlap ratio (0-1)
     */
    _compareClasses(el1, el2) {
        const classes1 = this._getStaticClasses(el1);
        const classes2 = this._getStaticClasses(el2);

        if (classes1.size === 0 && classes2.size === 0) {
            return 1; // Both have no classes = match
        }

        const intersection = new Set([...classes1].filter(c => classes2.has(c)));
        const union = new Set([...classes1, ...classes2]);

        if (union.size === 0) return 1;

        return intersection.size / union.size;
    }

    /**
     * Get static (non-dynamic) classes from an element
     * 
     * @private
     * @param {HTMLElement} el 
     * @returns {Set<string>}
     */
    _getStaticClasses(el) {
        const classes = new Set();

        for (const cls of el.classList) {
            const isDynamic = DYNAMIC_CLASS_PATTERNS.some(pattern => pattern.test(cls));
            if (!isDynamic) {
                classes.add(cls);
            }
        }

        return classes;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ATTRIBUTE COMPARISON
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Compare attribute keys (not values) between elements
     * 
     * @private
     * @param {HTMLElement} el1 
     * @param {HTMLElement} el2 
     * @returns {number} Similarity score (0-100)
     */
    _compareAttributeKeys(el1, el2) {
        const attrs1 = this._getAttributeKeys(el1);
        const attrs2 = this._getAttributeKeys(el2);

        if (attrs1.size === 0 && attrs2.size === 0) {
            return 100;
        }

        const intersection = new Set([...attrs1].filter(a => attrs2.has(a)));
        const union = new Set([...attrs1, ...attrs2]);

        if (union.size === 0) return 100;

        return Math.round((intersection.size / union.size) * 100);
    }

    /**
     * Get attribute keys from element (excluding class, id, style)
     * 
     * @private
     * @param {HTMLElement} el 
     * @returns {Set<string>}
     */
    _getAttributeKeys(el) {
        const ignoredAttrs = new Set(['class', 'id', 'style']);
        const keys = new Set();

        for (const attr of el.attributes) {
            if (!ignoredAttrs.has(attr.name)) {
                // For data-* attributes, keep the key pattern
                if (attr.name.startsWith('data-')) {
                    // Normalize data-id-123 to data-id-*
                    const normalized = attr.name.replace(/-\d+$/, '-*');
                    keys.add(normalized);
                } else {
                    keys.add(attr.name);
                }
            }
        }

        return keys;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // UTILITIES
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Calculate average similarity within a group
     * 
     * @private
     * @param {Array<HTMLElement>} group 
     * @returns {number}
     */
    _calculateGroupSimilarity(group) {
        if (group.length < 2) return 100;

        const template = group[0];
        let totalSimilarity = 0;

        for (let i = 1; i < group.length; i++) {
            totalSimilarity += this.calculateSimilarity(group[i], template);
        }

        return Math.round(totalSimilarity / (group.length - 1));
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// STANDALONE FUNCTIONS (for testing and direct usage)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calculate similarity between two elements
 * Standalone function for direct usage
 * 
 * @param {HTMLElement} el1 
 * @param {HTMLElement} el2 
 * @param {Object} [options] 
 * @returns {number}
 */
export function calculateSimilarity(el1, el2, options = {}) {
    const recognizer = new PatternRecognizer(options);
    return recognizer.calculateSimilarity(el1, el2);
}

/**
 * Find repeating patterns in a parent element
 * Standalone function for direct usage
 * 
 * @param {HTMLElement} parent 
 * @param {Object} [options] 
 * @returns {Array<Pattern>}
 */
export function findRepeatingPatterns(parent, options = {}) {
    const recognizer = new PatternRecognizer(options);
    return recognizer.findRepeatingPatterns(parent);
}

// Default export
export default PatternRecognizer;
