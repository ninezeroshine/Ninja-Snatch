/**
 * Tailwind CSS Value Mapping
 * 
 * Maps computed CSS values to Tailwind utility classes.
 * Used by StyleNormalizer to convert getComputedStyle() results.
 * 
 * @module smartExtract/tailwindMap
 * @version 1.0.0
 */

// ═══════════════════════════════════════════════════════════════════════════
// SPACING SCALE (rem-based, 1rem = 16px)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Tailwind spacing scale: px value → Tailwind suffix
 * Example: 16px → '4' (mt-4, p-4, gap-4)
 */
export const SPACING_SCALE = {
    0: '0',
    1: 'px',      // 1px
    2: '0.5',     // 2px = 0.125rem
    4: '1',       // 4px = 0.25rem
    6: '1.5',     // 6px = 0.375rem
    8: '2',       // 8px = 0.5rem
    10: '2.5',    // 10px = 0.625rem
    12: '3',      // 12px = 0.75rem
    14: '3.5',    // 14px = 0.875rem
    16: '4',      // 16px = 1rem
    20: '5',      // 20px = 1.25rem
    24: '6',      // 24px = 1.5rem
    28: '7',      // 28px = 1.75rem
    32: '8',      // 32px = 2rem
    36: '9',      // 36px = 2.25rem
    40: '10',     // 40px = 2.5rem
    44: '11',     // 44px = 2.75rem
    48: '12',     // 48px = 3rem
    56: '14',     // 56px = 3.5rem
    64: '16',     // 64px = 4rem
    72: '18',     // 72px = 4.5rem
    80: '20',     // 80px = 5rem
    96: '24',     // 96px = 6rem
    112: '28',    // 112px = 7rem
    128: '32',    // 128px = 8rem
    144: '36',    // 144px = 9rem
    160: '40',    // 160px = 10rem
    176: '44',    // 176px = 11rem
    192: '48',    // 192px = 12rem
    208: '52',    // 208px = 13rem
    224: '56',    // 224px = 14rem
    240: '60',    // 240px = 15rem
    256: '64',    // 256px = 16rem
    288: '72',    // 288px = 18rem
    320: '80',    // 320px = 20rem
    384: '96',    // 384px = 24rem
};

// ═══════════════════════════════════════════════════════════════════════════
// TYPOGRAPHY SCALE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Font size scale: px value → Tailwind class
 */
export const FONT_SIZE_SCALE = {
    12: 'text-xs',
    14: 'text-sm',
    16: 'text-base',
    18: 'text-lg',
    20: 'text-xl',
    24: 'text-2xl',
    30: 'text-3xl',
    36: 'text-4xl',
    48: 'text-5xl',
    60: 'text-6xl',
    72: 'text-7xl',
    96: 'text-8xl',
    128: 'text-9xl',
};

/**
 * Font weight scale
 */
export const FONT_WEIGHT_SCALE = {
    100: 'font-thin',
    200: 'font-extralight',
    300: 'font-light',
    400: 'font-normal',
    500: 'font-medium',
    600: 'font-semibold',
    700: 'font-bold',
    800: 'font-extrabold',
    900: 'font-black',
};

/**
 * Line height scale
 */
export const LINE_HEIGHT_SCALE = {
    1: 'leading-none',
    1.25: 'leading-tight',
    1.375: 'leading-snug',
    1.5: 'leading-normal',
    1.625: 'leading-relaxed',
    2: 'leading-loose',
};

// ═══════════════════════════════════════════════════════════════════════════
// COLORS (Tailwind Default Palette)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Color map: hex/rgb → Tailwind color class
 * Covers Tailwind's default color palette
 */
