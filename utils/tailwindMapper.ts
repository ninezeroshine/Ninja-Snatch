/**
 * Tailwind Mapper Utility
 *
 * Maps CSS computed values to Tailwind-like notation for AI-readable output.
 * Uses exact Tailwind scale when possible, falls back to arbitrary value syntax.
 *
 * @module tailwindMapper
 */

import { normalizeColor, type NormalizedColor } from './colorNormalizer';

// ============================================================================
// Tailwind Scale Mappings
// ============================================================================

/**
 * Tailwind spacing scale (rem-based, 1 unit = 0.25rem = 4px)
 */
const SPACING_SCALE: Record<string, string> = {
    '0px': '0',
    '1px': 'px',
    '2px': '0.5',
    '4px': '1',
    '6px': '1.5',
    '8px': '2',
    '10px': '2.5',
    '12px': '3',
    '14px': '3.5',
    '16px': '4',
    '20px': '5',
    '24px': '6',
    '28px': '7',
    '32px': '8',
    '36px': '9',
    '40px': '10',
    '44px': '11',
    '48px': '12',
    '56px': '14',
    '64px': '16',
    '80px': '20',
    '96px': '24',
    '112px': '28',
    '128px': '32',
    '144px': '36',
    '160px': '40',
    '176px': '44',
    '192px': '48',
    '208px': '52',
    '224px': '56',
    '240px': '60',
    '256px': '64',
    '288px': '72',
    '320px': '80',
    '384px': '96',
};

/**
 * Tailwind font size scale
 */
const FONT_SIZE_SCALE: Record<string, string> = {
    '12px': 'xs',
    '14px': 'sm',
    '16px': 'base',
    '18px': 'lg',
    '20px': 'xl',
    '24px': '2xl',
    '30px': '3xl',
    '36px': '4xl',
    '48px': '5xl',
    '60px': '6xl',
    '72px': '7xl',
    '96px': '8xl',
    '128px': '9xl',
};

/**
 * Tailwind font weight scale
 */
const FONT_WEIGHT_SCALE: Record<string, string> = {
    '100': 'thin',
    '200': 'extralight',
    '300': 'light',
    '400': 'normal',
    '500': 'medium',
    '600': 'semibold',
    '700': 'bold',
    '800': 'extrabold',
    '900': 'black',
};

/**
 * Tailwind max-width scale
 */
const MAX_WIDTH_SCALE: Record<string, string> = {
    '0px': '0',
    '256px': 'xs',
    '320px': 'sm',
    '384px': 'md',
    '448px': 'lg',
    '512px': 'xl',
    '576px': '2xl',
    '672px': '3xl',
    '768px': '4xl',
    '896px': '5xl',
    '1024px': '6xl',
    '1152px': '7xl',
};

/**
 * Tailwind border-radius scale
 */
const BORDER_RADIUS_SCALE: Record<string, string> = {
    '0px': 'none',
    '2px': 'sm',
    '4px': 'DEFAULT',
    '6px': 'md',
    '8px': 'lg',
    '12px': 'xl',
    '16px': '2xl',
    '24px': '3xl',
    '9999px': 'full',
};

/**
 * Tailwind line-height scale
 */
const LINE_HEIGHT_SCALE: Record<string, string> = {
    '1': 'none',
    '1.25': 'tight',
    '1.375': 'snug',
    '1.5': 'normal',
    '1.625': 'relaxed',
    '2': 'loose',
};

/**
 * Tailwind opacity scale
 */
const OPACITY_SCALE: Record<string, string> = {
    '0': '0',
    '0.05': '5',
    '0.1': '10',
    '0.15': '15',
    '0.2': '20',
    '0.25': '25',
    '0.3': '30',
    '0.35': '35',
    '0.4': '40',
    '0.45': '45',
    '0.5': '50',
    '0.55': '55',
    '0.6': '60',
    '0.65': '65',
    '0.7': '70',
    '0.75': '75',
    '0.8': '80',
    '0.85': '85',
    '0.9': '90',
    '0.95': '95',
    '1': '100',
};

// ============================================================================
// Mapping Functions
// ============================================================================

