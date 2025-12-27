/**
 * Color Normalizer Utility
 *
 * Normalizes all color formats to hex for consistent data-truth output.
 * Handles RGB, RGBA, HSL, HSLA, named colors, and transparent.
 *
 * @module colorNormalizer
 */

/**
 * Result of color normalization
 */
export interface NormalizedColor {
    /** Hex color value (e.g., #ffffff) */
    hex: string;
    /** Alpha value 0-1, undefined if fully opaque */
    alpha?: number;
}

/**
 * Named CSS colors mapped to hex values
 * Common colors only - browsers handle the full list
 */
const NAMED_COLORS: Record<string, string> = {
    transparent: 'transparent',
    black: '#000000',
    white: '#ffffff',
    red: '#ff0000',
    green: '#008000',
    blue: '#0000ff',
    yellow: '#ffff00',
    cyan: '#00ffff',
    magenta: '#ff00ff',
    gray: '#808080',
    grey: '#808080',
    orange: '#ffa500',
    purple: '#800080',
    pink: '#ffc0cb',
    inherit: 'inherit',
    currentcolor: 'currentColor',
    currentColor: 'currentColor',
};

/**
 * Convert a number (0-255) to 2-digit hex string
 */
function toHex(n: number): string {
    const clamped = Math.max(0, Math.min(255, Math.round(n)));
    return clamped.toString(16).padStart(2, '0');
}

/**
 * Parse RGB/RGBA string and extract values
 * Handles both rgb(r, g, b) and rgb(r g b) syntax (modern CSS)
 */
function parseRgb(color: string): { r: number; g: number; b: number; a?: number } | null {
    // Match rgb(r, g, b) or rgba(r, g, b, a) - comma-separated
    const commaMatch = color.match(
        /rgba?\s*\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*(?:,\s*(\d*\.?\d+))?\s*\)/i
    );

    if (commaMatch) {
        return {
            r: parseFloat(commaMatch[1]),
            g: parseFloat(commaMatch[2]),
            b: parseFloat(commaMatch[3]),
            a: commaMatch[4] !== undefined ? parseFloat(commaMatch[4]) : undefined,
        };
    }

    // Match rgb(r g b) or rgb(r g b / a) - space-separated (modern CSS)
    const spaceMatch = color.match(
        /rgba?\s*\(\s*(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s*(?:\/\s*(\d*\.?\d+%?))?\s*\)/i
    );

    if (spaceMatch) {
        let alpha: number | undefined;
        if (spaceMatch[4] !== undefined) {
            const alphaStr = spaceMatch[4];
            alpha = alphaStr.endsWith('%')
                ? parseFloat(alphaStr) / 100
                : parseFloat(alphaStr);
        }
        return {
            r: parseFloat(spaceMatch[1]),
            g: parseFloat(spaceMatch[2]),
            b: parseFloat(spaceMatch[3]),
            a: alpha,
        };
    }

    return null;
}

/**
 * Parse HSL/HSLA string and convert to RGB
 */
function parseHsl(color: string): { r: number; g: number; b: number; a?: number } | null {
    // Match hsl(h, s%, l%) or hsla(h, s%, l%, a)
    const match = color.match(
        /hsla?\s*\(\s*(\d+(?:\.\d+)?)\s*,?\s*(\d+(?:\.\d+)?)%?\s*,?\s*(\d+(?:\.\d+)?)%?\s*(?:[,/]\s*(\d*\.?\d+%?))?\s*\)/i
    );

    if (!match) return null;

    const h = parseFloat(match[1]) / 360;
    const s = parseFloat(match[2]) / 100;
    const l = parseFloat(match[3]) / 100;

    let alpha: number | undefined;
    if (match[4] !== undefined) {
        const alphaStr = match[4];
        alpha = alphaStr.endsWith('%')
            ? parseFloat(alphaStr) / 100
            : parseFloat(alphaStr);
    }

    // HSL to RGB conversion
    let r: number, g: number, b: number;

    if (s === 0) {
        r = g = b = l;
    } else {
        const hue2rgb = (p: number, q: number, t: number): number => {
            let adjustedT = t;
            if (adjustedT < 0) adjustedT += 1;
            if (adjustedT > 1) adjustedT -= 1;
            if (adjustedT < 1 / 6) return p + (q - p) * 6 * adjustedT;
            if (adjustedT < 1 / 2) return q;
            if (adjustedT < 2 / 3) return p + (q - p) * (2 / 3 - adjustedT) * 6;
            return p;
        };

        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }

    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255),
        a: alpha,
    };
}

/**
 * Parse hex color string
 * Handles #rgb, #rgba, #rrggbb, #rrggbbaa
 */
