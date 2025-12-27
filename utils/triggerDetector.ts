/**
 * Trigger Detector - Animation Trigger Detection
 *
 * Detects what triggers an animation: hover, scroll, click, load, focus.
 * Also handles custom cursor detection.
 *
 * @module utils/triggerDetector
 */

import type { AnimationTrigger } from '../types/animation';

/**
 * Context information about a detected trigger
 */
export interface TriggerContext {
    /** Type of animation trigger */
    type: AnimationTrigger;
    /** CSS selector for the target element */
    target: string;
    /** Additional metadata */
    meta: {
        /** For scroll: intersection threshold */
        threshold?: number;
        /** For scroll: viewport margin */
        rootMargin?: string;
        /** For hover: whether it's a :hover CSS trigger */
        isCssHover?: boolean;
        /** For click: associated event types */
        eventTypes?: string[];
    };
}

/**
 * Detected cursor style information
 */
export interface CursorInfo {
    /** Cursor style (pointer, custom, etc.) */
    style: string;
    /** Custom cursor URL if set */
    url?: string;
    /** Hotspot coordinates for custom cursor */
    hotspot?: { x: number; y: number };
    /** Whether cursor changes on hover */
    changesOnHover: boolean;
}

/**
 * Active listeners for cleanup
 */
interface ActiveListeners {
    cleanup: () => void;
}

/**
 * Watch an element for animation triggers
 *
 * @param element - Element to watch
 * @param callback - Called when trigger is detected
 * @returns Cleanup function
 *
 * @example
 * const cleanup = watchForTriggers(element, (trigger) => {
 *   console.log('Animation triggered by:', trigger.type);
 *   startRecording();
 * });
 *
 * // Later:
 * cleanup();
 */
export function watchForTriggers(
    element: Element,
    callback: (trigger: TriggerContext) => void
): () => void {
    const listeners: ActiveListeners[] = [];
    const selector = generateSelector(element);

    // 1. Watch for hover
    const hoverCleanup = watchHover(element, selector, callback);
    listeners.push({ cleanup: hoverCleanup });

    // 2. Watch for scroll/intersection
    const scrollCleanup = watchScroll(element, selector, callback);
    listeners.push({ cleanup: scrollCleanup });

    // 3. Watch for click
    const clickCleanup = watchClick(element, selector, callback);
    listeners.push({ cleanup: clickCleanup });

    // 4. Watch for focus
    const focusCleanup = watchFocus(element, selector, callback);
    listeners.push({ cleanup: focusCleanup });

    // Return master cleanup function
    return () => {
        listeners.forEach((l) => l.cleanup());
    };
}

/**
 * Watch for hover triggers
 */
function watchHover(
    element: Element,
    selector: string,
    callback: (trigger: TriggerContext) => void
): () => void {
    const isCssHover = hasHoverStyles(element);

    const onMouseEnter = () => {
        callback({
            type: 'hover',
            target: selector,
            meta: {
                isCssHover,
                eventTypes: ['mouseenter'],
            },
        });
    };

    element.addEventListener('mouseenter', onMouseEnter);

    return () => {
        element.removeEventListener('mouseenter', onMouseEnter);
    };
}

/**
 * Watch for scroll/intersection triggers
 */
function watchScroll(
    element: Element,
    selector: string,
    callback: (trigger: TriggerContext) => void
): () => void {
    // Check if element uses IntersectionObserver patterns
    const threshold = 0.1;
    const rootMargin = '0px';

    const observer = new IntersectionObserver(
        (entries) => {
            for (const entry of entries) {
                if (entry.isIntersecting) {
                    callback({
                        type: 'scroll',
                        target: selector,
                        meta: {
                            threshold,
                            rootMargin,
                        },
                    });
                    // Only trigger once for "enter" animations
                    observer.unobserve(entry.target);
                }
            }
        },
        {
            threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
            rootMargin,
        }
    );

    observer.observe(element);

    return () => {
        observer.disconnect();
    };
}

/**
 * Watch for click triggers
 */
