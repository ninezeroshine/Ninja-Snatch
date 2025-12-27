/**
 * Style Hydrator Module
 *
 * Extracts computed CSS styles from DOM elements and injects
 * `data-truth` attributes for AI-readable, deterministic output.
 *
 * Key Features:
 * - Traverses DOM tree efficiently using TreeWalker
 * - Filters browser default values
 * - Normalizes colors to hex format
 * - Generates compact shorthand notation
 *
 * @module StyleHydrator
 */

import { TRUTH_PROPERTIES, DEFAULT_VALUES, NORMALIZE_PROPERTIES } from '../constants/cssProperties';
import { normalizeColor, formatColor } from '../utils/colorNormalizer';
import { mapToTailwind } from '../utils/tailwindMapper';

// ============================================================================
// Types
// ============================================================================

/**
 * Options for hydration process
 */
export interface HydrationOptions {
    /** Include Tailwind class hints in output (default: false) */
    includeTailwindHint?: boolean;
    /** Skip browser default values (default: true) */
    skipDefaults?: boolean;
    /** Maximum depth of tree traversal (default: unlimited) */
    maxDepth?: number;
    /** Skip elements matching this selector */
    excludeSelector?: string;
    /** Attribute name for truth data (default: 'data-truth') */
    attributeName?: string;
}

/**
 * Result of hydration operation
 */
export interface HydrationResult {
    /** Number of elements processed */
    processedCount: number;
    /** Number of elements with data-truth added */
    hydratedCount: number;
    /** Number of elements skipped (defaults only or excluded) */
    skippedCount: number;
}

// ============================================================================
// Default Values Filter
// ============================================================================

/**
 * Extended default values that should be filtered out
 * These are browser defaults that don't convey design intent
 */
const EXTENDED_DEFAULTS: Record<string, (value: string) => boolean> = {
    // Box model defaults
    width: (v) => v === 'auto',
    height: (v) => v === 'auto',
    minWidth: (v) => v === '0px' || v === 'auto',
    minHeight: (v) => v === '0px' || v === 'auto',
    maxWidth: (v) => v === 'none',
    maxHeight: (v) => v === 'none',

    // Spacing defaults
    padding: (v) => v === '0px',
    paddingTop: (v) => v === '0px',
    paddingRight: (v) => v === '0px',
    paddingBottom: (v) => v === '0px',
    paddingLeft: (v) => v === '0px',
    margin: (v) => v === '0px',
    marginTop: (v) => v === '0px',
    marginRight: (v) => v === '0px',
    marginBottom: (v) => v === '0px',
    marginLeft: (v) => v === '0px',
    gap: (v) => v === 'normal' || v === '0px',
    rowGap: (v) => v === 'normal' || v === '0px',
    columnGap: (v) => v === 'normal' || v === '0px',

    // Position defaults
    top: (v) => v === 'auto',
    right: (v) => v === 'auto',
    bottom: (v) => v === 'auto',
    left: (v) => v === 'auto',
    zIndex: (v) => v === 'auto',

    // Flex defaults
    flexDirection: (v) => v === 'row',
    flexWrap: (v) => v === 'nowrap',
    flexGrow: (v) => v === '0',
    flexShrink: (v) => v === '1',
    justifyContent: (v) => v === 'normal' || v === 'flex-start',
    alignItems: (v) => v === 'normal' || v === 'stretch',
    alignContent: (v) => v === 'normal',

    // Grid defaults
    gridTemplateColumns: (v) => v === 'none',
    gridTemplateRows: (v) => v === 'none',
    gridColumn: (v) => v === 'auto',
    gridRow: (v) => v === 'auto',

    // Decoration defaults
    background: (v) => v === 'none' || v.startsWith('rgba(0, 0, 0, 0)'),
    backgroundColor: (v) => v === 'rgba(0, 0, 0, 0)' || v === 'transparent',
    backgroundImage: (v) => v === 'none',
    backgroundSize: (v) => v === 'auto',
    backgroundPosition: (v) => v === '0% 0%' || v === '0px 0px',
    borderRadius: (v) => v === '0px',
    borderTopLeftRadius: (v) => v === '0px',
    borderTopRightRadius: (v) => v === '0px',
    borderBottomRightRadius: (v) => v === '0px',
    borderBottomLeftRadius: (v) => v === '0px',
    boxShadow: (v) => v === 'none',
    border: (v) => v === 'none' || v === '0px none rgb(0, 0, 0)',
    borderWidth: (v) => v === '0px',
    borderColor: (v) => v === 'rgb(0, 0, 0)',
    borderStyle: (v) => v === 'none',

    // Typography defaults
    fontFamily: () => false, // Always include font-family if not system
    fontSize: (v) => v === '16px', // Browser default
    fontWeight: (v) => v === '400' || v === 'normal',
    lineHeight: (v) => v === 'normal',
    letterSpacing: (v) => v === 'normal',
    textAlign: (v) => v === 'start' || v === 'left',
    textDecoration: (v) => v === 'none' || v.includes('none'),
    textTransform: (v) => v === 'none',
    whiteSpace: (v) => v === 'normal',
    wordBreak: (v) => v === 'normal',
    color: () => false, // Always include color

    // Transform & Effects
    transform: (v) => v === 'none',
    transformOrigin: (v) => v === '50% 50%' || v === '50% 50% 0px',
    filter: (v) => v === 'none',
    backdropFilter: (v) => v === 'none',
    transition: (v) => v === 'none' || v.includes('all 0s'),

    // Visibility
    overflow: (v) => v === 'visible',
    overflowX: (v) => v === 'visible',
    overflowY: (v) => v === 'visible',
    cursor: (v) => v === 'auto',
};

