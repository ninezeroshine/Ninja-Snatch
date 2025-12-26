/**
 * Style Extractor Module
 *
 * Extracts computed CSS styles from DOM elements to create
 * self-contained HTML that looks identical to the original.
 *
 * Uses getComputedStyle to capture the actual rendered styles,
 * not just inline styles or class definitions.
 *
 * @module StyleExtractor
 */

// CSS properties we want to capture (most visually important ones)
const VISUAL_CSS_PROPERTIES = [
    // Layout
    'display',
    'position',
    'top',
    'right',
    'bottom',
    'left',
    'float',
    'clear',
    'z-index',
    'flex-direction',
    'flex-wrap',
    'flex-grow',
    'flex-shrink',
    'flex-basis',
    'justify-content',
    'align-items',
    'align-content',
    'align-self',
    'order',
    'gap',
    'grid-template-columns',
    'grid-template-rows',
    'grid-column',
    'grid-row',
    'grid-gap',

    // Box Model
    'width',
    'height',
    'min-width',
    'min-height',
    'max-width',
    'max-height',
    'margin',
    'margin-top',
    'margin-right',
    'margin-bottom',
    'margin-left',
    'padding',
    'padding-top',
    'padding-right',
    'padding-bottom',
    'padding-left',
    'box-sizing',

    // Border
    'border',
    'border-width',
    'border-style',
    'border-color',
    'border-top',
    'border-right',
    'border-bottom',
    'border-left',
    'border-radius',
    'border-top-left-radius',
    'border-top-right-radius',
    'border-bottom-right-radius',
    'border-bottom-left-radius',

    // Background
    'background',
    'background-color',
    'background-image',
    'background-position',
    'background-size',
    'background-repeat',
    'background-attachment',
    'background-clip',

    // Typography
    'font-family',
    'font-size',
    'font-weight',
    'font-style',
    'font-variant',
    'line-height',
    'letter-spacing',
    'word-spacing',
    'text-align',
    'text-decoration',
    'text-transform',
    'text-indent',
    'text-shadow',
    'white-space',
    'word-break',
    'word-wrap',
    'overflow-wrap',

    // Color
    'color',
    'opacity',

    // Gradient Text (webkit prefixed properties)
    '-webkit-background-clip',
    '-webkit-text-fill-color',
    '-webkit-text-stroke',
    '-webkit-text-stroke-width',
    '-webkit-text-stroke-color',

    // Visual Effects
    'box-shadow',
    'filter',
    'backdrop-filter',
    'transform',
    'transform-origin',
    'transition',
    'animation',

    // Overflow
    'overflow',
    'overflow-x',
    'overflow-y',

    // List
    'list-style',
    'list-style-type',
    'list-style-position',
    'list-style-image',

    // Table
    'border-collapse',
    'border-spacing',
    'table-layout',

    // Visibility
    'visibility',
    'clip',
    'clip-path',

    // Cursor
    'cursor',
    'pointer-events',

    // SVG Properties
    'fill',
    'stroke',
    'stroke-width',
    'stroke-linecap',
    'stroke-linejoin',
    'stroke-dasharray',
    'stroke-dashoffset',

    // Masks (often used for icons)
    'mask-image',
    '-webkit-mask-image',
    'mask-size',
    'mask-position',
    'mask-repeat',

    // Modern Layout
    'aspect-ratio',
    'object-fit',
    'object-position',
    'place-items',
    'place-content',
    'place-self',

    // Appearance
    'appearance',
    '-webkit-appearance',

    // Text Overflow
    'text-overflow',
    '-webkit-line-clamp',
    '-webkit-box-orient',

    // Scroll
    'scroll-behavior',
    'scroll-snap-type',
    'scroll-snap-align',
];

// Default values to filter out (browser defaults)
const DEFAULT_VALUES: Record<string, string[]> = {
    display: ['inline'],
    position: ['static'],
    float: ['none'],
    clear: ['none'],
    visibility: ['visible'],
    opacity: ['1'],
    overflow: ['visible'],
    'overflow-x': ['visible'],
    'overflow-y': ['visible'],
    cursor: ['auto'],
    'pointer-events': ['auto'],
    'z-index': ['auto'],
    'text-decoration': ['none solid rgb(0, 0, 0)', 'none'],
    'text-transform': ['none'],
    'text-shadow': ['none'],
    'box-shadow': ['none'],
    filter: ['none'],
    'backdrop-filter': ['none'],
    transform: ['none'],
    transition: ['all 0s ease 0s', 'none'],
    animation: ['none 0s ease 0s 1 normal none running', 'none'],
    'background-image': ['none'],
    'border-style': ['none'],
};

/**
 * Extract styles for all elements in a tree and generate CSS
 */
export function extractStyles(root: HTMLElement): string {
    const styleMap = new Map<string, string>();
    let classCounter = 0;

    // Clone the element to add classes without affecting original
    const clone = root.cloneNode(true) as HTMLElement;

    // Process all elements
    processElement(root, clone, styleMap, () => `ns-${classCounter++}`);

    // Generate CSS string
    const cssRules: string[] = [];

    // Add reset/base styles
    cssRules.push(`
/* Ninja Snatch Export Styles */
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
`);

    // Add extracted styles
    for (const [className, styles] of styleMap) {
        cssRules.push(`.${className} {\n${styles}\n}`);
    }

    return cssRules.join('\n\n');
}

