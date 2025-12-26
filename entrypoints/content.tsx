/**
 * Ninja Snatch - Content Script
 *
 * Injected into web pages to enable element selection and extraction.
 * Uses Shadow DOM for UI isolation from host page styles.
 *
 * IMPORTANT: This script does NOT auto-activate on page load.
 * It waits for an activation message from the popup or background script.
 */

import { createShadowRootUi } from 'wxt/utils/content-script-ui/shadow-root';
import { createRoot, type Root } from 'react-dom/client';
import { NinjaPanel } from '@/components/NinjaPanel';
import { scanDocument } from '@/modules/AssetScanner';
import { ZipBuilder } from '@/modules/ZipBuilder';
import { getStyledHtml } from '@/modules/StyleExtractor';
import { extractStylesheets, buildExtractedCSS } from '@/modules/StylesheetExtractor';
import type { Asset, FetchAssetResponse } from '@/types/assets';
import '@/assets/styles.css';

// Message types for content script communication
interface ContentMessage {
  type: 'ACTIVATE_SNIPER' | 'DEACTIVATE_SNIPER' | 'CAPTURE_FULL_PAGE' | 'PING';
}

// Progress update callback type
type ProgressCallback = (current: number, total: number, asset: string) => void;

export default defineContentScript({
  matches: ['<all_urls>'],
  cssInjectionMode: 'ui',

  async main(ctx) {
    console.log('[Ninja Snatch] Content script loaded (inactive)');

    // Track UI instance to prevent multiple panels
    let uiInstance: Awaited<ReturnType<typeof createShadowRootUi<Root>>> | null = null;
    let isActive = false;

    /**
     * Create and mount the Visual Sniper UI
     */
    async function activateSniper(): Promise<void> {
      // Prevent double activation
      if (isActive || uiInstance) {
        console.log('[Ninja Snatch] Already active, skipping');
        return;
      }

      isActive = true;
      console.log('[Ninja Snatch] Activating Visual Sniper');

      // Create Shadow DOM UI for isolation from host page styles
      uiInstance = await createShadowRootUi(ctx, {
        name: 'ninja-snatch-panel',
        position: 'overlay',
        zIndex: 2147483647, // Maximum z-index for top-most layer

        onMount: (container): Root => {
          // Inject styles into shadow root
          const styleSheet = document.createElement('style');
          styleSheet.textContent = getInjectedStyles();
          container.appendChild(styleSheet);

          // Create React root
          const appContainer = document.createElement('div');
          appContainer.id = 'ninja-app';
          container.appendChild(appContainer);

          const root = createRoot(appContainer);
          root.render(
            <NinjaPanel
              onClose={() => {
                deactivateSniper();
              }}
            />
          );

          return root;
        },

        onRemove: (root) => {
          root?.unmount();
        },
      });

      uiInstance.mount();
    }

    /**
     * Remove the Visual Sniper UI
     */
    function deactivateSniper(): void {
      if (uiInstance) {
        uiInstance.remove();
        uiInstance = null;
      }
      isActive = false;
      console.log('[Ninja Snatch] Deactivated');
    }

    /**
     * Capture the full page as a ZIP bundle
     */
    async function captureFullPage(
      _sendProgress?: ProgressCallback
    ): Promise<{ success: boolean; error?: string }> {
      console.log('[Ninja Snatch] Starting full page capture');

      // Show progress overlay
      const overlay = showProgressOverlay();

      try {
        // Step 1: Scan for assets
        updateProgressOverlay(overlay, 'Сканирование ассетов...', 0);
        const targetElement = document.body;
        const scanResult = scanDocument(targetElement);
        const assets = scanResult.assets;

        console.log(`[Ninja Snatch] Found ${assets.length} assets`);

        // Step 2: Create builder and download assets
        const builder = new ZipBuilder();
        let successCount = 0;
        let failCount = 0;

        for (let i = 0; i < assets.length; i++) {
          const asset = assets[i];

          // Update progress overlay
          const progress = Math.round(((i + 1) / assets.length) * 80); // 0-80%
          updateProgressOverlay(
            overlay,
            `${i + 1}/${assets.length}: ${getAssetDisplayName(asset)}`,
            progress
          );

          try {
            const response = (await browser.runtime.sendMessage({
              type: 'FETCH_ASSET',
              url: asset.originalUrl,
              referer: window.location.origin,
            })) as FetchAssetResponse;

            if (response.success && response.data) {
              // Pass Base64 directly - ZipBuilder handles it with {base64: true}
              builder.addAsset(asset, response.data);
              successCount++;
            } else {
              console.warn('[Ninja Snatch] Failed to fetch:', asset.originalUrl);
              failCount++;
            }
          } catch (error) {
            console.error('[Ninja Snatch] Asset fetch error:', error);
            failCount++;
          }
        }

        // Step 3: Extract HTML and CSS with full stylesheet extraction
        // IMPORTANT: Remove overlay before extracting to prevent it from being captured!
        removeProgressOverlay(overlay);

        console.log('[Ninja Snatch] Extracting styles...');

        // Clone the target element to avoid including extension UI
        const { html, css: computedCss } = getStyledHtml(targetElement, {
          excludeSelector: '[id^="ninja-"], [class*="ninja-snatch"]',
        });

        // Extract @media, @keyframes, :hover rules from stylesheets
        const extracted = extractStylesheets();

        // Get asset map for URL rewriting (font paths, etc.)
        const assetMap = builder.getAssetMap();
        const extractedCss = buildExtractedCSS(extracted, assetMap);

        // Combine: extracted rules + computed styles
        const fullCss = [
          extractedCss,
          '',
          '/* ========== Computed Element Styles ========== */',
          computedCss,
        ].join('\n');

        builder.setHtml(html);
        builder.setCss(fullCss);

        // Step 4: Generate and trigger download
        // Re-show overlay for final phase
        const finalOverlay = showProgressOverlay();
        updateProgressOverlay(finalOverlay, 'Создание ZIP...', 95);
        console.log('[Ninja Snatch] Generating ZIP...');
        const blob = await builder.generate();
        await triggerDownload(blob);

        console.log(
          `[Ninja Snatch] Full page capture complete (${successCount} assets, ${failCount} failed)`
        );

        // Hide overlay
        removeProgressOverlay(finalOverlay);


        return { success: true };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('[Ninja Snatch] Full page capture failed:', message);
        removeProgressOverlay(overlay);
        return { success: false, error: message };
      }
    }

    // Listen for activation messages from popup/background
    browser.runtime.onMessage.addListener(
      (message: ContentMessage, _sender, sendResponse) => {
        if (message.type === 'ACTIVATE_SNIPER') {
          activateSniper()
            .then(() => sendResponse({ success: true }))
            .catch((error) =>
              sendResponse({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
              })
            );
          return true; // Keep channel open for async response
        }

        if (message.type === 'DEACTIVATE_SNIPER') {
          deactivateSniper();
          sendResponse({ success: true });
          return false;
        }

        if (message.type === 'CAPTURE_FULL_PAGE') {
          captureFullPage()
            .then((result) => sendResponse(result))
            .catch((error) =>
              sendResponse({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
              })
            );
          return true; // Keep channel open for async response
        }

        if (message.type === 'PING') {
          // Health check - allows popup to verify content script is loaded
          sendResponse({ success: true, active: isActive });
          return false;
        }
      }
    );

    // Listen for ESC key to deactivate (global handler)
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isActive) {
        deactivateSniper();
      }
    });
  },
});

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Trigger file download directly
 */
