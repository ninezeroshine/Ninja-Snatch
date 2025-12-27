/**
 * ZIP Builder Module
 *
 * Responsible for creating ZIP archives with assets, HTML, and CSS.
 * Handles path rewriting to convert external URLs to local paths.
 *
 * @module ZipBuilder
 */

import JSZip from 'jszip';
import type { Asset } from '@/types/assets';

// Template for the HTML wrapper
const HTML_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="generator" content="Ninja Snatch v2.0">
  <link rel="stylesheet" href="style.css">
  <title>Ninja Snatch Export</title>
</head>
<body>
{{CONTENT}}
</body>
</html>`;

/**
 * ZipBuilder class for creating asset bundles
 */
export class ZipBuilder {
    private zip: JSZip;
    private assetMap: Map<string, string>;
    private addedPaths: Set<string>;

    constructor() {
        this.zip = new JSZip();
        this.assetMap = new Map();
        this.addedPaths = new Set();

        // Create folder structure
        this.zip.folder('assets/images');
        this.zip.folder('assets/fonts');
        this.zip.folder('assets/videos');
        this.zip.folder('assets/css');
    }

    /**
     * Add an asset to the ZIP bundle
     * @param asset - Asset metadata
     * @param data - Asset data as Base64 string, Uint8Array, or ArrayBuffer
     */
    addAsset(asset: Asset, data: string | Uint8Array | ArrayBuffer): void {
        // Skip if already added
        if (this.addedPaths.has(asset.localPath)) {
            return;
        }

        // Add file to ZIP - use base64 option if string is provided
        if (typeof data === 'string') {
            // Base64 string - use JSZip's native base64 option
            this.zip.file(asset.localPath, data, { base64: true });
        } else if (data instanceof Uint8Array) {
            // Uint8Array - pass directly
            this.zip.file(asset.localPath, data);
        } else {
            // ArrayBuffer - convert to Uint8Array
            this.zip.file(asset.localPath, new Uint8Array(data));
        }

        this.addedPaths.add(asset.localPath);

        // Track URL → local path mapping for rewriting
        this.assetMap.set(asset.originalUrl, `./${asset.localPath}`);
    }

    /**
     * Set the main HTML content
     * @param html - Raw HTML content from the captured element
     * @param wrapInTemplate - Whether to wrap in full HTML document
     */
    setHtml(html: string, wrapInTemplate: boolean = true): void {
        // Rewrite asset URLs in HTML
        const rewrittenHtml = this.rewriteUrls(html);

        // Optionally wrap in template
        const finalHtml = wrapInTemplate
            ? HTML_TEMPLATE.replace('{{CONTENT}}', rewrittenHtml)
            : rewrittenHtml;

        this.zip.file('index.html', finalHtml);
    }

    /**
     * Set the CSS content
     * @param css - Combined CSS content
     */
    setCss(css: string): void {
        // Rewrite asset URLs in CSS (font-face, background-image, etc.)
        const rewrittenCss = this.rewriteUrls(css);
        this.zip.file('style.css', rewrittenCss);
    }

    /**
     * Add inline CSS content (appends to existing)
     */
    appendCss(css: string): void {
        const rewrittenCss = this.rewriteUrls(css);
        const existingCss = this.zip.file('style.css');

        if (existingCss) {
            existingCss.async('string').then((existing) => {
                this.zip.file('style.css', existing + '\n\n' + rewrittenCss);
            });
        } else {
            this.zip.file('style.css', rewrittenCss);
        }
    }

    /**
     * Add a raw file to the ZIP (for JSON, txt, etc.)
     * @param path - Path inside the ZIP
     * @param content - File content as string
     */
    addFile(path: string, content: string): void {
        this.zip.file(path, content);
    }

    /**
     * Generate the final ZIP blob
     */
    async generate(): Promise<Blob> {
        return this.zip.generateAsync({
            type: 'blob',
            compression: 'DEFLATE',
            compressionOptions: {
                level: 6, // Balance between size and speed
            },
        });
    }

    /**
     * Get the asset URL mapping (for debugging)
     */
    getAssetMap(): Map<string, string> {
        return new Map(this.assetMap);
    }

    /**
     * Get count of assets added
     */
    getAssetCount(): number {
        return this.addedPaths.size;
    }

    /**
     * Rewrite all external URLs to local paths
     */
    private rewriteUrls(content: string): string {
        let result = content;

        // Sort by URL length descending to avoid partial replacements
        const sortedEntries = Array.from(this.assetMap.entries()).sort(
            (a, b) => b[0].length - a[0].length
        );

        for (const [originalUrl, localPath] of sortedEntries) {
            // Replace all occurrences of the original URL
            result = this.replaceAll(result, originalUrl, localPath);

            // Also try with escaped quotes (for JSON, inline styles)
            result = this.replaceAll(
                result,
                originalUrl.replace(/"/g, '\\"'),
                localPath
            );

            // Try URL-encoded version
            try {
                const encoded = encodeURI(originalUrl);
                if (encoded !== originalUrl) {
                    result = this.replaceAll(result, encoded, localPath);
                }
            } catch {
                // Invalid URL, skip encoding
            }
        }

        return result;
    }

    /**
     * Replace all occurrences of a string (polyfill for older browsers)
     */
    private replaceAll(str: string, find: string, replace: string): string {
        // Escape special regex characters
        const escaped = find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return str.replace(new RegExp(escaped, 'g'), replace);
    }
}

/**
 * Factory function for creating ZipBuilder instances
 */
export function createZipBuilder(): ZipBuilder {
    return new ZipBuilder();
}