/**
 * Process a single element and its children
 */
function processElement(
    original: Element,
    clone: Element,
    styleMap: Map<string, string>,
    generateClassName: () => string
): void {
    if (!(original instanceof HTMLElement) || !(clone instanceof HTMLElement)) {
        return;
    }

    // Get computed styles
    const computed = window.getComputedStyle(original);
    const styles = extractRelevantStyles(computed);

    if (styles) {
        const className = generateClassName();
        styleMap.set(className, styles);

        // Add class to clone
        clone.classList.add(className);
    }

    // Process children
    const originalChildren = Array.from(original.children);
    const cloneChildren = Array.from(clone.children);

    for (let i = 0; i < originalChildren.length; i++) {
        if (originalChildren[i] && cloneChildren[i]) {
            processElement(
                originalChildren[i],
                cloneChildren[i],
                styleMap,
                generateClassName
            );
        }
    }
}

/**
 * Extract only relevant (non-default) styles from computed style
 */
function extractRelevantStyles(computed: CSSStyleDeclaration): string | null {
    const rules: string[] = [];

    for (const prop of VISUAL_CSS_PROPERTIES) {
        const value = computed.getPropertyValue(prop);

        if (!value || value === '') continue;

        // Skip default values
        const defaults = DEFAULT_VALUES[prop];
        if (defaults && defaults.includes(value)) continue;

        // Skip 'auto' for most properties
        if (value === 'auto' && !['width', 'height', 'margin'].some((p) => prop.includes(p))) {
            continue;
        }

        // Skip '0px' margins/paddings (unless it's explicitly needed)
        if (['margin', 'padding'].some((p) => prop.startsWith(p))) {
            if (value === '0px' || value === '0') continue;
        }

        rules.push(`  ${prop}: ${value};`);
    }

    return rules.length > 0 ? rules.join('\n') : null;
}

/**
 * Options for getStyledHtml
 */
interface StyledHtmlOptions {
    /** CSS selector to exclude elements from capture */
    excludeSelector?: string;
}

/**
 * Get the modified HTML with added classes
 */
export function getStyledHtml(
    root: HTMLElement,
    options: StyledHtmlOptions = {}
): {
    html: string;
    css: string;
} {
    const { excludeSelector } = options;
    const styleMap = new Map<string, string>();
    let classCounter = 0;

    // Clone the element
    const clone = root.cloneNode(true) as HTMLElement;

    // Remove excluded elements from clone
    if (excludeSelector) {
        const toRemove = clone.querySelectorAll(excludeSelector);
        toRemove.forEach((el) => el.remove());
    }

    // Generate class name function
    const generateClassName = () => `ns-${classCounter++}`;

    // Process root element
    processElementStyles(root, clone, styleMap, generateClassName);

    // Process all child elements
    // Note: We traverse the original tree, but only if the element exists in clone
    function processNode(original: Element, cloned: Element): void {
        if (!(original instanceof HTMLElement) || !(cloned instanceof HTMLElement)) {
            return;
        }

        // Skip elements that match exclude selector
        if (excludeSelector && original.matches(excludeSelector)) {
            return;
        }

        // Get computed styles
        const computed = window.getComputedStyle(original);
        const styles = extractRelevantStyles(computed);

        if (styles) {
            const className = generateClassName();
            styleMap.set(className, styles);
            cloned.classList.add(className);
        }

        // Process children - match by index carefully
        const origChildren = Array.from(original.children);
        const cloneChildren = Array.from(cloned.children);

        // Filter out excluded elements from original children
        const validOrigChildren = excludeSelector
            ? origChildren.filter((c) => !c.matches(excludeSelector))
            : origChildren;

        for (let i = 0; i < validOrigChildren.length && i < cloneChildren.length; i++) {
            processNode(validOrigChildren[i], cloneChildren[i]);
        }
    }

    processNode(root, clone);

    // Generate CSS
    const cssRules: string[] = [
        '/* Ninja Snatch Export - Auto-generated styles */',
        '* { box-sizing: border-box; margin: 0; padding: 0; }',
        'a { text-decoration: inherit; color: inherit; }',
        'img, video { max-width: 100%; height: auto; }',
        'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }',
    ];

    for (const [className, styles] of styleMap) {
        cssRules.push(`.${className} {\n${styles}\n}`);
    }

    return {
        html: clone.outerHTML,
        css: cssRules.join('\n\n'),
    };
}

/**
 * Helper function to process a single element's styles
 */
function processElementStyles(
    original: HTMLElement,
    cloned: HTMLElement,
    styleMap: Map<string, string>,
    generateClassName: () => string
): void {
    const computed = window.getComputedStyle(original);
    const styles = extractRelevantStyles(computed);

    if (styles) {
        const className = generateClassName();
        styleMap.set(className, styles);
        cloned.classList.add(className);
    }
}