/**
 * Map a spacing value (px) to Tailwind notation
 *
 * @param value - CSS value like "24px"
 * @returns Tailwind notation like "6" or "[24px]"
 */
export function mapSpacing(value: string): string {
    const trimmed = value.trim();

    // Check exact match in scale
    if (SPACING_SCALE[trimmed]) {
        return SPACING_SCALE[trimmed];
    }

    // Handle 0 without unit
    if (trimmed === '0') {
        return '0';
    }

    // Handle auto
    if (trimmed === 'auto') {
        return 'auto';
    }

    // For percentages and viewport units, use arbitrary value
    if (trimmed.includes('%') || trimmed.includes('vw') || trimmed.includes('vh')) {
        return `[${trimmed}]`;
    }

    // Try to find closest match or use arbitrary value
    const pxMatch = trimmed.match(/^(\d+(?:\.\d+)?)(px)?$/);
    if (pxMatch) {
        const px = parseFloat(pxMatch[1]);
        const pxStr = `${Math.round(px)}px`;
        if (SPACING_SCALE[pxStr]) {
            return SPACING_SCALE[pxStr];
        }
        return `[${pxStr}]`;
    }

    // Fallback to arbitrary value
    return `[${trimmed}]`;
}

/**
 * Map padding/margin with multiple values to Tailwind notation
 * Handles 1, 2, 3, or 4 value syntax
 *
 * @param value - CSS value like "20px 40px" or "10px 20px 30px 40px"
 * @returns Object with Tailwind notations for each side
 */
export function mapBoxSpacing(value: string): {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
    x?: string;
    y?: string;
    all?: string;
} {
    const parts = value.trim().split(/\s+/);

    if (parts.length === 1) {
        // Single value: applies to all sides
        return { all: mapSpacing(parts[0]) };
    }

    if (parts.length === 2) {
        // Two values: vertical horizontal
        return {
            y: mapSpacing(parts[0]),
            x: mapSpacing(parts[1]),
        };
    }

    if (parts.length === 3) {
        // Three values: top horizontal bottom
        return {
            top: mapSpacing(parts[0]),
            x: mapSpacing(parts[1]),
            bottom: mapSpacing(parts[2]),
        };
    }

    if (parts.length === 4) {
        // Four values: top right bottom left
        const [top, right, bottom, left] = parts;

        // Check if we can simplify
        if (top === bottom && right === left) {
            return {
                y: mapSpacing(top),
                x: mapSpacing(right),
            };
        }

        return {
            top: mapSpacing(top),
            right: mapSpacing(right),
            bottom: mapSpacing(bottom),
            left: mapSpacing(left),
        };
    }

    return { all: `[${value}]` };
}

/**
 * Map font-size to Tailwind notation
 */
export function mapFontSize(value: string): string {
    const trimmed = value.trim();

    if (FONT_SIZE_SCALE[trimmed]) {
        return FONT_SIZE_SCALE[trimmed];
    }

    // Handle rem values
    const remMatch = trimmed.match(/^(\d+(?:\.\d+)?)rem$/);
    if (remMatch) {
        const px = parseFloat(remMatch[1]) * 16;
        const pxStr = `${Math.round(px)}px`;
        if (FONT_SIZE_SCALE[pxStr]) {
            return FONT_SIZE_SCALE[pxStr];
        }
    }

    return `[${trimmed}]`;
}

/**
 * Map font-weight to Tailwind notation
 */
export function mapFontWeight(value: string): string {
    const trimmed = value.trim();

    if (FONT_WEIGHT_SCALE[trimmed]) {
        return FONT_WEIGHT_SCALE[trimmed];
    }

    // Handle keywords
    const keywords: Record<string, string> = {
        normal: 'normal',
        bold: 'bold',
        lighter: 'lighter',
        bolder: 'bolder',
    };

    if (keywords[trimmed]) {
        return keywords[trimmed];
    }

    return `[${trimmed}]`;
}

/**
 * Map max-width to Tailwind notation
 */
