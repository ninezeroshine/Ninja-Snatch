/**
 * Ninja Snatch - Background Service Worker
 *
 * Responsibilities:
 * - Asset fetching with CORS bypass
 * - Download management
 * - Communication between content scripts and popup
 *
 * Note: defineBackground is auto-imported by WXT
 */

import type { FetchAssetResponse } from '@/types/assets';

// ============================================================================
// Message Types
// ============================================================================

interface FetchAssetMessage {
    type: 'FETCH_ASSET';
    url: string;
    referer: string;
}

interface DownloadMessage {
    type: 'DOWNLOAD';
    data: ArrayBuffer;
    filename: string;
    mimeType?: string;
}

type BackgroundMessage = FetchAssetMessage | DownloadMessage;

// ============================================================================
// Constants
// ============================================================================

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 500;
const REQUEST_TIMEOUT_MS = 30000;

// ============================================================================
// Main Background Script
// ============================================================================

export default defineBackground(() => {
    console.log('[Ninja Snatch] Background service worker initialized');

    // Listen for messages from content scripts
    browser.runtime.onMessage.addListener(
        (message: BackgroundMessage, sender, sendResponse) => {
            if (message.type === 'FETCH_ASSET') {
                handleFetchAsset(message, sender)
                    .then(sendResponse)
                    .catch((error) =>
                        sendResponse({
                            success: false,
                            error: error instanceof Error ? error.message : 'Unknown error',
                        })
                    );
                return true; // Keep channel open for async response
            }

            if (message.type === 'DOWNLOAD') {
                handleDownload(message)
                    .then(sendResponse)
                    .catch((error) =>
                        sendResponse({
                            success: false,
                            error: error instanceof Error ? error.message : 'Unknown error',
                        })
                    );
                return true;
            }
        }
    );
});

// ============================================================================
// Asset Fetching with Retry Logic
// ============================================================================

/**
 * Fetch an asset with custom headers to bypass CORS/hotlinking
 * Includes retry logic and fallback strategies
 */
async function handleFetchAsset(
    message: FetchAssetMessage,
    _sender: Browser.runtime.MessageSender
): Promise<FetchAssetResponse> {
    const { url, referer } = message;
    let lastError: string = 'Unknown error';

    // Try multiple strategies
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
            const response = await fetchWithTimeout(url, {
                headers: getHeadersForAttempt(attempt, referer, url),
                mode: attempt === 0 ? 'cors' : 'no-cors',
                credentials: 'omit',
                cache: 'force-cache', // Use cache if available
            });

            // Check response status
            if (!response.ok && attempt < MAX_RETRIES - 1) {
                throw new Error(`HTTP ${response.status}`);
            }

            // Get response data and MIME type
            const arrayBuffer = await response.arrayBuffer();
            const mimeType =
                response.headers.get('content-type')?.split(';')[0].trim() ||
                guessMimeType(url);

            // Validate MIME type (reject HTML responses disguised as assets)
            if (!isValidMimeTypeForUrl(url, mimeType)) {
                throw new Error(`Invalid MIME type: ${mimeType} (expected binary asset)`);
            }

            // Convert ArrayBuffer to Base64 (ArrayBuffer can't transfer via messaging)
            const base64 = arrayBufferToBase64(arrayBuffer);

            console.log(
                `[Ninja Snatch] Fetched: ${url.slice(0, 50)}... (${arrayBuffer.byteLength} bytes)`
            );

            return {
                success: true,
                data: base64,
                mimeType,
                size: arrayBuffer.byteLength,
            };
        } catch (error) {
            lastError = error instanceof Error ? error.message : 'Fetch failed';
            console.warn(
                `[Ninja Snatch] Attempt ${attempt + 1}/${MAX_RETRIES} failed for:`,
                url.slice(0, 50),
                lastError
            );

            // Wait before retry (exponential backoff)
            if (attempt < MAX_RETRIES - 1) {
                await sleep(RETRY_DELAY_MS * Math.pow(2, attempt));
            }
        }
    }

    // All attempts failed
    console.error('[Ninja Snatch] All fetch attempts failed:', url.slice(0, 50));
    return {
        success: false,
        error: lastError,
    };
}

/**
 * Get appropriate headers for each retry attempt
 */
function getHeadersForAttempt(
    attempt: number,
    referer: string,
    url: string
): Record<string, string> {
    // Determine Accept header based on asset type
    const acceptHeader = getAcceptHeaderForUrl(url);

    // Base headers
    const headers: Record<string, string> = {
        Accept: acceptHeader,
    };

    // First attempt: include referer (most servers accept this)
    if (attempt === 0) {
        headers['Referer'] = referer;
        headers['Origin'] = new URL(referer).origin;
    }

    // Second attempt: minimal headers (some CDNs block custom headers)
    // Third attempt: no extra headers at all

    return headers;
}

