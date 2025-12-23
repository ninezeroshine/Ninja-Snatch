/**
 * Style Normalizer - Converts computed styles to Tailwind classes
 * 
 * Uses getComputedStyle() to extract final rendered values and
 * maps them to the nearest Tailwind utility classes.
 * 
 * @module smartExtract/styleNormalizer
 * @version 1.0.0
 */

import {
    SPACING_SCALE,
    FONT_SIZE_SCALE,
    FONT_WEIGHT_SCALE,
    LINE_HEIGHT_SCALE,
    BORDER_RADIUS_SCALE,
    findNearestInScale,
    findNearestColor,
} from './tailwindMap.js';

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Property prefixes for Tailwind classes
 */
const PROPERTY_PREFIX = {
    marginTop: 'mt',
    marginRight: 'mr',
    marginBottom: 'mb',
    marginLeft: 'ml',
    paddingTop: 'pt',
    paddingRight: 'pr',
    paddingBottom: 'pb',
    paddingLeft: 'pl',
    gap: 'gap',
    rowGap: 'gap-y',
    columnGap: 'gap-x',
    width: 'w',
    height: 'h',
    minWidth: 'min-w',
    minHeight: 'min-h',
    maxWidth: 'max-w',
    maxHeight: 'max-h',
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN CLASS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * StyleNormalizer - Extracts and normalizes CSS to Tailwind
 * 
 * @example
 * const normalizer = new StyleNormalizer();
 * const result = normalizer.extractStyles(element);
 * console.log(result.className); // "flex gap-4 p-4 bg-white rounded-lg"
 */
export class StyleNormalizer {
    /**
     * @param {Object} options
     * @param {string} [options.mode='loose'] - 'loose' rounds to nearest, 'strict' uses arbitrary values
     */
    constructor(options = {}) {
        this.options = {
            mode: options.mode || 'loose'
        };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PUBLIC API
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Normalize an element tree with pattern information
     * 
     * @param {HTMLElement} element - Root element
     * @param {Array} patterns - Detected patterns from PatternRecognizer
     * @param {Object} frameworkInfo - Framework detection info
     * @returns {Object} Normalized tree with Tailwind classes
     */
    normalize(element, patterns = [], frameworkInfo = null) {
        const result = this._normalizeNode(element);
        result.patterns = patterns;
        result.framework = frameworkInfo;
        result.totalClasses = this._countClasses(result);
        return result;
    }

    /**
     * Extract Tailwind classes for a single element
     * 
     * @param {HTMLElement} element
     * @returns {Object} { className, styles, details }
     */
    extractStyles(element) {
        if (!(element instanceof HTMLElement)) {
            throw new Error('StyleNormalizer: element must be an HTMLElement');
        }

        const styles = getComputedStyle(element);
        const classes = [];
        const details = {};

        // Display & Layout
        this._extractDisplay(styles, classes, details);
        this._extractFlexbox(styles, classes, details);
        this._extractGrid(styles, classes, details);

        // Spacing
        this._extractSpacing(styles, classes, details);

        // Sizing
        this._extractSizing(styles, classes, details);

        // Typography
        this._extractTypography(styles, classes, details);

        // Colors
        this._extractColors(styles, classes, details);

        // Borders
        this._extractBorders(styles, classes, details);

        // Effects
        this._extractEffects(styles, classes, details);

        // Position
        this._extractPosition(styles, classes, details);

        return {
            className: classes.join(' '),
            classes,
            details
        };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // DISPLAY & LAYOUT
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * @private
     */
    _extractDisplay(styles, classes, details) {
        const display = styles.display;

        const displayMap = {
            'block': 'block',
            'inline-block': 'inline-block',
            'inline': 'inline',
            'flex': 'flex',
            'inline-flex': 'inline-flex',
            'grid': 'grid',
            'inline-grid': 'inline-grid',
            'none': 'hidden',
        };

        if (displayMap[display]) {
            classes.push(displayMap[display]);
            details.display = displayMap[display];
        }
    }

    /**
     * @private
     */
    _extractFlexbox(styles, classes, details) {
        if (styles.display !== 'flex' && styles.display !== 'inline-flex') return;

        // Flex direction
        if (styles.flexDirection === 'column') {
            classes.push('flex-col');
            details.flexDirection = 'flex-col';
        } else if (styles.flexDirection === 'row-reverse') {
            classes.push('flex-row-reverse');
        } else if (styles.flexDirection === 'column-reverse') {
            classes.push('flex-col-reverse');
        }

        // Flex wrap
        if (styles.flexWrap === 'wrap') {
            classes.push('flex-wrap');
        } else if (styles.flexWrap === 'wrap-reverse') {
            classes.push('flex-wrap-reverse');
        }

        // Justify content
        const justifyMap = {
            'flex-start': 'justify-start',
            'flex-end': 'justify-end',
            'center': 'justify-center',
            'space-between': 'justify-between',
            'space-around': 'justify-around',
            'space-evenly': 'justify-evenly',
        };
        if (justifyMap[styles.justifyContent]) {
            classes.push(justifyMap[styles.justifyContent]);
        }

        // Align items
        const alignMap = {
            'flex-start': 'items-start',
            'flex-end': 'items-end',
            'center': 'items-center',
            'baseline': 'items-baseline',
            'stretch': 'items-stretch',
        };
        if (alignMap[styles.alignItems]) {
            classes.push(alignMap[styles.alignItems]);
        }

        // Gap
        this._extractGap(styles, classes, details);
    }

    /**
     * @private
     */
    _extractGrid(styles, classes, details) {
        if (styles.display !== 'grid' && styles.display !== 'inline-grid') return;

        // Grid template columns (simple cases)
        const cols = styles.gridTemplateColumns;
        if (cols && cols !== 'none') {
            const colCount = cols.split(' ').filter(c => c && c !== 'none').length;
            if (colCount >= 1 && colCount <= 12) {
                classes.push(`grid-cols-${colCount}`);
                details.gridCols = colCount;
            }
        }

        // Gap
        this._extractGap(styles, classes, details);
    }

    /**
     * @private
     */
    _extractGap(styles, classes, details) {
        const gap = parseInt(styles.gap);
        if (!isNaN(gap) && gap > 0) {
            const gapClass = findNearestInScale(gap, SPACING_SCALE);
            classes.push(`gap-${gapClass}`);
            details.gap = gapClass;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SPACING
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * @private
     */
    _extractSpacing(styles, classes, details) {
        // Margin
        this._extractSpacingProperty(styles, 'marginTop', 'mt', classes, details);
        this._extractSpacingProperty(styles, 'marginRight', 'mr', classes, details);
        this._extractSpacingProperty(styles, 'marginBottom', 'mb', classes, details);
        this._extractSpacingProperty(styles, 'marginLeft', 'ml', classes, details);

        // Padding
        this._extractSpacingProperty(styles, 'paddingTop', 'pt', classes, details);
        this._extractSpacingProperty(styles, 'paddingRight', 'pr', classes, details);
        this._extractSpacingProperty(styles, 'paddingBottom', 'pb', classes, details);
        this._extractSpacingProperty(styles, 'paddingLeft', 'pl', classes, details);
    }

    /**
     * @private
     */
    _extractSpacingProperty(styles, prop, prefix, classes, details) {
        const value = parseInt(styles[prop]);
        if (isNaN(value) || value === 0) return;

        if (this.options.mode === 'strict') {
            // Strict mode: use arbitrary values for non-standard sizes
            const spacingKeys = Object.keys(SPACING_SCALE).map(Number);
            if (!spacingKeys.includes(value)) {
                classes.push(`${prefix}-[${value}px]`);
                details[prop] = `[${value}px]`;
                return;
            }
        }

        // Loose mode: round to nearest
        const tailwindValue = findNearestInScale(value, SPACING_SCALE);
        classes.push(`${prefix}-${tailwindValue}`);
        details[prop] = tailwindValue;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SIZING
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * @private
     */
    _extractSizing(styles, classes, details) {
        // Width (special handling for common values)
        const width = styles.width;
        if (width === '100%') {
            classes.push('w-full');
        } else if (width === 'auto') {
            classes.push('w-auto');
        } else if (width === 'fit-content') {
            classes.push('w-fit');
        } else if (width === 'max-content') {
            classes.push('w-max');
        } else if (width === 'min-content') {
            classes.push('w-min');
        }

        // Height
        const height = styles.height;
        if (height === '100%') {
            classes.push('h-full');
        } else if (height === 'auto') {
            classes.push('h-auto');
        } else if (height === '100vh') {
            classes.push('h-screen');
        } else if (height === 'fit-content') {
            classes.push('h-fit');
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // TYPOGRAPHY
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * @private
     */
    _extractTypography(styles, classes, details) {
        // Font size
        const fontSize = parseInt(styles.fontSize);
        if (!isNaN(fontSize)) {
            const sizeClass = findNearestInScale(fontSize, FONT_SIZE_SCALE);
            if (sizeClass) {
                classes.push(sizeClass);
                details.fontSize = sizeClass;
            }
        }

        // Font weight
        const fontWeight = parseInt(styles.fontWeight);
        if (!isNaN(fontWeight) && FONT_WEIGHT_SCALE[fontWeight]) {
            classes.push(FONT_WEIGHT_SCALE[fontWeight]);
            details.fontWeight = FONT_WEIGHT_SCALE[fontWeight];
        }

        // Text align
        const textAlignMap = {
            'left': 'text-left',
            'center': 'text-center',
            'right': 'text-right',
            'justify': 'text-justify',
        };
        if (textAlignMap[styles.textAlign]) {
            classes.push(textAlignMap[styles.textAlign]);
        }

        // Line height
        const lineHeight = parseFloat(styles.lineHeight) / parseFloat(styles.fontSize);
        if (!isNaN(lineHeight)) {
            const lhClass = findNearestInScale(lineHeight, LINE_HEIGHT_SCALE);
            if (lhClass) {
                classes.push(lhClass);
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // COLORS
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * @private
     */
    _extractColors(styles, classes, details) {
        // Text color
        const textColor = findNearestColor(styles.color);
        if (textColor && textColor !== 'black') {
            classes.push(`text-${textColor}`);
            details.textColor = textColor;
        }

        // Background color
        const bgColor = findNearestColor(styles.backgroundColor);
        if (bgColor && bgColor !== 'transparent') {
            classes.push(`bg-${bgColor}`);
            details.bgColor = bgColor;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // BORDERS
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * @private
     */
    _extractBorders(styles, classes, details) {
        // Border radius
        const borderRadius = parseInt(styles.borderRadius);
        if (!isNaN(borderRadius) && borderRadius > 0) {
            const radiusClass = findNearestInScale(borderRadius, BORDER_RADIUS_SCALE);
            classes.push(radiusClass);
            details.borderRadius = radiusClass;
        }

        // Border width
        const borderWidth = parseInt(styles.borderWidth);
        if (!isNaN(borderWidth) && borderWidth > 0) {
            if (borderWidth === 1) {
                classes.push('border');
            } else if (borderWidth === 2) {
                classes.push('border-2');
            } else if (borderWidth === 4) {
                classes.push('border-4');
            } else if (borderWidth === 8) {
                classes.push('border-8');
            }
        }

        // Border color
        const borderColor = findNearestColor(styles.borderColor);
        if (borderColor && borderColor !== 'transparent') {
            classes.push(`border-${borderColor}`);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // EFFECTS
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * @private
     */
    _extractEffects(styles, classes, details) {
        // Opacity
        const opacity = parseFloat(styles.opacity);
        if (!isNaN(opacity) && opacity < 1) {
            const opacityPercent = Math.round(opacity * 100);
            const opacityValues = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95];
            const nearest = opacityValues.reduce((a, b) =>
                Math.abs(b - opacityPercent) < Math.abs(a - opacityPercent) ? b : a
            );
            classes.push(`opacity-${nearest}`);
        }

        // Box shadow (basic detection)
        if (styles.boxShadow && styles.boxShadow !== 'none') {
            classes.push('shadow');
            details.hasShadow = true;
        }

        // Overflow
        if (styles.overflow === 'hidden') {
            classes.push('overflow-hidden');
        } else if (styles.overflow === 'auto') {
            classes.push('overflow-auto');
        } else if (styles.overflow === 'scroll') {
            classes.push('overflow-scroll');
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // POSITION
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * @private
     */
    _extractPosition(styles, classes, details) {
        const positionMap = {
            'static': null, // default, don't add class
            'relative': 'relative',
            'absolute': 'absolute',
            'fixed': 'fixed',
            'sticky': 'sticky',
        };

        if (positionMap[styles.position]) {
            classes.push(positionMap[styles.position]);
            details.position = positionMap[styles.position];
        }

        // Z-index
        const zIndex = parseInt(styles.zIndex);
        if (!isNaN(zIndex) && zIndex !== 0) {
            const zValues = [0, 10, 20, 30, 40, 50];
            const nearest = zValues.reduce((a, b) =>
                Math.abs(b - zIndex) < Math.abs(a - zIndex) ? b : a
            );
            if (nearest > 0) {
                classes.push(`z-${nearest}`);
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // UTILITIES
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Recursively normalize a node and its children
     * @private
     */
    _normalizeNode(element) {
        const extracted = this.extractStyles(element);

        const node = {
            tagName: element.tagName.toLowerCase(),
            className: extracted.className,
            classes: extracted.classes,
            details: extracted.details,
            attributes: this._getRelevantAttributes(element),
            textContent: this._getDirectTextContent(element),
            children: []
        };

        for (const child of element.children) {
            node.children.push(this._normalizeNode(child));
        }

        return node;
    }

    /**
     * Get relevant attributes (excluding class, style)
     * @private
     */
    _getRelevantAttributes(element) {
        const attrs = {};
        for (const attr of element.attributes) {
            if (!['class', 'style', 'id'].includes(attr.name)) {
                attrs[attr.name] = attr.value;
            }
        }
        return attrs;
    }

    /**
     * Get direct text content (not from children)
     * @private
     */
    _getDirectTextContent(element) {
        let text = '';
        for (const node of element.childNodes) {
            if (node.nodeType === Node.TEXT_NODE) {
                text += node.textContent.trim();
            }
        }
        return text || null;
    }

    /**
     * Count total classes in normalized tree
     * @private
     */
    _countClasses(node) {
        let count = node.classes ? node.classes.length : 0;
        for (const child of (node.children || [])) {
            count += this._countClasses(child);
        }
        return count;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// STANDALONE FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Extract Tailwind classes for a single element
 * Standalone function for direct usage
 * 
 * @param {HTMLElement} element 
 * @param {Object} options 
 * @returns {Object}
 */
export function extractStyles(element, options = {}) {
    const normalizer = new StyleNormalizer(options);
    return normalizer.extractStyles(element);
}

// Default export
export default StyleNormalizer;
