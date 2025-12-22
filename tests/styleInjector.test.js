/**
 * Unit tests for StyleInjector core functions
 * @jest-environment jsdom
 */

describe('StyleInjector', () => {
    let StyleInjector;

    beforeAll(() => {
        // Setup window.location for origin
        delete window.location;
        window.location = { origin: 'https://example.com' };

        // Load the StyleInjector script
        const fs = require('fs');
        const path = require('path');
        const code = fs.readFileSync(path.join(__dirname, '..', 'styleInjector.js'), 'utf-8');

        // Execute in global scope to populate window.StyleInjector
        const script = new Function(code);
        script();

        StyleInjector = window.StyleInjector;
    });

    beforeEach(() => {
        // Reset state
        if (StyleInjector) {
            StyleInjector.classCounter = 0;
            StyleInjector.allKeyframes = [];
            StyleInjector.allFontFaces = [];
            StyleInjector.allCSSRules = [];
            StyleInjector.cssVariables = new Map();
            StyleInjector.externalStylesheets = [];
            StyleInjector.pageOrigin = 'https://example.com';
        }
        document.body.innerHTML = '';
        document.head.innerHTML = '';
    });

    describe('Module Loading', () => {
        test('StyleInjector should be defined on window', () => {
            expect(StyleInjector).toBeDefined();
            expect(typeof StyleInjector).toBe('object');
        });

        test('StyleInjector should have core methods', () => {
            expect(typeof StyleInjector.init).toBe('function');
            expect(typeof StyleInjector.collectAllCSS).toBe('function');
            expect(typeof StyleInjector.injectStyles).toBe('function');
            expect(typeof StyleInjector.createStyledDocument).toBe('function');
        });
    });

    describe('fixRelativeURLs', () => {
        test('converts relative ../path URLs to absolute', () => {
            const input = 'url("../fonts/Inter.woff2")';
            const result = StyleInjector.fixRelativeURLs(input);
            expect(result).toContain('https://example.com');
        });

        test('converts relative ./path URLs to absolute', () => {
            const input = 'url("./assets/image.png")';
            const result = StyleInjector.fixRelativeURLs(input);
            expect(result).toContain('https://example.com');
        });

        test('leaves absolute URLs unchanged', () => {
            const input = 'url("https://cdn.example.com/font.woff2")';
            const result = StyleInjector.fixRelativeURLs(input);
            expect(result).toBe(input);
        });
    });

    describe('collectUsedClasses', () => {
        test('collects classes from single element', () => {
            document.body.innerHTML = '<div class="hero main-content"></div>';
            const element = document.querySelector('.hero');
            const classes = StyleInjector.collectUsedClasses(element);
            expect(classes.has('hero')).toBe(true);
            expect(classes.has('main-content')).toBe(true);
        });

        test('collects classes from nested elements', () => {
            document.body.innerHTML = `
                <div class="parent">
                    <div class="child">
                        <span class="grandchild"></span>
                    </div>
                </div>
            `;
            const element = document.querySelector('.parent');
            const classes = StyleInjector.collectUsedClasses(element);
            expect(classes.has('parent')).toBe(true);
            expect(classes.has('child')).toBe(true);
            expect(classes.has('grandchild')).toBe(true);
        });

        test('returns empty set for element with no classes', () => {
            document.body.innerHTML = '<div id="test"></div>';
            const element = document.querySelector('#test');
            const classes = StyleInjector.collectUsedClasses(element);
            expect(classes.size).toBe(0);
        });
    });

    describe('cleanHTML', () => {
        test('removes elements with grammarly in id', () => {
            document.body.innerHTML = `
                <div class="content">
                    <p>Hello</p>
                    <div id="grammarly-popup"></div>
                </div>
            `;
            const clone = document.querySelector('.content').cloneNode(true);
            const result = StyleInjector.cleanHTML(clone);
            expect(result.querySelector('[id*="grammarly"]')).toBeNull();
            expect(result.querySelector('p')).not.toBeNull();
        });

        test('preserves normal content', () => {
            document.body.innerHTML = `
                <div class="content">
                    <h1>Title</h1>
                    <p>Paragraph</p>
                </div>
            `;
            const clone = document.querySelector('.content').cloneNode(true);
            const result = StyleInjector.cleanHTML(clone);
            expect(result.querySelector('h1').textContent).toBe('Title');
            expect(result.querySelector('p').textContent).toBe('Paragraph');
        });
    });

    describe('fixAnimationStates', () => {
        test('preserves opacity for Motion.dev animation', () => {
            // v8.1: opacity is preserved for Motion.dev to animate
            document.body.innerHTML = '<div class="el" style="opacity: 0.1; color: red;"></div>';
            const clone = document.querySelector('.el').cloneNode(true);
            const result = StyleInjector.fixAnimationStates(clone);
            expect(result.getAttribute('style')).toContain('opacity');
            expect(result.getAttribute('style')).toContain('color');
        });

        test('preserves high opacity values', () => {
            document.body.innerHTML = '<div class="el" style="opacity: 0.9;"></div>';
            const clone = document.querySelector('.el').cloneNode(true);
            const result = StyleInjector.fixAnimationStates(clone);
            expect(result.getAttribute('style')).toContain('opacity');
        });

        test('preserves translateY transforms for Motion.dev', () => {
            // v8.1: transforms are preserved for Motion.dev inView animations
            document.body.innerHTML = '<div class="el" style="transform: translateY(50px);"></div>';
            const clone = document.querySelector('.el').cloneNode(true);
            const result = StyleInjector.fixAnimationStates(clone);
            const style = result.getAttribute('style') || '';
            expect(style).toContain('transform');
        });

        test('removes will-change optimization hints', () => {
            document.body.innerHTML = '<div class="el" style="will-change: opacity; color: red;"></div>';
            const clone = document.querySelector('.el').cloneNode(true);
            const result = StyleInjector.fixAnimationStates(clone);
            expect(result.getAttribute('style')).not.toContain('will-change');
            expect(result.getAttribute('style')).toContain('color');
        });

        test('skips display:none elements', () => {
            document.body.innerHTML = '<div class="el" style="display: none; opacity: 0;"></div>';
            const clone = document.querySelector('.el').cloneNode(true);
            const result = StyleInjector.fixAnimationStates(clone);
            expect(result.getAttribute('style')).toContain('opacity');
        });
    });

    describe('prettifyHTML', () => {
        test('formats HTML with indentation', () => {
            const input = '<div><p>Hello</p></div>';
            const result = StyleInjector.prettifyHTML(input);
            expect(result).toContain('\n');
            expect(result.split('\n').length).toBeGreaterThan(1);
        });
    });

    describe('generateCSSVariables', () => {
        test('returns empty string when no variables', () => {
            StyleInjector.cssVariables = new Map();
            const result = StyleInjector.generateCSSVariables();
            expect(result).toBe('');
        });

        test('generates :root block with variables', () => {
            StyleInjector.cssVariables = new Map([
                ['--primary-color', '#ff0000'],
                ['--font-size', '16px']
            ]);
            const result = StyleInjector.generateCSSVariables();
            expect(result).toContain(':root');
            expect(result).toContain('--primary-color: #ff0000');
            expect(result).toContain('--font-size: 16px');
        });
    });

    describe('collectGoogleFonts', () => {
        test('collects Google Fonts links', () => {
            document.head.innerHTML = `
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700" rel="stylesheet">
            `;
            const result = StyleInjector.collectGoogleFonts();
            expect(result).toContain("@import url('https://fonts.googleapis.com");
        });

        test('returns empty string when no Google Fonts', () => {
            document.head.innerHTML = '<link href="styles.css" rel="stylesheet">';
            const result = StyleInjector.collectGoogleFonts();
            expect(result).toBe('');
        });
    });

    describe('generateRevealAnimations', () => {
        test('generates CSS reveal animations', () => {
            document.body.innerHTML = '<div class="hero" style="opacity: 0;"></div>';
            const element = document.querySelector('.hero');
            const result = StyleInjector.generateRevealAnimations(element);
            expect(result).toContain('@keyframes snatch-fade-up');
            expect(result).toContain('animation');
        });
    });

    describe('collectExternalLinks', () => {
        test('collects Webflow stylesheets', () => {
            document.head.innerHTML = `
                <link rel="stylesheet" href="https://uploads-ssl.webflow.com/123/website-files.com/styles.css">
            `;
            const result = StyleInjector.collectExternalLinks();
            expect(result).toContain('<link rel="stylesheet"');
        });

        test('collects any CSS file links', () => {
            document.head.innerHTML = `
                <link rel="stylesheet" href="/styles/main.css">
            `;
            StyleInjector.pageOrigin = 'https://example.com';
            const result = StyleInjector.collectExternalLinks();
            expect(result).toContain('https://example.com/styles/main.css');
        });
    });
});