/**
 * Get appropriate Accept header based on URL extension
 */
function getAcceptHeaderForUrl(url: string): string {
    try {
        const ext = new URL(url).pathname.split('.').pop()?.toLowerCase();

        // Font-specific accept header
        if (['woff', 'woff2', 'ttf', 'otf', 'eot'].includes(ext || '')) {
            return 'font/woff2, font/woff, font/ttf, application/font-woff2, application/font-woff, */*';
        }

        // Image accept header
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'svg', 'ico'].includes(ext || '')) {
            return 'image/*, */*';
        }

        // Video accept header
        if (['mp4', 'webm', 'ogg', 'mov'].includes(ext || '')) {
            return 'video/*, */*';
        }

        return '*/*';
    } catch {
        return '*/*';
    }
}

/**
 * Check if MIME type is valid for the expected asset
 */
function isValidMimeTypeForUrl(url: string, mimeType: string): boolean {
    // Reject HTML responses (Next.js error pages, etc.)
    if (mimeType.includes('text/html')) {
        return false;
    }

    try {
        const ext = new URL(url).pathname.split('.').pop()?.toLowerCase();

        // For fonts, reject non-font MIME types
        if (['woff', 'woff2', 'ttf', 'otf', 'eot'].includes(ext || '')) {
            return mimeType.includes('font') ||
                mimeType.includes('application/octet-stream') ||
                mimeType.includes('application/font');
        }

        // For images, reject non-image MIME types
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'svg', 'ico'].includes(ext || '')) {
            return mimeType.includes('image') || mimeType.includes('application/octet-stream');
        }

        return true;
    } catch {
        return true;
    }
}

/**
 * Fetch with timeout wrapper
 */
async function fetchWithTimeout(
    url: string,
    options: RequestInit
): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
        });
        return response;
    } finally {
        clearTimeout(timeoutId);
    }
}

// ============================================================================
// Download Handling
// ============================================================================

/**
 * Trigger browser download for a blob
 */
async function handleDownload(
    message: DownloadMessage
): Promise<{ success: boolean; error?: string }> {
    try {
        // Convert ArrayBuffer to Blob
        const blob = new Blob([message.data], {
            type: message.mimeType || 'application/zip',
        });
        const url = URL.createObjectURL(blob);

        // Trigger download
        const downloadId = await browser.downloads.download({
            url,
            filename: sanitizeFilename(message.filename),
            saveAs: true,
        });

        console.log('[Ninja Snatch] Download started:', downloadId, message.filename);

        // Clean up blob URL after a delay
        setTimeout(() => URL.revokeObjectURL(url), 60000);

        return { success: true };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Download failed';
        console.error('[Ninja Snatch] Download failed:', errorMessage);
        return { success: false, error: errorMessage };
    }
}

/**
 * Sanitize filename for download
 */
function sanitizeFilename(filename: string): string {
    // Remove invalid characters
    let safe = filename.replace(/[<>:"/\\|?*]/g, '_');

    // Ensure it has an extension
    if (!safe.includes('.')) {
        safe += '.zip';
    }

    // Limit length
    if (safe.length > 200) {
        const ext = safe.split('.').pop() || 'zip';
        safe = safe.slice(0, 195) + '.' + ext;
    }

    return safe;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Guess MIME type from URL extension
 */
function guessMimeType(url: string): string {
    try {
        const ext = new URL(url).pathname.split('.').pop()?.toLowerCase();

        const mimeMap: Record<string, string> = {
            // Images
            jpg: 'image/jpeg',
            jpeg: 'image/jpeg',
            png: 'image/png',
            gif: 'image/gif',
            webp: 'image/webp',
            svg: 'image/svg+xml',
            ico: 'image/x-icon',
            avif: 'image/avif',

            // Fonts
            woff: 'font/woff',
            woff2: 'font/woff2',
            ttf: 'font/ttf',
            otf: 'font/otf',
            eot: 'application/vnd.ms-fontobject',

            // Video
            mp4: 'video/mp4',
            webm: 'video/webm',
            ogg: 'video/ogg',

            // CSS
            css: 'text/css',
        };

        return mimeMap[ext || ''] || 'application/octet-stream';
    } catch {
        return 'application/octet-stream';
    }
}

/**
 * Convert ArrayBuffer to Base64 string
 * Required because Chrome messaging API cannot transfer ArrayBuffer directly
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    const chunkSize = 8192; // Process in chunks to avoid stack overflow

    for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
        binary += String.fromCharCode(...chunk);
    }

    return btoa(binary);
}

