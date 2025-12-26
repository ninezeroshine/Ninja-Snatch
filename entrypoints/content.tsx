/**
 * Ninja Snatch - Content Script
 * 
 * Injected into web pages to enable element selection and extraction.
 * Uses Shadow DOM for UI isolation from host page styles.
 */

import { createShadowRootUi } from 'wxt/utils/content-script-ui/shadow-root';
import { createRoot, type Root } from 'react-dom/client';
import { NinjaPanel } from '@/components/NinjaPanel';
import '@/assets/styles.css';

export default defineContentScript({
    matches: ['<all_urls>'],
    cssInjectionMode: 'ui',

    async main(ctx) {
        console.log('[Ninja Snatch] Content script initialized');

        // Create Shadow DOM UI for isolation from host page styles
        const ui = await createShadowRootUi(ctx, {
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
                root.render(<NinjaPanel onClose={() => ui.remove()} />);

                return root;
            },

            onRemove: (root) => {
                root?.unmount();
            },
        });

        // Mount the UI
        ui.mount();
    },
});

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