function parseHex(color: string): { r: number; g: number; b: number; a?: number } | null {
    const hex = color.replace('#', '');

    if (hex.length === 3) {
        // #rgb -> #rrggbb
        return {
            r: parseInt(hex[0] + hex[0], 16),
            g: parseInt(hex[1] + hex[1], 16),
            b: parseInt(hex[2] + hex[2], 16),
        };
    }

    if (hex.length === 4) {
        // #rgba -> #rrggbbaa
        return {
            r: parseInt(hex[0] + hex[0], 16),
            g: parseInt(hex[1] + hex[1], 16),
            b: parseInt(hex[2] + hex[2], 16),
            a: parseInt(hex[3] + hex[3], 16) / 255,
        };
    }

    if (hex.length === 6) {
        // #rrggbb
        return {
            r: parseInt(hex.slice(0, 2), 16),
            g: parseInt(hex.slice(2, 4), 16),
            b: parseInt(hex.slice(4, 6), 16),
        };
    }

    if (hex.length === 8) {
        // #rrggbbaa
        return {
            r: parseInt(hex.slice(0, 2), 16),
            g: parseInt(hex.slice(2, 4), 16),
            b: parseInt(hex.slice(4, 6), 16),
            a: parseInt(hex.slice(6, 8), 16) / 255,
        };
    }

    return null;
}

/**
 * Normalize any CSS color format to hex
 *
 * @param color - CSS color string in any format
 * @returns Normalized color object with hex and optional alpha
 *
 * @example
 * normalizeColor('rgb(255, 255, 255)') // { hex: '#ffffff' }
 * normalizeColor('rgba(0, 0, 0, 0.5)') // { hex: '#000000', alpha: 0.5 }
 * normalizeColor('#fff') // { hex: '#ffffff' }
 * normalizeColor('transparent') // { hex: 'transparent' }
 */
export function normalizeColor(color: string): NormalizedColor {
    const trimmed = color.trim().toLowerCase();

    // Handle special keywords
    if (trimmed === 'transparent') {
        return { hex: 'transparent' };
    }

    if (trimmed === 'inherit' || trimmed === 'currentcolor') {
        return { hex: trimmed };
    }

    // Check named colors
    if (NAMED_COLORS[trimmed]) {
        const named = NAMED_COLORS[trimmed];
        if (named === 'transparent' || named === 'inherit' || named === 'currentColor') {
            return { hex: named };
        }
        return { hex: named };
    }

    // Try to parse as hex
    if (trimmed.startsWith('#')) {
        const parsed = parseHex(trimmed);
        if (parsed) {
            const hex = `#${toHex(parsed.r)}${toHex(parsed.g)}${toHex(parsed.b)}`;
            return parsed.a !== undefined && parsed.a < 1
                ? { hex, alpha: Math.round(parsed.a * 100) / 100 }
                : { hex };
        }
    }

    // Try to parse as RGB/RGBA
    if (trimmed.startsWith('rgb')) {
        const parsed = parseRgb(trimmed);
        if (parsed) {
            const hex = `#${toHex(parsed.r)}${toHex(parsed.g)}${toHex(parsed.b)}`;
            return parsed.a !== undefined && parsed.a < 1
                ? { hex, alpha: Math.round(parsed.a * 100) / 100 }
                : { hex };
        }
    }

    // Try to parse as HSL/HSLA
    if (trimmed.startsWith('hsl')) {
        const parsed = parseHsl(trimmed);
        if (parsed) {
            const hex = `#${toHex(parsed.r)}${toHex(parsed.g)}${toHex(parsed.b)}`;
            return parsed.a !== undefined && parsed.a < 1
                ? { hex, alpha: Math.round(parsed.a * 100) / 100 }
                : { hex };
        }
    }

    // Fallback: return original value if unrecognized
    return { hex: color };
}

/**
 * Convert RGB string to hex (convenience wrapper)
 *
 * @param rgb - RGB string like "rgb(255, 255, 255)"
 * @returns Hex string like "#ffffff"
 */
export function rgbToHex(rgb: string): string {
    return normalizeColor(rgb).hex;
}

/**
 * Convert RGBA string to hex with alpha info
 *
 * @param rgba - RGBA string like "rgba(0, 0, 0, 0.5)"
 * @returns NormalizedColor with hex and alpha
 */
export function rgbaToHex(rgba: string): NormalizedColor {
    return normalizeColor(rgba);
}

/**
 * Check if a color value represents transparency
 */
export function isTransparent(color: string): boolean {
    const normalized = normalizeColor(color);
    return normalized.hex === 'transparent' || normalized.alpha === 0;
}

/**
 * Format a normalized color back to CSS string
 * Useful for outputting in data-truth
 */
export function formatColor(normalized: NormalizedColor): string {
    if (normalized.hex === 'transparent' || normalized.hex === 'inherit') {
        return normalized.hex;
    }

    if (normalized.alpha !== undefined && normalized.alpha < 1) {
        // Return as rgba for partial transparency
        const hex = normalized.hex.replace('#', '');
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        return `rgba(${r},${g},${b},${normalized.alpha})`;
    }

    return normalized.hex;
}