function watchClick(
    element: Element,
    selector: string,
    callback: (trigger: TriggerContext) => void
): () => void {
    const onClick = () => {
        callback({
            type: 'click',
            target: selector,
            meta: {
                eventTypes: ['click'],
            },
        });
    };

    element.addEventListener('click', onClick);

    return () => {
        element.removeEventListener('click', onClick);
    };
}

/**
 * Watch for focus triggers
 */
function watchFocus(
    element: Element,
    selector: string,
    callback: (trigger: TriggerContext) => void
): () => void {
    const onFocus = () => {
        callback({
            type: 'focus',
            target: selector,
            meta: {
                eventTypes: ['focus'],
            },
        });
    };

    element.addEventListener('focus', onFocus);

    return () => {
        element.removeEventListener('focus', onFocus);
    };
}

/**
 * Infer the most likely trigger type for an element
 * Based on CSS properties and common patterns
 */
export function inferTriggerType(element: Element): AnimationTrigger {
    // Check for :hover styles
    if (hasHoverStyles(element)) {
        return 'hover';
    }

    // Check for scroll-related classes
    const classList = element.className;
    if (typeof classList === 'string') {
        const scrollPatterns = [
            'scroll',
            'reveal',
            'fade-in',
            'animate-on-scroll',
            'aos',
            'wow',
            'inview',
        ];
        for (const pattern of scrollPatterns) {
            if (classList.toLowerCase().includes(pattern)) {
                return 'scroll';
            }
        }
    }

    // Check for click-related attributes
    if (
        element.hasAttribute('onclick') ||
        element.hasAttribute('data-click') ||
        element.getAttribute('role') === 'button'
    ) {
        return 'click';
    }

    // Check if element is focusable
    if (
        element instanceof HTMLInputElement ||
        element instanceof HTMLTextAreaElement ||
        element instanceof HTMLButtonElement ||
        element.getAttribute('tabindex')
    ) {
        return 'focus';
    }

    // Check for animation CSS that plays on load
    const computed = window.getComputedStyle(element);
    if (
        computed.animationName !== 'none' ||
        computed.animationPlayState === 'running'
    ) {
        return 'load';
    }

    // Default to scroll (most common for Framer/Webflow)
    return 'scroll';
}

/**
 * Check if element has :hover styles
 */
function hasHoverStyles(element: Element): boolean {
    // Get computed styles in normal and hover states
    const normalStyles = window.getComputedStyle(element);

    // Try to detect hover by looking at transition properties
    const transition = normalStyles.transition;
    const hasTransition =
        transition &&
        transition !== 'none' &&
        transition !== 'all 0s ease 0s';

    // Check for cursor pointer (common hover indicator)
    const hasCursorPointer = normalStyles.cursor === 'pointer';

    // Check for common hover-related properties
    const hasHoverHint = hasCursorPointer || hasTransition;

    return Boolean(hasHoverHint);
}

/**
 * Detect custom cursor information for an element
 *
 * @param element - Element to check
 * @returns Cursor information including custom URL if set
 */
export function detectCursor(element: Element): CursorInfo {
    const computed = window.getComputedStyle(element);
    const cursorValue = computed.cursor;

    const result: CursorInfo = {
        style: cursorValue || 'auto',
        changesOnHover: false,
    };

    // Check for custom cursor URL
    const urlMatch = cursorValue.match(/url\(['"]?([^'"]+)['"]?\)/);
    if (urlMatch) {
        result.url = urlMatch[1];
        result.style = 'custom';

        // Try to extract hotspot
        const hotspotMatch = cursorValue.match(/url\([^)]+\)\s+(\d+)\s+(\d+)/);
        if (hotspotMatch) {
            result.hotspot = {
                x: parseInt(hotspotMatch[1], 10),
                y: parseInt(hotspotMatch[2], 10),
            };
        }
    }

    // Check if cursor changes on hover by comparing to parent
    const parent = element.parentElement;
    if (parent) {
        const parentCursor = window.getComputedStyle(parent).cursor;
        result.changesOnHover = cursorValue !== parentCursor;
    }

    return result;
}

/**
 * Find all elements with custom cursors in a tree
 */