export function mapMaxWidth(value: string): string {
    const trimmed = value.trim();

    if (trimmed === 'none') {
        return 'none';
    }

    if (trimmed === '100%') {
        return 'full';
    }

    if (MAX_WIDTH_SCALE[trimmed]) {
        return MAX_WIDTH_SCALE[trimmed];
    }

    // Check for common screen sizes
    const screenSizes: Record<string, string> = {
        '640px': 'screen-sm',
        '768px': 'screen-md',
        '1024px': 'screen-lg',
        '1280px': 'screen-xl',
        '1536px': 'screen-2xl',
    };

    if (screenSizes[trimmed]) {
        return screenSizes[trimmed];
    }

    return `[${trimmed}]`;
}

/**
 * Map border-radius to Tailwind notation
 */
export function mapBorderRadius(value: string): string {
    const trimmed = value.trim();

    if (BORDER_RADIUS_SCALE[trimmed]) {
        const tw = BORDER_RADIUS_SCALE[trimmed];
        return tw === 'DEFAULT' ? '' : tw;
    }

    // Handle 50% for circles
    if (trimmed === '50%') {
        return 'full';
    }

    return `[${trimmed}]`;
}

/**
 * Map line-height to Tailwind notation
 */
export function mapLineHeight(value: string): string {
    const trimmed = value.trim();

    if (trimmed === 'normal') {
        return 'normal';
    }

    // Check unitless values
    if (LINE_HEIGHT_SCALE[trimmed]) {
        return LINE_HEIGHT_SCALE[trimmed];
    }

    // Handle rem/px values - convert to relative if possible
    const pxMatch = trimmed.match(/^(\d+(?:\.\d+)?)px$/);
    if (pxMatch) {
        return `[${trimmed}]`;
    }

    return `[${trimmed}]`;
}

/**
 * Map opacity to Tailwind notation
 */
export function mapOpacity(value: string): string {
    const trimmed = value.trim();

    if (OPACITY_SCALE[trimmed]) {
        return OPACITY_SCALE[trimmed];
    }

    // Convert percentage
    const percentMatch = trimmed.match(/^(\d+(?:\.\d+)?)%$/);
    if (percentMatch) {
        const decimal = parseFloat(percentMatch[1]) / 100;
        if (OPACITY_SCALE[String(decimal)]) {
            return OPACITY_SCALE[String(decimal)];
        }
        return `[${decimal}]`;
    }

    return `[${trimmed}]`;
}

/**
 * Map color to Tailwind notation
 * Uses arbitrary value syntax for non-theme colors
 */
export function mapColor(value: string): string {
    const normalized: NormalizedColor = normalizeColor(value);

    if (normalized.hex === 'transparent') {
        return 'transparent';
    }

    if (normalized.hex === 'inherit') {
        return 'inherit';
    }

    if (normalized.hex === 'currentColor') {
        return 'current';
    }

    // Use arbitrary value for custom colors
    if (normalized.alpha !== undefined && normalized.alpha < 1) {
        return `[${normalized.hex}/${Math.round(normalized.alpha * 100)}]`;
    }

    return `[${normalized.hex}]`;
}

/**
 * Map z-index to Tailwind notation
 */
export function mapZIndex(value: string): string {
    const trimmed = value.trim();

    const zScale: Record<string, string> = {
        '0': '0',
        '10': '10',
        '20': '20',
        '30': '30',
        '40': '40',
        '50': '50',
        'auto': 'auto',
    };

    if (zScale[trimmed]) {
        return zScale[trimmed];
    }

    return `[${trimmed}]`;
}

/**
 * Map display value to Tailwind class
 */
export function mapDisplay(value: string): string {
    const displayMap: Record<string, string> = {
        block: 'block',
        inline: 'inline',
        'inline-block': 'inline-block',
        flex: 'flex',
        'inline-flex': 'inline-flex',
        grid: 'grid',
        'inline-grid': 'inline-grid',
        hidden: 'hidden',
        none: 'hidden',
        contents: 'contents',
        table: 'table',
        'table-row': 'table-row',
        'table-cell': 'table-cell',
    };

    return displayMap[value.trim()] ?? value;
}

/**
 * Map position value to Tailwind class
 */
export function mapPosition(value: string): string {
    const positionMap: Record<string, string> = {
        static: 'static',
        relative: 'relative',
        absolute: 'absolute',
        fixed: 'fixed',
        sticky: 'sticky',
    };

    return positionMap[value.trim()] ?? value;
}

