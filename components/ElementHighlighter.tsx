/**
 * Element Highlighter Component
 * 
 * Provides visual feedback when hovering over page elements.
 * Features:
 * - Colored overlay on hovered elements
 * - Tag name label
 * - Click to select
 * - Excludes extension UI from selection
 */

import { useEffect, useCallback, useRef, memo, type RefObject } from 'react';

export interface HighlightedElement {
    element: HTMLElement;
    tagName: string;
    id: string | null;
    classes: string[];
    width: number;
    height: number;
    rect: DOMRect;
}

interface ElementHighlighterProps {
    onHover: (element: HighlightedElement | null) => void;
    onSelect: (element: HTMLElement) => void;
    isDisabled: boolean;
    excludeRef: RefObject<HTMLDivElement | null>;
}

export const ElementHighlighter = memo(function ElementHighlighter({
    onHover,
    onSelect,
    isDisabled,
    excludeRef,
}: ElementHighlighterProps) {
    const overlayRef = useRef<HTMLDivElement | null>(null);
    const labelRef = useRef<HTMLDivElement | null>(null);
    const currentElementRef = useRef<HTMLElement | null>(null);

    // Create overlay elements on mount
    useEffect(() => {
        // Create highlight overlay
        const overlay = document.createElement('div');
        overlay.id = 'ninja-highlight-overlay';
        Object.assign(overlay.style, {
            position: 'fixed',
            pointerEvents: 'none',
            zIndex: '2147483646',
            background: 'rgba(99, 102, 241, 0.15)',
            border: '2px solid #6366f1',
            borderRadius: '4px',
            transition: 'all 0.1s ease-out',
            opacity: '0',
        });

        // Create label
        const label = document.createElement('div');
        label.id = 'ninja-highlight-label';
        Object.assign(label.style, {
            position: 'fixed',
            pointerEvents: 'none',
            zIndex: '2147483646',
            padding: '4px 8px',
            background: '#6366f1',
            color: '#ffffff',
            fontSize: '11px',
            fontWeight: '600',
            fontFamily: 'Inter, -apple-system, sans-serif',
            borderRadius: '4px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
            opacity: '0',
            transition: 'opacity 0.1s ease-out',
        });

        document.body.appendChild(overlay);
        document.body.appendChild(label);

        overlayRef.current = overlay;
        labelRef.current = label;

        return () => {
            overlay.remove();
            label.remove();
        };
    }, []);

    // Check if element should be excluded
    const shouldExclude = useCallback((element: HTMLElement): boolean => {
        // Exclude our own UI
        if (excludeRef.current?.contains(element)) return true;

        // Exclude shadow host
        const shadowHost = element.closest('ninja-snatch-panel');
        if (shadowHost) return true;

        // Exclude script and style elements
        const tagName = element.tagName.toLowerCase();
        if (['script', 'style', 'noscript', 'link', 'meta', 'head', 'html'].includes(tagName)) {
            return true;
        }

        return false;
    }, [excludeRef]);

    // Update highlight position
    const updateHighlight = useCallback((element: HTMLElement | null) => {
        const overlay = overlayRef.current;
        const label = labelRef.current;

        if (!overlay || !label) return;

        if (!element) {
            overlay.style.opacity = '0';
            label.style.opacity = '0';
            return;
        }

        const rect = element.getBoundingClientRect();

        // Update overlay position
        Object.assign(overlay.style, {
            top: `${rect.top}px`,
            left: `${rect.left}px`,
            width: `${rect.width}px`,
            height: `${rect.height}px`,
            opacity: '1',
        });

        // Update label
        const tagName = element.tagName.toLowerCase();
        const id = element.id ? `#${element.id}` : '';
        label.textContent = `${tagName}${id}`;

        // Position label above element (or below if not enough space)
        const labelTop = rect.top > 30 ? rect.top - 26 : rect.bottom + 4;
        Object.assign(label.style, {
            top: `${labelTop}px`,
            left: `${rect.left}px`,
            opacity: '1',
        });
    }, []);

    // Handle mouse move
    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (isDisabled) return;

        const element = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;

        if (!element || shouldExclude(element)) {
            if (currentElementRef.current) {
                currentElementRef.current = null;
                updateHighlight(null);
                onHover(null);
            }
            return;
        }

        if (element !== currentElementRef.current) {
            currentElementRef.current = element;
            updateHighlight(element);

            const rect = element.getBoundingClientRect();
            onHover({
                element,
                tagName: element.tagName.toLowerCase(),
                id: element.id || null,
                classes: [...element.classList],
                width: Math.round(rect.width),
                height: Math.round(rect.height),
                rect,
            });
        }
    }, [isDisabled, shouldExclude, updateHighlight, onHover]);

    // Handle click
    const handleClick = useCallback((e: MouseEvent) => {
        if (isDisabled) return;

        const element = currentElementRef.current;
        if (element && !shouldExclude(element)) {
            e.preventDefault();
            e.stopPropagation();
            onSelect(element);
        }
    }, [isDisabled, shouldExclude, onSelect]);

    // Handle mouse leave (window)
    const handleMouseLeave = useCallback(() => {
        currentElementRef.current = null;
        updateHighlight(null);
        onHover(null);
    }, [updateHighlight, onHover]);

    // Attach event listeners
    useEffect(() => {
        document.addEventListener('mousemove', handleMouseMove, true);
        document.addEventListener('click', handleClick, true);
        document.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove, true);
            document.removeEventListener('click', handleClick, true);
            document.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, [handleMouseMove, handleClick, handleMouseLeave]);

    // No visual output - we use native DOM elements for performance
    return null;
});
