/**
 * Asset Scanner Module
 *
 * Responsible for discovering all external assets in a DOM tree.
 * Scans for images, videos, fonts, and CSS files.
 *
 * @module AssetScanner
 */

import type {
    Asset,
    AssetType,
    AssetScanResult,
    AssetStatus,
} from '@/types/assets';

// Constants for asset detection
const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'ico', 'avif'];
const FONT_EXTENSIONS = ['woff', 'woff2', 'ttf', 'otf', 'eot'];
const VIDEO_EXTENSIONS = ['mp4', 'webm', 'ogg', 'mov'];

// CSS url() pattern matcher
const CSS_URL_PATTERN = /url\(['"]?([^'")\s]+)['"]?\)/gi;

/**
 * Scan a DOM element and its children for all external assets
 */
export function scanDocument(root: Element): AssetScanResult {
    const assetsMap = new Map<string, Asset>();

    // Scan different asset types
    scanImages(root, assetsMap);
    scanVideos(root, assetsMap);
    scanBackgroundImages(root, assetsMap);
    scanInlineStyles(root, assetsMap);
    scanExternalStylesheets(assetsMap);
    scanFontsFromStylesheets(assetsMap);

    // Convert map to array and calculate stats
    const assets = Array.from(assetsMap.values());
    const counts = calculateCounts(assets);

    return {
        assets,
        counts,
        estimatedSize: 0, // Will be updated after download
    };
}

/**
 * Scan for <img>, <picture>, and <source> elements
 */
function scanImages(root: Element, assetsMap: Map<string, Asset>): void {
    // Direct img elements
    const images = root.querySelectorAll('img[src]');
    images.forEach((img) => {
        const src = img.getAttribute('src');
        if (src && isValidAssetUrl(src)) {
            addAsset(assetsMap, src, 'image');
        }

        // Also check srcset for responsive images
        const srcset = img.getAttribute('srcset');
        if (srcset) {
            parseSrcset(srcset).forEach((url) => {
                if (isValidAssetUrl(url)) {
                    addAsset(assetsMap, url, 'image');
                }
            });
        }
    });

    // Picture sources
    const sources = root.querySelectorAll('picture source[srcset]');
    sources.forEach((source) => {
        const srcset = source.getAttribute('srcset');
        if (srcset) {
            parseSrcset(srcset).forEach((url) => {
                if (isValidAssetUrl(url)) {
                    addAsset(assetsMap, url, 'image');
                }
            });
        }
    });
}

/**
 * Scan for <video> and <source> elements
 */
function scanVideos(root: Element, assetsMap: Map<string, Asset>): void {
    const videos = root.querySelectorAll('video[src], video source[src]');
    videos.forEach((video) => {
        const src = video.getAttribute('src');
        if (src && isValidAssetUrl(src)) {
            addAsset(assetsMap, src, 'video');
        }
    });

    // Also check poster attribute
    const posters = root.querySelectorAll('video[poster]');
    posters.forEach((video) => {
        const poster = video.getAttribute('poster');
        if (poster && isValidAssetUrl(poster)) {
            addAsset(assetsMap, poster, 'image');
        }
    });
}

/**
 * Scan for CSS background-image in computed styles
 */
function scanBackgroundImages(root: Element, assetsMap: Map<string, Asset>): void {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
    let node: Node | null = walker.currentNode;

    while (node) {
        if (node instanceof Element) {
            const computed = window.getComputedStyle(node);
            const bgImage = computed.backgroundImage;

            if (bgImage && bgImage !== 'none') {
                extractUrlsFromCss(bgImage).forEach((url) => {
                    if (isValidAssetUrl(url)) {
                        addAsset(assetsMap, url, 'image');
                    }
                });
            }
        }
        node = walker.nextNode();
    }
}

/**
 * Scan inline style attributes for url() patterns
 */
function scanInlineStyles(root: Element, assetsMap: Map<string, Asset>): void {
    const elementsWithStyle = root.querySelectorAll('[style*="url("]');
    elementsWithStyle.forEach((el) => {
        const style = el.getAttribute('style');
        if (style) {
            extractUrlsFromCss(style).forEach((url) => {
                if (isValidAssetUrl(url)) {
                    const type = guessAssetType(url);
                    addAsset(assetsMap, url, type);
                }
            });
        }
    });
}

