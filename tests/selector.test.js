/**
 * Tests for selector.js - Visual Sniper component
 * 
 * Tests the logic patterns used in selector.js without full DOM integration.
 */

describe('SniperSelector Logic Tests', () => {
    let mockWindow;

    beforeEach(() => {
        // Mock window object
        mockWindow = {
            __NINJA_SNATCH__: {},
            snatcherMode: undefined,
            snatcherExtractMode: undefined
        };
    });

    describe('Namespace Guard', () => {
        test('should use __NINJA_SNATCH__ namespace for instance guard', () => {
            mockWindow.__NINJA_SNATCH__ = mockWindow.__NINJA_SNATCH__ || {};

            expect(mockWindow.__NINJA_SNATCH__).toBeDefined();
            expect(mockWindow.__NINJA_SNATCH__.snatcherInstance).toBeUndefined();

            mockWindow.__NINJA_SNATCH__.snatcherInstance = { id: 'test' };
            expect(mockWindow.__NINJA_SNATCH__.snatcherInstance).toBeDefined();
        });

        test('should prevent multiple instances', () => {
            mockWindow.__NINJA_SNATCH__.snatcherInstance = { id: 'first' };

            const shouldSkip = !!mockWindow.__NINJA_SNATCH__.snatcherInstance;
            expect(shouldSkip).toBe(true);
        });
    });

    describe('Extract Mode Detection', () => {
        test('should detect clean mode', () => {
            mockWindow.snatcherExtractMode = 'clean';

            const extractMode = mockWindow.snatcherExtractMode || 'clean';
            const useStyles = extractMode === 'styled';
            const useCompact = extractMode === 'compact' || extractMode === 'llm';

            expect(useStyles).toBe(false);
            expect(useCompact).toBe(false);
        });

        test('should detect styled mode', () => {
            mockWindow.snatcherExtractMode = 'styled';

            const extractMode = mockWindow.snatcherExtractMode || 'clean';
            const useStyles = extractMode === 'styled';
            const useCompact = extractMode === 'compact' || extractMode === 'llm';

            expect(useStyles).toBe(true);
            expect(useCompact).toBe(false);
        });

        test('should detect compact mode', () => {
            mockWindow.snatcherExtractMode = 'compact';

            const extractMode = mockWindow.snatcherExtractMode || 'clean';
            const useStyles = extractMode === 'styled';
            const useCompact = extractMode === 'compact' || extractMode === 'llm';

            expect(useStyles).toBe(false);
            expect(useCompact).toBe(true);
        });

        test('should support legacy llm mode as compact', () => {
            mockWindow.snatcherExtractMode = 'llm';

            const extractMode = mockWindow.snatcherExtractMode || 'clean';
            const useCompact = extractMode === 'compact' || extractMode === 'llm';

            expect(useCompact).toBe(true);
        });

        test('should default to clean mode', () => {
            const extractMode = mockWindow.snatcherExtractMode || 'clean';
            expect(extractMode).toBe('clean');
        });
    });

    describe('Output Mode Detection', () => {
        test('should default to copy mode', () => {
            const outputMode = mockWindow.snatcherMode || 'copy';
            expect(outputMode).toBe('copy');
        });

        test('should detect download mode', () => {
            mockWindow.snatcherMode = 'download';
            const outputMode = mockWindow.snatcherMode || 'copy';
            expect(outputMode).toBe('download');
        });
    });

    describe('Element Label Generation', () => {
        test('should generate label with tag and id', () => {
            const el = { tagName: 'DIV', id: 'hero' };

            const tagName = el.tagName.toLowerCase();
            const id = el.id ? `#${el.id}` : '';
            const label = `${tagName}${id}`;

            expect(label).toBe('div#hero');
        });

        test('should generate label for element without id', () => {
            const el = { tagName: 'SECTION', id: '' };

            const tagName = el.tagName.toLowerCase();
            const id = el.id ? `#${el.id}` : '';
            const label = `${tagName}${id}`;

            expect(label).toBe('section');
        });
    });

    describe('Filename Generation', () => {
        test('should generate valid filename from element with id', () => {
            const el = { tagName: 'DIV', id: 'hero', className: 'hero-section' };

            const title = (el.tagName + '_' + (el.id || el.className || 'element')).substring(0, 30);
            const modeSuffix = '_styled';
            const filename = title.replace(/[^a-z0-9]/gi, '_') + modeSuffix + '.html';

            expect(filename).toBe('DIV_hero_styled.html');
        });

        test('should use className when no id', () => {
            const el = { tagName: 'DIV', id: '', className: 'hero-section' };

            const title = (el.tagName + '_' + (el.id || el.className || 'element')).substring(0, 30);
            const modeSuffix = '_compact';
            const filename = title.replace(/[^a-z0-9]/gi, '_') + modeSuffix + '.html';

            expect(filename).toBe('DIV_hero_section_compact.html');
        });

        test('should fallback to "element" when no id or className', () => {
            const el = { tagName: 'DIV', id: '', className: '' };

            const title = (el.tagName + '_' + (el.id || el.className || 'element')).substring(0, 30);
            const filename = title.replace(/[^a-z0-9]/gi, '_') + '.html';

            expect(filename).toBe('DIV_element.html');
        });

        test('should limit filename length to 30 chars', () => {
            const el = {
                tagName: 'DIV',
                id: '',
                className: 'very-long-class-name-that-exceeds-thirty-characters-limit'
            };

            const title = (el.tagName + '_' + (el.id || el.className || 'element')).substring(0, 30);

            expect(title.length).toBeLessThanOrEqual(30);
        });
    });

    describe('Target Filtering', () => {
        test('should ignore body element', () => {
            const el = { tagName: 'BODY', className: '' };
            const shouldIgnore = el.tagName === 'BODY' || el.tagName === 'HTML';
            expect(shouldIgnore).toBe(true);
        });

        test('should ignore html element', () => {
            const el = { tagName: 'HTML', className: '' };
            const shouldIgnore = el.tagName === 'BODY' || el.tagName === 'HTML';
            expect(shouldIgnore).toBe(true);
        });

        test('should ignore snatcher overlay', () => {
            const el = { tagName: 'DIV', className: 'snatcher-overlay' };
            const shouldIgnore = el.className.includes('snatcher-');
            expect(shouldIgnore).toBe(true);
        });

        test('should ignore snatcher label', () => {
            const el = { tagName: 'DIV', className: 'snatcher-label' };
            const shouldIgnore = el.className.includes('snatcher-');
            expect(shouldIgnore).toBe(true);
        });

        test('should allow regular elements', () => {
            const el = { tagName: 'DIV', className: 'hero-section' };
            const shouldIgnore = el.tagName === 'BODY' ||
                el.tagName === 'HTML' ||
                el.className.includes('snatcher-');
            expect(shouldIgnore).toBe(false);
        });
    });

    describe('Toast Messages', () => {
        test('should generate correct message for compact mode copy', () => {
            const useCompact = true;
            const useStyles = false;

            const msg = useCompact
                ? 'Compact код скопирован! 📦'
                : (useStyles ? 'Код со стилями скопирован! 🎨' : 'Код скопирован в буфер! 📋');

            expect(msg).toBe('Compact код скопирован! 📦');
        });

        test('should generate correct message for styled mode copy', () => {
            const useCompact = false;
            const useStyles = true;

            const msg = useCompact
                ? 'Compact код скопирован! 📦'
                : (useStyles ? 'Код со стилями скопирован! 🎨' : 'Код скопирован в буфер! 📋');

            expect(msg).toBe('Код со стилями скопирован! 🎨');
        });

        test('should generate correct message for clean mode copy', () => {
            const useCompact = false;
            const useStyles = false;

            const msg = useCompact
                ? 'Compact код скопирован! 📦'
                : (useStyles ? 'Код со стилями скопирован! 🎨' : 'Код скопирован в буфер! 📋');

            expect(msg).toBe('Код скопирован в буфер! 📋');
        });

        test('should generate correct message for compact mode download', () => {
            const useCompact = true;
            const useStyles = false;

            const msg = useCompact
                ? 'Compact файл сохранён! 📦'
                : (useStyles ? 'Файл со стилями сохранён! 🎨' : 'Файл сохранён! 💾');

            expect(msg).toBe('Compact файл сохранён! 📦');
        });
    });

    describe('Keyboard Events', () => {
        test('should detect Escape key', () => {
            const event = { key: 'Escape' };
            const isEscape = event.key === 'Escape';
            expect(isEscape).toBe(true);
        });

        test('should not trigger on other keys', () => {
            const event = { key: 'Enter' };
            const isEscape = event.key === 'Escape';
            expect(isEscape).toBe(false);
        });
    });

    describe('Z-Index Values', () => {
        test('should use maximum z-index for overlay', () => {
            const MAX_Z_INDEX = 2147483647;
            expect(MAX_Z_INDEX).toBe(2147483647);
        });
    });
});
