/**
 * Unit tests for PatternRecognizer
 * 
 * Tests the core DOM pattern matching functionality:
 * - calculateSimilarity()
 * - findRepeatingPatterns()
 * - Edge cases (badges, different heights, mixed content)
 * 
 * @jest-environment jsdom
 */

// Import the module to test
const fs = require('fs');
const path = require('path');

describe('PatternRecognizer', () => {
    let PatternRecognizer;
    let calculateSimilarity;
    let findRepeatingPatterns;

    beforeAll(() => {
        // Load the module
        const modulePath = path.join(__dirname, '..', 'src', 'smartExtract', 'patternRecognizer.js');
        const code = fs.readFileSync(modulePath, 'utf-8');

        // Convert ES modules to CommonJS for Jest
        const commonJSCode = code
            .replace(/export\s+class\s+(\w+)/g, 'class $1')
            .replace(/export\s+function\s+(\w+)/g, 'function $1')
            .replace(/export\s+default\s+\w+;?/g, '')
            .replace(/export\s+\{[^}]+\};?/g, '');

        // Execute and capture exports
        const script = new Function(`
            ${commonJSCode}
            return { PatternRecognizer, calculateSimilarity, findRepeatingPatterns };
        `);

        const exports = script();
        PatternRecognizer = exports.PatternRecognizer;
        calculateSimilarity = exports.calculateSimilarity;
        findRepeatingPatterns = exports.findRepeatingPatterns;
    });

    beforeEach(() => {
        document.body.innerHTML = '';
    });

    // ═══════════════════════════════════════════════════════════════════════
    // SIMILARITY CALCULATION TESTS
    // ═══════════════════════════════════════════════════════════════════════

    describe('calculateSimilarity', () => {
        test('identical elements should have 100% similarity', () => {
            document.body.innerHTML = `
                <div class="card"><h3>Title</h3><p>Text</p></div>
                <div class="card"><h3>Title</h3><p>Text</p></div>
            `;
            const cards = document.querySelectorAll('.card');
            const similarity = calculateSimilarity(cards[0], cards[1]);
            expect(similarity).toBe(100);
        });

        test('same structure, different text should have >90% similarity', () => {
            document.body.innerHTML = `
                <div class="card"><h3>Product A</h3><p>Description A</p></div>
                <div class="card"><h3>Product B</h3><p>Description B</p></div>
            `;
            const cards = document.querySelectorAll('.card');
            const similarity = calculateSimilarity(cards[0], cards[1]);
            expect(similarity).toBeGreaterThan(90);
        });

        test('one element has badge, other does not - should still have >70% similarity', () => {
            document.body.innerHTML = `
                <div class="card">
                    <h3>Regular Product</h3>
                    <p>Price: $99</p>
                </div>
                <div class="card">
                    <span class="badge">SALE</span>
                    <h3>Discounted Product</h3>
                    <p>Price: $79</p>
                </div>
            `;
            const cards = document.querySelectorAll('.card');
            const similarity = calculateSimilarity(cards[0], cards[1]);
            expect(similarity).toBeGreaterThanOrEqual(70);
        });

        test('completely different elements should have <40% similarity', () => {
            document.body.innerHTML = `
                <div class="card"><h3>Title</h3><p>Description</p></div>
                <nav class="menu"><ul><li>Home</li><li>About</li></ul></nav>
            `;
            const card = document.querySelector('.card');
            const nav = document.querySelector('.menu');
            const similarity = calculateSimilarity(card, nav);
            expect(similarity).toBeLessThan(40);
        });

        test('different tags should have reduced similarity', () => {
            document.body.innerHTML = `
                <div class="item"><span>Content</span></div>
                <section class="item"><span>Content</span></section>
            `;
            const items = document.querySelectorAll('.item');
            const similarity = calculateSimilarity(items[0], items[1]);
            // Same class and structure, but different tags → loses 30 points
            expect(similarity).toBeLessThan(75);
            expect(similarity).toBeGreaterThan(50);
        });

        test('CSS Modules hashes should be ignored in comparison', () => {
            document.body.innerHTML = `
                <div class="card _card_abc12_1"><h3>Title</h3></div>
                <div class="card _card_xyz89_2"><h3>Title</h3></div>
            `;
            const cards = document.querySelectorAll('.card');
            const similarity = calculateSimilarity(cards[0], cards[1]);
            // Hash classes ignored, so should be very similar
            expect(similarity).toBeGreaterThan(90);
        });

        test('Tailwind state variants should be ignored', () => {
            document.body.innerHTML = `
                <button class="btn hover:bg-blue-600">Click</button>
                <button class="btn focus:bg-blue-700">Click</button>
            `;
            const buttons = document.querySelectorAll('.btn');
            const similarity = calculateSimilarity(buttons[0], buttons[1]);
            expect(similarity).toBe(100);
        });

        test('null or undefined elements should return 0', () => {
            document.body.innerHTML = '<div class="test"></div>';
            const el = document.querySelector('.test');
            expect(calculateSimilarity(null, el)).toBe(0);
            expect(calculateSimilarity(el, null)).toBe(0);
            expect(calculateSimilarity(null, null)).toBe(0);
        });
    });

    // ═══════════════════════════════════════════════════════════════════════
    // REPEATING PATTERNS TESTS
    // ═══════════════════════════════════════════════════════════════════════

    describe('findRepeatingPatterns', () => {
        test('simple list of 3 identical items should form 1 group', () => {
            document.body.innerHTML = `
                <ul class="list">
                    <li class="item">Item 1</li>
                    <li class="item">Item 2</li>
                    <li class="item">Item 3</li>
                </ul>
            `;
            const list = document.querySelector('.list');
            const patterns = findRepeatingPatterns(list);

            expect(patterns).toHaveLength(1);
            expect(patterns[0].elements).toHaveLength(3);
            expect(patterns[0].type).toBe('repeating');
        });

        test('grid of 6 cards should form 1 group', () => {
            document.body.innerHTML = `
                <div class="grid">
                    <div class="card"><img src="1.jpg"><h3>Card 1</h3><p>Desc</p></div>
                    <div class="card"><img src="2.jpg"><h3>Card 2</h3><p>Desc</p></div>
                    <div class="card"><img src="3.jpg"><h3>Card 3</h3><p>Desc</p></div>
                    <div class="card"><img src="4.jpg"><h3>Card 4</h3><p>Desc</p></div>
                    <div class="card"><img src="5.jpg"><h3>Card 5</h3><p>Desc</p></div>
                    <div class="card"><img src="6.jpg"><h3>Card 6</h3><p>Desc</p></div>
                </div>
            `;
            const grid = document.querySelector('.grid');
            const patterns = findRepeatingPatterns(grid);

            expect(patterns).toHaveLength(1);
            expect(patterns[0].elements).toHaveLength(6);
        });

        test('list with one badge should still form 1 group', () => {
            document.body.innerHTML = `
                <div class="products">
                    <div class="product"><h3>Product A</h3><span>$50</span></div>
                    <div class="product"><span class="badge">NEW</span><h3>Product B</h3><span>$60</span></div>
                    <div class="product"><h3>Product C</h3><span>$70</span></div>
                </div>
            `;
            const products = document.querySelector('.products');
            const patterns = findRepeatingPatterns(products);

            expect(patterns).toHaveLength(1);
            expect(patterns[0].elements).toHaveLength(3);
        });

        test('navigation menu items should form 1 group', () => {
            document.body.innerHTML = `
                <nav class="menu">
                    <a href="/home" class="nav-item">Home</a>
                    <a href="/about" class="nav-item">About</a>
                    <a href="/products" class="nav-item">Products</a>
                    <a href="/contact" class="nav-item">Contact</a>
                </nav>
            `;
            const menu = document.querySelector('.menu');
            const patterns = findRepeatingPatterns(menu);

            expect(patterns).toHaveLength(1);
            expect(patterns[0].elements).toHaveLength(4);
        });

        test('mixed content (hero + cards + footer) should identify only card group', () => {
            document.body.innerHTML = `
                <main class="page">
                    <section class="hero"><h1>Welcome</h1></section>
                    <div class="card"><h3>Card 1</h3></div>
                    <div class="card"><h3>Card 2</h3></div>
                    <div class="card"><h3>Card 3</h3></div>
                    <footer class="footer"><p>Copyright</p></footer>
                </main>
            `;
            const page = document.querySelector('.page');
            const patterns = findRepeatingPatterns(page);

            expect(patterns).toHaveLength(1);
            expect(patterns[0].elements).toHaveLength(3);
            expect(patterns[0].elements[0].classList.contains('card')).toBe(true);
        });

        test('single element should return empty array', () => {
            document.body.innerHTML = `
                <div class="container">
                    <div class="unique">Only one</div>
                </div>
            `;
            const container = document.querySelector('.container');
            const patterns = findRepeatingPatterns(container);

            expect(patterns).toHaveLength(0);
        });

        test('two similar elements should form a group (minGroupSize=2)', () => {
            document.body.innerHTML = `
                <div class="container">
                    <div class="item">Item 1</div>
                    <div class="item">Item 2</div>
                </div>
            `;
            const container = document.querySelector('.container');
            const patterns = findRepeatingPatterns(container);

            expect(patterns).toHaveLength(1);
            expect(patterns[0].elements).toHaveLength(2);
        });

        test('two completely different elements should not form a group', () => {
            document.body.innerHTML = `
                <div class="container">
                    <header class="header"><h1>Title</h1></header>
                    <main class="content"><article>Article</article></main>
                </div>
            `;
            const container = document.querySelector('.container');
            const patterns = findRepeatingPatterns(container);

            expect(patterns).toHaveLength(0);
        });

        test('should handle elements with different number of children', () => {
            document.body.innerHTML = `
                <div class="list">
                    <div class="item"><span>A</span><span>B</span></div>
                    <div class="item"><span>C</span><span>D</span></div>
                    <div class="item"><span>E</span><span>F</span></div>
                </div>
            `;
            const list = document.querySelector('.list');
            const patterns = findRepeatingPatterns(list);

            expect(patterns).toHaveLength(1);
            expect(patterns[0].elements).toHaveLength(3);
        });

        test('pattern should include template reference', () => {
            document.body.innerHTML = `
                <ul>
                    <li>A</li>
                    <li>B</li>
                    <li>C</li>
                </ul>
            `;
            const ul = document.querySelector('ul');
            const patterns = findRepeatingPatterns(ul);

            expect(patterns[0].template).toBeDefined();
            expect(patterns[0].template.tagName).toBe('LI');
        });

        test('pattern should include similarity score', () => {
            document.body.innerHTML = `
                <div class="grid">
                    <div class="card">A</div>
                    <div class="card">B</div>
                </div>
            `;
            const grid = document.querySelector('.grid');
            const patterns = findRepeatingPatterns(grid);

            expect(patterns[0].similarity).toBeDefined();
            expect(patterns[0].similarity).toBeGreaterThanOrEqual(70);
        });
    });

    // ═══════════════════════════════════════════════════════════════════════
    // PATTERN RECOGNIZER CLASS TESTS
    // ═══════════════════════════════════════════════════════════════════════

    describe('PatternRecognizer class', () => {
        test('should be constructable with default options', () => {
            const recognizer = new PatternRecognizer();
            expect(recognizer).toBeDefined();
            expect(recognizer.options.threshold).toBe(70);
        });

        test('should accept custom threshold', () => {
            const recognizer = new PatternRecognizer({ threshold: 80 });
            expect(recognizer.options.threshold).toBe(80);
        });

        test('should accept custom weights', () => {
            const recognizer = new PatternRecognizer({
                weights: { tag: 50, structure: 30, classes: 10, attributes: 10 }
            });
            expect(recognizer.options.weights.tag).toBe(50);
        });

        test('analyze() should recursively find patterns', () => {
            document.body.innerHTML = `
                <div class="page">
                    <div class="cards">
                        <div class="card">
                            <ul>
                                <li>A</li>
                                <li>B</li>
                            </ul>
                        </div>
                        <div class="card">
                            <ul>
                                <li>C</li>
                                <li>D</li>
                            </ul>
                        </div>
                    </div>
                </div>
            `;
            const page = document.querySelector('.page');
            const recognizer = new PatternRecognizer();
            const patterns = recognizer.analyze(page);

            // Should find cards pattern and li patterns inside
            expect(patterns.length).toBeGreaterThanOrEqual(1);
        });

        test('analyze() should throw on invalid input', () => {
            const recognizer = new PatternRecognizer();
            expect(() => recognizer.analyze(null)).toThrow();
            expect(() => recognizer.analyze('string')).toThrow();
        });
    });
});