/**
 * Scan for external stylesheet links
 */
function scanExternalStylesheets(assetsMap: Map<string, Asset>): void {
    const stylesheets = document.querySelectorAll('link[rel="stylesheet"][href]');
    stylesheets.forEach((link) => {
        const href = link.getAttribute('href');
        if (href && isValidAssetUrl(href)) {
            addAsset(assetsMap, href, 'css');
        }
    });
}

/**
 * Scan @font-face rules from document stylesheets
 */
function scanFontsFromStylesheets(assetsMap: Map<string, Asset>): void {
    try {
        // Access document stylesheets (may fail due to CORS)
        for (const sheet of document.styleSheets) {
            try {
                const rules = sheet.cssRules || sheet.rules;
                if (!rules) continue;

                // Get the base URL for this stylesheet (for resolving relative URLs)
                const baseUrl = sheet.href || window.location.href;

                for (const rule of rules) {
                    if (rule instanceof CSSFontFaceRule) {
                        const src = rule.style.getPropertyValue('src');
                        if (src) {
                            extractUrlsFromCss(src).forEach((url) => {
                                if (isValidAssetUrl(url)) {
                                    // Resolve URL relative to the stylesheet, not the page
                                    addAssetWithBase(assetsMap, url, 'font', baseUrl);
                                }
                            });
                        }
                    }
                }
            } catch {
                // CORS restriction - stylesheet from different origin
                console.debug('[AssetScanner] Cannot access stylesheet rules (CORS)');
            }
        }
    } catch (error) {
        console.warn('[AssetScanner] Error scanning stylesheets:', error);
    }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Add an asset to the map (deduplication by URL)
 */
function addAsset(
    assetsMap: Map<string, Asset>,
    url: string,
    type: AssetType
): void {
    // Resolve relative URLs
    const absoluteUrl = resolveUrl(url);
    if (!absoluteUrl) return;

    // Skip if already exists
    if (assetsMap.has(absoluteUrl)) return;

    const asset: Asset = {
        originalUrl: absoluteUrl,
        localPath: generateLocalPath(absoluteUrl, type),
        type,
        status: 'pending' as AssetStatus,
    };

    assetsMap.set(absoluteUrl, asset);
}

/**
 * Add an asset with a custom base URL for resolution
 * Used for fonts and other assets referenced from CSS files
 */
function addAssetWithBase(
    assetsMap: Map<string, Asset>,
    url: string,
    type: AssetType,
    baseUrl: string
): void {
    // Resolve relative URLs using the provided base URL
    const absoluteUrl = resolveUrlWithBase(url, baseUrl);
    if (!absoluteUrl) return;

    // Skip if already exists
    if (assetsMap.has(absoluteUrl)) return;

    const asset: Asset = {
        originalUrl: absoluteUrl,
        localPath: generateLocalPath(absoluteUrl, type),
        type,
        status: 'pending' as AssetStatus,
    };

    console.debug(`[AssetScanner] Font resolved: ${url} -> ${absoluteUrl}`);
    assetsMap.set(absoluteUrl, asset);
}

/**
 * Resolve a URL relative to a specific base URL
 */
function resolveUrlWithBase(url: string, baseUrl: string): string | null {
    try {
        // Handle data URIs - skip them
        if (url.startsWith('data:')) return null;

        // Handle blob URLs - skip them
        if (url.startsWith('blob:')) return null;

        return new URL(url, baseUrl).href;
    } catch {
        return null;
    }
}

/**
 * Resolve a URL relative to the current page
 */
function resolveUrl(url: string): string | null {
    try {
        // Handle data URIs - skip them
        if (url.startsWith('data:')) return null;

        // Handle blob URLs - skip them
        if (url.startsWith('blob:')) return null;

        return new URL(url, window.location.href).href;
    } catch {
        return null;
    }
}

/**
 * Check if URL is a valid external asset (not data URI, not blob)
 */
function isValidAssetUrl(url: string): boolean {
    if (!url) return false;
    if (url.startsWith('data:')) return false;
    if (url.startsWith('blob:')) return false;
    if (url.startsWith('javascript:')) return false;
    if (url.startsWith('#')) return false;

    // Must have a valid protocol or be relative
    return (
        url.startsWith('http://') ||
        url.startsWith('https://') ||
        url.startsWith('//') ||
        url.startsWith('/') ||
        !url.includes(':')
    );
}

/**
 * Extract URLs from CSS value containing url()
 */
function extractUrlsFromCss(cssValue: string): string[] {
    const urls: string[] = [];
    let match: RegExpExecArray | null;

    // Reset regex lastIndex
    CSS_URL_PATTERN.lastIndex = 0;

    while ((match = CSS_URL_PATTERN.exec(cssValue)) !== null) {
        if (match[1]) {
            urls.push(match[1]);
        }
    }

    return urls;
}

/**
 * Parse srcset attribute into array of URLs
 */
function parseSrcset(srcset: string): string[] {
    return srcset
        .split(',')
        .map((entry) => entry.trim().split(/\s+/)[0])
        .filter(Boolean);
}

/**
 * Guess asset type from URL extension
 */
function guessAssetType(url: string): AssetType {
    try {
        const pathname = new URL(url, window.location.href).pathname.toLowerCase();
        const ext = pathname.split('.').pop() || '';

        if (IMAGE_EXTENSIONS.includes(ext)) return 'image';
        if (FONT_EXTENSIONS.includes(ext)) return 'font';
        if (VIDEO_EXTENSIONS.includes(ext)) return 'video';
        if (ext === 'css') return 'css';
        if (ext === 'svg') return 'svg';

        return 'other';
    } catch {
        return 'other';
    }
}

/**
 * Generate a safe local path for the asset
 */
function generateLocalPath(url: string, type: AssetType): string {
    try {
        const urlObj = new URL(url);
        const pathname = urlObj.pathname;

        // Get filename from path
        let filename = pathname.split('/').pop() || 'asset';

        // Clean up filename
        filename = sanitizeFilename(filename);

        // Add hash suffix for uniqueness
        const hash = hashString(url).slice(0, 8);

        // Ensure extension exists
        if (!filename.includes('.')) {
            const ext = getExtensionForType(type);
            filename = `${filename}.${ext}`;
        }

        // Add hash before extension
        const parts = filename.split('.');
        const ext = parts.pop();
        const name = parts.join('.');
        filename = `${name}_${hash}.${ext}`;

        // Determine folder
        const folder = getFolderForType(type);

        return `assets/${folder}/${filename}`;
    } catch {
        const hash = hashString(url).slice(0, 8);
        const folder = getFolderForType(type);
        return `assets/${folder}/asset_${hash}`;
    }
}

/**
 * Sanitize filename for filesystem safety
 */
function sanitizeFilename(filename: string): string {
    return filename
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .replace(/_+/g, '_')
        .slice(0, 100);
}

/**
 * Simple hash function for string
 */
function hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
}

/**
 * Get default extension for asset type
 */
function getExtensionForType(type: AssetType): string {
    switch (type) {
        case 'image':
            return 'png';
        case 'font':
            return 'woff2';
        case 'video':
            return 'mp4';
        case 'css':
            return 'css';
        case 'svg':
            return 'svg';
        default:
            return 'bin';
    }
}

/**
 * Get folder name for asset type
 */
function getFolderForType(type: AssetType): string {
    switch (type) {
        case 'image':
        case 'svg':
            return 'images';
        case 'font':
            return 'fonts';
        case 'video':
            return 'videos';
        case 'css':
            return 'css';
        default:
            return 'other';
    }
}

/**
 * Calculate counts by asset type
 */
function calculateCounts(assets: Asset[]): Record<AssetType, number> {
    const counts: Record<AssetType, number> = {
        image: 0,
        font: 0,
        video: 0,
        css: 0,
        svg: 0,
        other: 0,
    };

    for (const asset of assets) {
        counts[asset.type]++;
    }

    return counts;
}

// Re-export utility for external use
export { extractUrlsFromCss, isValidAssetUrl, resolveUrl };