export const COLOR_MAP = {
    // Slate
    '#f8fafc': 'slate-50', '#f1f5f9': 'slate-100', '#e2e8f0': 'slate-200',
    '#cbd5e1': 'slate-300', '#94a3b8': 'slate-400', '#64748b': 'slate-500',
    '#475569': 'slate-600', '#334155': 'slate-700', '#1e293b': 'slate-800',
    '#0f172a': 'slate-900', '#020617': 'slate-950',

    // Gray
    '#f9fafb': 'gray-50', '#f3f4f6': 'gray-100', '#e5e7eb': 'gray-200',
    '#d1d5db': 'gray-300', '#9ca3af': 'gray-400', '#6b7280': 'gray-500',
    '#4b5563': 'gray-600', '#374151': 'gray-700', '#1f2937': 'gray-800',
    '#111827': 'gray-900', '#030712': 'gray-950',

    // Red
    '#fef2f2': 'red-50', '#fee2e2': 'red-100', '#fecaca': 'red-200',
    '#fca5a5': 'red-300', '#f87171': 'red-400', '#ef4444': 'red-500',
    '#dc2626': 'red-600', '#b91c1c': 'red-700', '#991b1b': 'red-800',
    '#7f1d1d': 'red-900', '#450a0a': 'red-950',

    // Orange
    '#fff7ed': 'orange-50', '#ffedd5': 'orange-100', '#fed7aa': 'orange-200',
    '#fdba74': 'orange-300', '#fb923c': 'orange-400', '#f97316': 'orange-500',
    '#ea580c': 'orange-600', '#c2410c': 'orange-700', '#9a3412': 'orange-800',
    '#7c2d12': 'orange-900', '#431407': 'orange-950',

    // Yellow
    '#fefce8': 'yellow-50', '#fef9c3': 'yellow-100', '#fef08a': 'yellow-200',
    '#fde047': 'yellow-300', '#facc15': 'yellow-400', '#eab308': 'yellow-500',
    '#ca8a04': 'yellow-600', '#a16207': 'yellow-700', '#854d0e': 'yellow-800',
    '#713f12': 'yellow-900', '#422006': 'yellow-950',

    // Green
    '#f0fdf4': 'green-50', '#dcfce7': 'green-100', '#bbf7d0': 'green-200',
    '#86efac': 'green-300', '#4ade80': 'green-400', '#22c55e': 'green-500',
    '#16a34a': 'green-600', '#15803d': 'green-700', '#166534': 'green-800',
    '#14532d': 'green-900', '#052e16': 'green-950',

    // Blue
    '#eff6ff': 'blue-50', '#dbeafe': 'blue-100', '#bfdbfe': 'blue-200',
    '#93c5fd': 'blue-300', '#60a5fa': 'blue-400', '#3b82f6': 'blue-500',
    '#2563eb': 'blue-600', '#1d4ed8': 'blue-700', '#1e40af': 'blue-800',
    '#1e3a8a': 'blue-900', '#172554': 'blue-950',

    // Indigo
    '#eef2ff': 'indigo-50', '#e0e7ff': 'indigo-100', '#c7d2fe': 'indigo-200',
    '#a5b4fc': 'indigo-300', '#818cf8': 'indigo-400', '#6366f1': 'indigo-500',
    '#4f46e5': 'indigo-600', '#4338ca': 'indigo-700', '#3730a3': 'indigo-800',
    '#312e81': 'indigo-900', '#1e1b4b': 'indigo-950',

    // Purple
    '#faf5ff': 'purple-50', '#f3e8ff': 'purple-100', '#e9d5ff': 'purple-200',
    '#d8b4fe': 'purple-300', '#c084fc': 'purple-400', '#a855f7': 'purple-500',
    '#9333ea': 'purple-600', '#7e22ce': 'purple-700', '#6b21a8': 'purple-800',
    '#581c87': 'purple-900', '#3b0764': 'purple-950',

    // Pink
    '#fdf2f8': 'pink-50', '#fce7f3': 'pink-100', '#fbcfe8': 'pink-200',
    '#f9a8d4': 'pink-300', '#f472b6': 'pink-400', '#ec4899': 'pink-500',
    '#db2777': 'pink-600', '#be185d': 'pink-700', '#9d174d': 'pink-800',
    '#831843': 'pink-900', '#500724': 'pink-950',

    // Base
    '#ffffff': 'white',
    '#000000': 'black',
    'transparent': 'transparent',
};

// ═══════════════════════════════════════════════════════════════════════════
// BORDER RADIUS
// ═══════════════════════════════════════════════════════════════════════════

