/**
 * Ninja-Snatch URL Utilities
 * URL resolution and fixing
 * @module utils/urlFixer
 */

/**
 * Convert relative URL to absolute
 * @param {string} url - Relative or absolute URL
 * @param {string} origin - Page origin (e.g., https://example.com)
 * @returns {string} Absolute URL
 */
export function resolveURL(url, origin) {
    if (!url) return url;

    // Already absolute
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//')) {
        return url;
    }

    // Data URL or blob
    if (url.startsWith('data:') || url.startsWith('blob:')) {
        return url;
    }

    // Root-relative
    if (url.startsWith('/')) {
        return origin + url;
    }

    // Relative
    return origin + '/' + url;
}

/**
 * Fix relative URLs in CSS text
 * @param {string} cssText - CSS rules text
 * @param {string} origin - Page origin
 * @returns {string} CSS with absolute URLs
 */
export function fixCSSUrls(cssText, origin) {
    if (!cssText || !origin) return cssText;

    return cssText.replace(
        /url\(['"]?(?!data:|https?:|\/\/|blob:)([^'")]+)['"]?\)/gi,
        (match, url) => `url("${resolveURL(url, origin)}")`
    );
}

/**
 * Fix HTML attribute URLs
 * @param {HTMLElement} element - Element to process
 * @param {string} origin - Page origin
 */
export function fixElementUrls(element, origin) {
    // Fix src attributes
    element.querySelectorAll('[src]').forEach(el => {
        const src = el.getAttribute('src');
        if (src && !src.startsWith('data:') && !src.startsWith('http') && !src.startsWith('//')) {
            el.setAttribute('src', resolveURL(src, origin));
        }
    });

    // Fix href attributes (not anchors)
    element.querySelectorAll('[href]').forEach(el => {
        const href = el.getAttribute('href');
        if (href && !href.startsWith('#') && !href.startsWith('javascript:') &&
            !href.startsWith('mailto:') && !href.startsWith('tel:') &&
            !href.startsWith('http') && !href.startsWith('//')) {
            el.setAttribute('href', resolveURL(href, origin));
        }
    });

    // Fix srcset attributes
    element.querySelectorAll('[srcset]').forEach(el => {
        const srcset = el.getAttribute('srcset');
        if (srcset) {
            const fixed = srcset.split(',').map(part => {
                const [url, descriptor] = part.trim().split(/\s+/);
                const fixedUrl = resolveURL(url, origin);
                return descriptor ? `${fixedUrl} ${descriptor}` : fixedUrl;
            }).join(', ');
            el.setAttribute('srcset', fixed);
        }
    });

    // Fix background-image in inline styles
    element.querySelectorAll('[style*="url("]').forEach(el => {
        const style = el.getAttribute('style');
        if (style) {
            el.setAttribute('style', fixCSSUrls(style, origin));
        }
    });
}
