/**
 * Unit tests for SnatcherUtils
 * @jest-environment jsdom
 */

// Load the utils file
require('../utils.js');

describe('SnatcherUtils', () => {
    describe('getFullHTML', () => {
        test('returns DOCTYPE and HTML content', () => {
            const result = SnatcherUtils.getFullHTML(document);
            expect(result).toContain('<!DOCTYPE');
            expect(result).toContain('<html');
        });
    });

    describe('wrapAsDocument', () => {
        test('wraps HTML fragment in full document structure', () => {
            const html = '<div class="test">Content</div>';
            const result = SnatcherUtils.wrapAsDocument(html, 'Test Title');

            expect(result).toContain('<!DOCTYPE html>');
            expect(result).toContain('<html>');
            expect(result).toContain('<head>');
            expect(result).toContain('<title>Test Title</title>');
            expect(result).toContain('<body>');
            expect(result).toContain(html);
        });

        test('uses default title when not provided', () => {
            const result = SnatcherUtils.wrapAsDocument('<div>Test</div>');
            expect(result).toContain('<title>Snatched Content</title>');
        });
    });

    describe('sanitizeFilename', () => {
        test('replaces special characters with underscores', () => {
            const result = SnatcherUtils.sanitizeFilename('Hello World!@#$%');
            expect(result).toBe('Hello_World_____');
        });

        test('handles Cyrillic characters', () => {
            const result = SnatcherUtils.sanitizeFilename('Привет Мир');
            expect(result).toBe('Привет_Мир');
        });

        test('truncates to max length', () => {
            const longString = 'a'.repeat(50);
            const result = SnatcherUtils.sanitizeFilename(longString, 30);
            expect(result.length).toBe(30);
        });

        test('returns default for empty string', () => {
            const result = SnatcherUtils.sanitizeFilename('!!!');
            expect(result).toBe('___');
        });
    });

    describe('findTargetIframe', () => {
        test('returns null when no iframes exist', () => {
            document.body.innerHTML = '<div>No iframes here</div>';
            const result = SnatcherUtils.findTargetIframe();
            expect(result).toBeNull();
        });

        test('prioritizes iframe with srcdoc', () => {
            document.body.innerHTML = `
                <iframe src="https://example.com"></iframe>
                <iframe srcdoc="<h1>Hello</h1>"></iframe>
            `;
            const result = SnatcherUtils.findTargetIframe();
            expect(result.srcdoc).toBe('<h1>Hello</h1>');
        });
    });

    describe('extractPageData', () => {
        test('returns page data object', () => {
            document.title = 'Test Page';
            const result = SnatcherUtils.extractPageData();

            expect(result).toHaveProperty('mainHTML');
            expect(result).toHaveProperty('iframeHTML');
            expect(result).toHaveProperty('title', 'Test Page');
        });

        test('returns null iframeHTML when no iframe', () => {
            document.body.innerHTML = '<div>No iframe</div>';
            const result = SnatcherUtils.extractPageData();
            expect(result.iframeHTML).toBeNull();
        });
    });
});