async function triggerDownload(blob: Blob): Promise<void> {
  const filename = `ninja-full-page-${Date.now()}.zip`;
  const url = URL.createObjectURL(blob);

  // Create a temporary download link
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';

  // Append to document, click, and remove
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Revoke URL after a delay to allow download to start
  setTimeout(() => URL.revokeObjectURL(url), 5000);

  console.log('[Ninja Snatch] Download triggered:', filename);
}

/**
 * Get short display name for asset
 */
function getAssetDisplayName(asset: Asset): string {
  try {
    const url = new URL(asset.originalUrl);
    const filename = url.pathname.split('/').pop() || 'asset';
    return filename.length > 30 ? filename.slice(0, 27) + '...' : filename;
  } catch {
    return asset.localPath;
  }
}

/**
 * Get CSS styles to inject into Shadow DOM
 * This ensures our UI is completely isolated from host page styles
 */
function getInjectedStyles(): string {
  return `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    :host {
      all: initial;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    #ninja-app {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 14px;
      line-height: 1.5;
      color: #ffffff;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 2147483647;
    }

    #ninja-app > * {
      pointer-events: auto;
    }

    /* CSS Variables */
    :root {
      --ninja-primary: #6366f1;
      --ninja-primary-hover: #4f46e5;
      --ninja-accent: #22d3ee;
      --ninja-success: #10b981;
      --ninja-warning: #f59e0b;
      --ninja-error: #ef4444;
      --ninja-bg-dark: #0f0f0f;
      --ninja-bg-card: #1a1a1a;
      --ninja-bg-elevated: #252525;
      --ninja-text-primary: #ffffff;
      --ninja-text-secondary: #a3a3a3;
      --ninja-border: #333333;
    }
  `;
}