/**
 * Check if a CSS value is a default browser value
 */
export function isDefaultValue(property: string, value: string): boolean {
    // Check constant defaults first
    const constantDefaults = DEFAULT_VALUES[property];
    if (constantDefaults?.includes(value)) {
        return true;
    }

    // Check extended defaults with functions
    const extendedCheck = EXTENDED_DEFAULTS[property];
    if (extendedCheck) {
        return extendedCheck(value);
    }

    return false;
}

// ============================================================================
// Value Normalization
// ============================================================================

/**
 * Normalize a CSS value for consistent output
 */
function normalizeValue(property: string, value: string): string {
    // Normalize colors
    if (NORMALIZE_PROPERTIES.includes(property as typeof NORMALIZE_PROPERTIES[number])) {
        const normalized = normalizeColor(value);
        return formatColor(normalized);
    }

    // Normalize box-shadow and other properties containing colors
    if (property === 'boxShadow' && value !== 'none') {
        // Replace RGB colors in box-shadow with hex
        return value.replace(/rgba?\([^)]+\)/g, (match) => {
            const normalized = normalizeColor(match);
            return formatColor(normalized);
        });
    }

    // Clean up font-family (remove unnecessary quotes and fallbacks for brevity)
    if (property === 'fontFamily') {
        const fonts = value.split(',').map((f) => f.trim().replace(/['"]/g, ''));
        // Return first non-generic font if available
        const primary = fonts.find(
            (f) =>
                !['sans-serif', 'serif', 'monospace', 'cursive', 'fantasy', 'system-ui'].includes(
                    f.toLowerCase()
                )
        );
        return primary ? `'${primary}'` : fonts[0] || value;
    }

    return value;
}

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Generate data-truth string for a single element
 *
 * @param element - DOM element to extract styles from
 * @param options - Hydration options
 * @returns Compact truth string or null if no relevant styles
 */
export function getTruthString(
    element: Element,
    options: HydrationOptions = {}
): string | null {
    const { skipDefaults = true, includeTailwindHint = false } = options;

    const computed = window.getComputedStyle(element);
    const truthParts: string[] = [];

    for (const [cssProperty, shorthand] of Object.entries(TRUTH_PROPERTIES)) {
        // Convert camelCase to kebab-case for getPropertyValue
        const kebabProperty = cssProperty.replace(/([A-Z])/g, '-$1').toLowerCase();
        let value = computed.getPropertyValue(kebabProperty);

        // Fallback: try direct property access
        if (!value) {
            value = computed[cssProperty as keyof CSSStyleDeclaration] as string;
        }

        if (!value) continue;

        // Skip default values if option enabled
        if (skipDefaults && isDefaultValue(cssProperty, value)) {
            continue;
        }

        // Normalize the value
        const normalizedValue = normalizeValue(cssProperty, value);

        // Build the truth part
        if (includeTailwindHint) {
            const tailwindValue = mapToTailwind(cssProperty, value);
            truthParts.push(`${shorthand}:${normalizedValue}|${tailwindValue}`);
        } else {
            truthParts.push(`${shorthand}:${normalizedValue}`);
        }
    }

    // Handle gradient text special case
    const webkitBgClip = computed.getPropertyValue('-webkit-background-clip');
    if (webkitBgClip === 'text') {
        const bgImage = computed.getPropertyValue('background-image');
        if (bgImage && bgImage !== 'none') {
            truthParts.push(`gradientText:${bgImage}`);
        }
    }

    return truthParts.length > 0 ? truthParts.join('; ') : null;
}

/**
 * Inject data-truth attribute into a single element
 *
 * @param element - DOM element to hydrate
 * @param options - Hydration options
 * @returns true if data-truth was added, false if skipped
 */
export function hydrateElement(
    element: Element,
    options: HydrationOptions = {}
): boolean {
    const { attributeName = 'data-truth', excludeSelector } = options;

    // Skip excluded elements
    if (excludeSelector && element.matches(excludeSelector)) {
        return false;
    }

    // Skip script, style, and other non-visual elements
    const tagName = element.tagName.toLowerCase();
    if (['script', 'style', 'link', 'meta', 'noscript', 'template'].includes(tagName)) {
        return false;
    }

    // Skip SVG internals (only process top-level SVG)
    if (element.parentElement?.closest('svg') && tagName !== 'svg') {
        return false;
    }

    const truthString = getTruthString(element, options);

    if (truthString) {
        element.setAttribute(attributeName, truthString);
        return true;
    }

    return false;
}

/**
 * Traverse DOM tree and inject data-truth attributes
 *
 * @param root - Root element to start traversal from
 * @param options - Hydration options
 * @returns Hydration result statistics
 */
export function hydrateTree(
    root: Element,
    options: HydrationOptions = {}
): HydrationResult {
    const { maxDepth, excludeSelector } = options;

    const result: HydrationResult = {
        processedCount: 0,
        hydratedCount: 0,
        skippedCount: 0,
    };

    // Process the root element itself
    result.processedCount++;
    if (hydrateElement(root, options)) {
        result.hydratedCount++;
    } else {
        result.skippedCount++;
    }

    // Use TreeWalker for efficient traversal
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, {
        acceptNode: (node: Node): number => {
            const el = node as Element;

            // Skip excluded elements and their children
            if (excludeSelector && el.matches(excludeSelector)) {
                return NodeFilter.FILTER_REJECT;
            }

            // Skip non-visual elements
            const tagName = el.tagName.toLowerCase();
            if (['script', 'style', 'link', 'meta', 'noscript', 'template'].includes(tagName)) {
                return NodeFilter.FILTER_REJECT;
            }

            // Check depth limit
            if (maxDepth !== undefined) {
                let depth = 0;
                let parent: Node | null = el.parentNode;
                while (parent && parent !== root) {
                    depth++;
                    parent = parent.parentNode;
                }
                if (depth > maxDepth) {
                    return NodeFilter.FILTER_REJECT;
                }
            }

            return NodeFilter.FILTER_ACCEPT;
        },
    });

    // Traverse all matching elements
    let currentNode = walker.nextNode();
    while (currentNode) {
        result.processedCount++;
        if (hydrateElement(currentNode as Element, options)) {
            result.hydratedCount++;
        } else {
            result.skippedCount++;
        }
        currentNode = walker.nextNode();
    }

    return result;
}

/**
 * Remove data-truth attributes from all elements in tree
 * Useful for cleanup before re-hydration
 *
 * @param root - Root element to start from
 * @param attributeName - Attribute name to remove (default: 'data-truth')
 */
export function dehydrateTree(root: Element, attributeName = 'data-truth'): void {
    // Remove from root
    root.removeAttribute(attributeName);

    // Remove from all descendants
    const elements = root.querySelectorAll(`[${attributeName}]`);
    elements.forEach((el) => el.removeAttribute(attributeName));
}

/**
 * Get hydrated HTML string from element
 * Creates a clone, hydrates it, and returns the HTML
 *
 * @param element - Element to hydrate and serialize
 * @param options - Hydration options
 * @returns Hydrated HTML string
 */
export function getHydratedHtml(
    element: HTMLElement,
    options: HydrationOptions = {}
): string {
    // Clone the element to avoid modifying the original
    const clone = element.cloneNode(true) as HTMLElement;

    // Create a temporary container to get computed styles
    // The clone must be in the document temporarily
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.visibility = 'hidden';
    container.appendChild(clone);
    document.body.appendChild(container);

    try {
        // Hydrate the cloned tree
        hydrateTree(clone, options);

        // Return the hydrated HTML
        return clone.outerHTML;
    } finally {
        // Clean up
        document.body.removeChild(container);
    }
}

/**
 * Hydrate element in place (modifies original DOM)
 * Use with caution - mainly for development/debugging
 *
 * @param element - Element to hydrate
 * @param options - Hydration options
 * @returns Hydration result
 */
export function hydrateInPlace(
    element: Element,
    options: HydrationOptions = {}
): HydrationResult {
    return hydrateTree(element, options);
}
