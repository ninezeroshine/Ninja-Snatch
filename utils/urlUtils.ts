/**
 * URL Utilities
 *
 * Helper functions for URL manipulation and validation.
 *
 * @module urlUtils
 */

/**
 * Check if a URL is external (different origin from current page)
 */
export function isExternalUrl(url: string, baseUrl?: string): boolean {
    try {
        const base = baseUrl || window.location.origin;
        const urlObj = new URL(url, base);
        const baseObj = new URL(base);

        return urlObj.origin !== baseObj.origin;
    } catch {
        return false;
    }
}

/**
 * Get the file extension from a URL
 */
export function getExtension(url: string): string {
    try {
        const urlObj = new URL(url, window.location.href);
        const pathname = urlObj.pathname;
        const lastDot = pathname.lastIndexOf('.');

        if (lastDot === -1) return '';

        return pathname.slice(lastDot + 1).toLowerCase();
    } catch {
        return '';
    }
}

/**
 * Get the filename from a URL
 */
export function getFilename(url: string): string {
    try {
        const urlObj = new URL(url, window.location.href);
        const pathname = urlObj.pathname;
        const lastSlash = pathname.lastIndexOf('/');

        return pathname.slice(lastSlash + 1) || 'file';
    } catch {
        return 'file';
    }
}

/**
 * Normalize a URL (resolve relative, remove fragments)
 */
export function normalizeUrl(url: string, base?: string): string | null {
    try {
        const resolvedBase = base || window.location.href;
        const urlObj = new URL(url, resolvedBase);

        // Remove fragment
        urlObj.hash = '';

        return urlObj.href;
    } catch {
        return null;
    }
}

/**
 * Convert a URL to a relative path
 */
export function toRelativePath(url: string, basePath: string = './'): string {
    try {
        const urlObj = new URL(url);
        const pathname = urlObj.pathname;

        // Get filename
        const filename = pathname.split('/').pop() || 'file';

        return `${basePath}${filename}`;
    } catch {
        return `${basePath}file`;
    }
}

/**
 * Check if URL is a data URI
 */
export function isDataUri(url: string): boolean {
    return url.startsWith('data:');
}

/**
 * Check if URL is a blob URL
 */
export function isBlobUrl(url: string): boolean {
    return url.startsWith('blob:');
}

/**
 * Parse MIME type from data URI
 */
export function getMimeFromDataUri(dataUri: string): string | null {
    if (!isDataUri(dataUri)) return null;

    const match = dataUri.match(/^data:([^;,]+)/);
    return match ? match[1] : null;
}

/**
 * Extract all URLs from a srcset attribute value
 */
export function parseSrcset(srcset: string): string[] {
    if (!srcset) return [];

    return srcset
        .split(',')
        .map((entry) => {
            const trimmed = entry.trim();
            // srcset entries are "url [descriptor]" - we only want the URL
            const parts = trimmed.split(/\s+/);
            return parts[0];
        })
        .filter(Boolean);
}

/**
 * Create a safe filename from a URL
 */
export function urlToSafeFilename(url: string, maxLength: number = 50): string {
    try {
        const urlObj = new URL(url, window.location.href);
        let filename = urlObj.pathname.split('/').pop() || 'file';

        // Remove query params from filename
        filename = filename.split('?')[0];

        // Sanitize characters
        filename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');

        // Limit length
        if (filename.length > maxLength) {
            const ext = filename.split('.').pop() || '';
            const name = filename.slice(0, maxLength - ext.length - 1);
            filename = `${name}.${ext}`;
        }

        return filename || 'file';
    } catch {
        return 'file';
    }
}

/**
 * Join URL paths safely
 */
export function joinPaths(...parts: string[]): string {
    return parts
        .map((part, index) => {
            if (index === 0) {
                return part.replace(/\/+$/, '');
            }
            return part.replace(/^\/+|\/+$/g, '');
        })
        .filter(Boolean)
        .join('/');
}