// ============================================================================
// Progress Overlay (for Full Page capture)
// ============================================================================

interface ProgressOverlay {
  container: HTMLDivElement;
  textEl: HTMLDivElement;
  barEl: HTMLDivElement;
}

/**
 * Show a progress overlay at the bottom-right of the screen
 */
function showProgressOverlay(): ProgressOverlay {
  const container = document.createElement('div');
  container.id = 'ninja-progress-overlay';
  container.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%);
    color: white;
    padding: 16px 24px;
    border-radius: 12px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 14px;
    z-index: 2147483647;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
    border: 1px solid #333;
    min-width: 280px;
  `;

  const header = document.createElement('div');
  header.style.cssText = `
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
  `;
  header.innerHTML = '<span style="font-size: 18px;">🥷</span><span>Ninja Snatch</span>';
  container.appendChild(header);

  const textEl = document.createElement('div');
  textEl.id = 'ninja-progress-text';
  textEl.style.cssText = 'margin-bottom: 8px; color: #a3a3a3;';
  textEl.textContent = 'Подготовка...';
  container.appendChild(textEl);

  const barContainer = document.createElement('div');
  barContainer.style.cssText = `
    background: #333;
    height: 6px;
    border-radius: 3px;
    overflow: hidden;
  `;

  const barEl = document.createElement('div');
  barEl.id = 'ninja-progress-bar';
  barEl.style.cssText = `
    width: 0%;
    height: 100%;
    background: linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%);
    border-radius: 3px;
    transition: width 0.2s ease;
  `;
  barContainer.appendChild(barEl);
  container.appendChild(barContainer);

  document.body.appendChild(container);

  return { container, textEl, barEl };
}

/**
 * Update the progress overlay with current status
 */
function updateProgressOverlay(
  overlay: ProgressOverlay,
  text: string,
  percent: number
): void {
  if (overlay.textEl) {
    overlay.textEl.textContent = text;
  }
  if (overlay.barEl) {
    overlay.barEl.style.width = `${Math.min(100, Math.max(0, percent))}%`;
  }
}

/**
 * Remove the progress overlay
 */
function removeProgressOverlay(overlay: ProgressOverlay): void {
  if (overlay.container && overlay.container.parentNode) {
    overlay.container.parentNode.removeChild(overlay.container);
  }
}

