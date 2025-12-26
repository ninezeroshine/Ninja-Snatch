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

// Message types for type-safe messaging
interface FetchAssetMessage {
    type: 'FETCH_ASSET';
    url: string;
    referer: string;
}

interface DownloadMessage {
    type: 'DOWNLOAD';
    blob: Blob;
    filename: string;
}

type BackgroundMessage = FetchAssetMessage | DownloadMessage;

export default defineBackground(() => {
    console.log('[Ninja Snatch] Background service worker initialized');

    // Listen for messages from content scripts
    browser.runtime.onMessage.addListener(
        (message: BackgroundMessage, sender, sendResponse) => {
            if (message.type === 'FETCH_ASSET') {
                handleFetchAsset(message, sender)
                    .then(sendResponse)
                    .catch((error) => sendResponse({ error: error.message }));
                return true; // Keep channel open for async response
            }

            if (message.type === 'DOWNLOAD') {
                handleDownload(message)
                    .then(sendResponse)
                    .catch((error) => sendResponse({ error: error.message }));
                return true;
            }
        }
    );
});

/**
 * Fetch an asset with custom headers to bypass CORS/hotlinking
 */
async function handleFetchAsset(
    message: FetchAssetMessage,
    _sender: browser.runtime.MessageSender
): Promise<ArrayBuffer | { error: string }> {
    try {
        const response = await fetch(message.url, {
            headers: {
                'Referer': message.referer,
                'User-Agent': navigator.userAgent,
                'Accept': '*/*',
            },
            mode: 'cors',
            credentials: 'omit',
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        // Return ArrayBuffer for transfer to content script
        return await response.arrayBuffer();
    } catch (error) {
        console.error('[Ninja Snatch] Asset fetch failed:', message.url, error);
        return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
}

/**
 * Trigger browser download for a blob
 */
async function handleDownload(
    message: DownloadMessage
): Promise<{ success: boolean }> {
    const url = URL.createObjectURL(message.blob);

    try {
        await browser.downloads.download({
            url,
            filename: message.filename,
            saveAs: true,
        });
        return { success: true };
    } finally {
        // Clean up blob URL after a delay
        setTimeout(() => URL.revokeObjectURL(url), 60000);
    }
}