/**
 * Map flex-direction to Tailwind class
 */
export function mapFlexDirection(value: string): string {
    const flexDirMap: Record<string, string> = {
        row: 'row',
        'row-reverse': 'row-reverse',
        column: 'col',
        'column-reverse': 'col-reverse',
    };

    return flexDirMap[value.trim()] ?? value;
}

/**
 * Map justify-content to Tailwind class
 */
export function mapJustifyContent(value: string): string {
    const justifyMap: Record<string, string> = {
        'flex-start': 'start',
        'flex-end': 'end',
        start: 'start',
        end: 'end',
        center: 'center',
        'space-between': 'between',
        'space-around': 'around',
        'space-evenly': 'evenly',
        stretch: 'stretch',
    };

    return justifyMap[value.trim()] ?? value;
}

/**
 * Map align-items to Tailwind class
 */
export function mapAlignItems(value: string): string {
    const alignMap: Record<string, string> = {
        'flex-start': 'start',
        'flex-end': 'end',
        start: 'start',
        end: 'end',
        center: 'center',
        baseline: 'baseline',
        stretch: 'stretch',
    };

    return alignMap[value.trim()] ?? value;
}

/**
 * Map text-align to Tailwind class
 */
export function mapTextAlign(value: string): string {
    const textAlignMap: Record<string, string> = {
        left: 'left',
        center: 'center',
        right: 'right',
        justify: 'justify',
        start: 'start',
        end: 'end',
    };

    return textAlignMap[value.trim()] ?? value;
}

/**
 * Map overflow to Tailwind class
 */
export function mapOverflow(value: string): string {
    const overflowMap: Record<string, string> = {
        auto: 'auto',
        hidden: 'hidden',
        clip: 'clip',
        visible: 'visible',
        scroll: 'scroll',
    };

    return overflowMap[value.trim()] ?? value;
}

// ============================================================================
// Main Mapper
// ============================================================================

/**
 * Property-specific mappers registry
 */
const PROPERTY_MAPPERS: Record<string, (value: string) => string> = {
    // Layout
    display: mapDisplay,
    position: mapPosition,
    flexDirection: mapFlexDirection,
    justifyContent: mapJustifyContent,
    alignItems: mapAlignItems,
    overflow: mapOverflow,
    overflowX: mapOverflow,
    overflowY: mapOverflow,
    zIndex: mapZIndex,

    // Spacing
    gap: mapSpacing,
    rowGap: mapSpacing,
    columnGap: mapSpacing,
    top: mapSpacing,
    right: mapSpacing,
    bottom: mapSpacing,
    left: mapSpacing,

    // Box model (single values)
    width: mapSpacing,
    height: mapSpacing,
    minWidth: mapSpacing,
    maxWidth: mapMaxWidth,
    minHeight: mapSpacing,
    maxHeight: mapSpacing,

    // Typography
    fontSize: mapFontSize,
    fontWeight: mapFontWeight,
    lineHeight: mapLineHeight,
    textAlign: mapTextAlign,

    // Colors
    color: mapColor,
    backgroundColor: mapColor,
    borderColor: mapColor,

    // Border radius
    borderRadius: mapBorderRadius,
    borderTopLeftRadius: mapBorderRadius,
    borderTopRightRadius: mapBorderRadius,
    borderBottomRightRadius: mapBorderRadius,
    borderBottomLeftRadius: mapBorderRadius,

    // Opacity
    opacity: mapOpacity,
};

/**
 * Map any CSS property value to Tailwind-like notation
 *
 * @param property - CSS property name (camelCase)
 * @param value - CSS computed value
 * @returns Tailwind-like string representation
 */
export function mapToTailwind(property: string, value: string): string {
    const mapper = PROPERTY_MAPPERS[property];

    if (mapper) {
        return mapper(value);
    }

    // For unknown properties, return as-is (will be used with shorthand in data-truth)
    return value;
}

/**
 * Check if a value maps to a known Tailwind class (not arbitrary)
 */
export function isKnownTailwindValue(property: string, value: string): boolean {
    const mapped = mapToTailwind(property, value);
    return !mapped.startsWith('[') && !mapped.endsWith(']');
}