export const BORDER_RADIUS_SCALE = {
    0: 'rounded-none',
    2: 'rounded-sm',
    4: 'rounded',
    6: 'rounded-md',
    8: 'rounded-lg',
    12: 'rounded-xl',
    16: 'rounded-2xl',
    24: 'rounded-3xl',
    9999: 'rounded-full',
};

// ═══════════════════════════════════════════════════════════════════════════
// SHADOWS
// ═══════════════════════════════════════════════════════════════════════════

export const SHADOW_PATTERNS = {
    'none': 'shadow-none',
    '0 1px 2px 0 rgb(0 0 0 / 0.05)': 'shadow-sm',
    '0 1px 3px 0 rgb(0 0 0 / 0.1)': 'shadow',
    '0 4px 6px -1px rgb(0 0 0 / 0.1)': 'shadow-md',
    '0 10px 15px -3px rgb(0 0 0 / 0.1)': 'shadow-lg',
    '0 20px 25px -5px rgb(0 0 0 / 0.1)': 'shadow-xl',
    '0 25px 50px -12px rgb(0 0 0 / 0.25)': 'shadow-2xl',
};

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Find nearest value in a scale
 * 
 * @param {number} value - Input value
 * @param {Object} scale - Scale object with numeric keys
 * @returns {string} Corresponding Tailwind value
 */
export function findNearestInScale(value, scale) {
    const keys = Object.keys(scale).map(Number).sort((a, b) => a - b);

    let nearest = keys[0];
    let minDiff = Math.abs(value - keys[0]);

    for (const key of keys) {
        const diff = Math.abs(value - key);
        if (diff < minDiff) {
            minDiff = diff;
            nearest = key;
        }
    }

    return scale[nearest];
}

/**
 * Convert RGB string to hex
 * 
 * @param {string} rgb - RGB string like "rgb(255, 0, 0)"
 * @returns {string} Hex color like "#ff0000"
 */
export function rgbToHex(rgb) {
    if (!rgb || rgb === 'transparent') return 'transparent';
    if (rgb.startsWith('#')) return rgb.toLowerCase();

    const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!match) return null;

    const [, r, g, b] = match;
    return '#' + [r, g, b].map(x => {
        const hex = parseInt(x).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
}

/**
 * Find nearest color in Tailwind palette
 * Uses simple Euclidean distance in RGB space
 * 
 * @param {string} inputColor - Hex or RGB color
 * @returns {string|null} Tailwind color class or null
 */
export function findNearestColor(inputColor) {
    const hex = rgbToHex(inputColor);
    if (!hex) return null;

    // Direct match
    if (COLOR_MAP[hex]) return COLOR_MAP[hex];

    // Find nearest by RGB distance
    const inputRgb = hexToRgbArray(hex);
    if (!inputRgb) return null;

    let nearestColor = null;
    let minDistance = Infinity;

    for (const [colorHex, colorName] of Object.entries(COLOR_MAP)) {
        const colorRgb = hexToRgbArray(colorHex);
        if (!colorRgb) continue;

        const distance = Math.sqrt(
            Math.pow(inputRgb[0] - colorRgb[0], 2) +
            Math.pow(inputRgb[1] - colorRgb[1], 2) +
            Math.pow(inputRgb[2] - colorRgb[2], 2)
        );

        if (distance < minDistance) {
            minDistance = distance;
            nearestColor = colorName;
        }
    }

    // Only return if distance is reasonable (< 30 in RGB space)
    return minDistance < 30 ? nearestColor : null;
}

/**
 * Convert hex to RGB array
 * 
 * @param {string} hex 
 * @returns {number[]|null}
 */
function hexToRgbArray(hex) {
    if (!hex || hex === 'transparent') return null;
    const match = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
    if (!match) return null;
    return [
        parseInt(match[1], 16),
        parseInt(match[2], 16),
        parseInt(match[3], 16)
    ];
}

// Default export
export default {
    SPACING_SCALE,
    FONT_SIZE_SCALE,
    FONT_WEIGHT_SCALE,
    LINE_HEIGHT_SCALE,
    COLOR_MAP,
    BORDER_RADIUS_SCALE,
    SHADOW_PATTERNS,
    findNearestInScale,
    rgbToHex,
    findNearestColor,
};