export function findCustomCursors(root: Element): Map<string, CursorInfo> {
    const cursors = new Map<string, CursorInfo>();

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);

    let node: Node | null = walker.currentNode;
    while (node) {
        if (node instanceof Element) {
            const cursor = detectCursor(node);
            if (cursor.url || cursor.style === 'pointer' || cursor.changesOnHover) {
                const selector = generateSelector(node);
                cursors.set(selector, cursor);
            }
        }
        node = walker.nextNode();
    }

    return cursors;
}

/**
 * Find all potentially animated elements in a tree
 */
export function findAnimatedElements(root: Element): Element[] {
    const animated: Element[] = [];

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);

    let node: Node | null = walker.currentNode;
    while (node) {
        if (node instanceof Element && isLikelyAnimated(node)) {
            animated.push(node);
        }
        node = walker.nextNode();
    }

    return animated;
}

/**
 * Check if an element is likely to be animated
 */
function isLikelyAnimated(element: Element): boolean {
    const computed = window.getComputedStyle(element);

    // Check for CSS animation
    if (computed.animationName !== 'none') {
        return true;
    }

    // Check for transition
    const transition = computed.transition;
    if (transition && transition !== 'none' && transition !== 'all 0s ease 0s') {
        return true;
    }

    // Check for transform (often animated)
    if (computed.transform !== 'none') {
        return true;
    }

    // Check for will-change (performance hint for animations)
    const willChange = computed.willChange;
    if (willChange && willChange !== 'auto') {
        return true;
    }

    // Check class names for animation libraries
    const classStr = element.className;
    if (typeof classStr === 'string') {
        const animationPatterns = [
            'animate',
            'motion',
            'fade',
            'slide',
            'zoom',
            'bounce',
            'pulse',
            'spin',
            'aos',
            'wow',
            'gsap',
            'tween',
            'framer',
        ];

        const lowerClass = classStr.toLowerCase();
        for (const pattern of animationPatterns) {
            if (lowerClass.includes(pattern)) {
                return true;
            }
        }
    }

    // Check data attributes
    if (
        element.hasAttribute('data-aos') ||
        element.hasAttribute('data-animate') ||
        element.hasAttribute('data-motion') ||
        element.hasAttribute('data-scroll')
    ) {
        return true;
    }

    return false;
}

/**
 * Generate a unique CSS selector for an element
 */
function generateSelector(element: Element): string {
    // Try ID first
    if (element.id) {
        return `#${element.id}`;
    }

    // Try unique class combination
    const classes = Array.from(element.classList);
    if (classes.length > 0) {
        const classSelector = '.' + classes.slice(0, 3).join('.');
        if (document.querySelectorAll(classSelector).length === 1) {
            return classSelector;
        }
    }

    // Build path from parent
    const path: string[] = [];
    let current: Element | null = element;

    while (current && current !== document.body) {
        let selector = current.tagName.toLowerCase();

        if (current.id) {
            selector = `#${current.id}`;
            path.unshift(selector);
            break;
        } else if (current.className && typeof current.className === 'string') {
            const mainClass = current.className.split(' ')[0];
            if (mainClass) {
                selector += `.${mainClass}`;
            }
        }

        // Add nth-child for uniqueness
        const parent = current.parentElement;
        if (parent) {
            const siblings = Array.from(parent.children).filter(
                (c) => c.tagName === current!.tagName
            );
            if (siblings.length > 1) {
                const index = siblings.indexOf(current) + 1;
                selector += `:nth-of-type(${index})`;
            }
        }

        path.unshift(selector);
        current = current.parentElement;
    }

    return path.join(' > ');
}

/**
 * Create a mutation observer to watch for animation triggers
 * Useful for detecting dynamic animations
 */
export function watchMutations(
    element: Element,
    callback: (mutations: MutationRecord[]) => void
): () => void {
    const observer = new MutationObserver((mutations) => {
        const animationMutations = mutations.filter((m) => {
            if (m.type === 'attributes') {
                return (
                    m.attributeName === 'style' ||
                    m.attributeName === 'class' ||
                    m.attributeName?.startsWith('data-')
                );
            }
            return false;
        });

        if (animationMutations.length > 0) {
            callback(animationMutations);
        }
    });

    observer.observe(element, {
        attributes: true,
        attributeFilter: ['style', 'class'],
        subtree: true,
    });

    return () => observer.disconnect();
}
