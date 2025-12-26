/**
 * Ninja Panel - Content Script UI Component
 * 
 * The main control panel that appears when Visual Sniper is activated.
 * Features:
 * - Element highlighter (hover to select)
 * - Mode selection indicators
 * - Capture controls
 * - Exit button (ESC key)
 */

import { useState, useEffect, useCallback, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ElementHighlighter, type HighlightedElement } from './ElementHighlighter';
import { Toast } from './ui/Toast';

interface NinjaPanelProps {
    onClose: () => void;
}

interface ToastState {
    visible: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
}

export const NinjaPanel = memo(function NinjaPanel({ onClose }: NinjaPanelProps) {
    const [hoveredElement, setHoveredElement] = useState<HighlightedElement | null>(null);
    const [isCapturing, setIsCapturing] = useState(false);
    const [toast, setToast] = useState<ToastState>({ visible: false, message: '', type: 'info' });
    const panelRef = useRef<HTMLDivElement>(null);

    // Handle ESC key to close
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    // Show toast notification
    const showToast = useCallback((message: string, type: ToastState['type'] = 'info') => {
        setToast({ visible: true, message, type });
        setTimeout(() => setToast((prev) => ({ ...prev, visible: false })), 3000);
    }, []);

    // Handle element selection
    const handleElementSelect = useCallback(async (element: HTMLElement) => {
        setIsCapturing(true);

        try {
            // TODO: Implement extraction logic with StyleHydrator
            const html = element.outerHTML;

            // Copy to clipboard
            await navigator.clipboard.writeText(html);

            showToast('✅ Элемент скопирован в буфер обмена!', 'success');

            // Close panel after short delay
            setTimeout(onClose, 1500);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Не удалось захватить элемент';
            showToast(`❌ ${message}`, 'error');
        } finally {
            setIsCapturing(false);
        }
    }, [onClose, showToast]);

    return (
        <>
            {/* Element Highlighter */}
            <ElementHighlighter
                onHover={setHoveredElement}
                onSelect={handleElementSelect}
                isDisabled={isCapturing}
                excludeRef={panelRef}
            />

            {/* Control Panel */}
            <motion.div
                ref={panelRef}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                style={{
                    position: 'fixed',
                    top: '16px',
                    right: '16px',
                    width: '280px',
                    background: 'linear-gradient(135deg, rgba(15, 15, 15, 0.95), rgba(26, 26, 26, 0.95))',
                    backdropFilter: 'blur(20px)',
                    borderRadius: '16px',
                    padding: '16px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(99, 102, 241, 0.2)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
            >
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '20px' }}>🎯</span>
                        <span style={{ fontWeight: 600, color: '#fff' }}>Выбор элемента</span>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '8px',
                            border: 'none',
                            background: 'rgba(255, 255, 255, 0.1)',
                            color: '#a3a3a3',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '14px',
                            transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                            e.currentTarget.style.color = '#ef4444';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                            e.currentTarget.style.color = '#a3a3a3';
                        }}
                    >
                        ✕
                    </button>
                </div>

                {/* Instructions */}
                <div
                    style={{
                        padding: '12px',
                        borderRadius: '10px',
                        background: 'rgba(99, 102, 241, 0.1)',
                        marginBottom: '12px',
                    }}
                >
                    <p style={{ fontSize: '12px', color: '#a3a3a3', margin: 0 }}>
                        <strong style={{ color: '#6366f1' }}>Наведите</strong> для выделения элементов
                        <br />
                        <strong style={{ color: '#6366f1' }}>Кликните</strong> для захвата
                        <br />
                        <strong style={{ color: '#6366f1' }}>ESC</strong> для закрытия
                    </p>
                </div>

                {/* Hovered Element Info */}
                <AnimatePresence mode="wait">
                    {hoveredElement && (
                        <motion.div
                            key={hoveredElement.tagName}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            style={{
                                padding: '10px',
                                borderRadius: '10px',
                                background: 'rgba(255, 255, 255, 0.05)',
                                overflow: 'hidden',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                <span
                                    style={{
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        background: 'rgba(34, 211, 238, 0.2)',
                                        color: '#22d3ee',
                                        fontSize: '11px',
                                        fontWeight: 600,
                                        fontFamily: 'monospace',
                                    }}
                                >
                                    {hoveredElement.tagName}
                                </span>
                                {hoveredElement.id && (
                                    <span
                                        style={{
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            background: 'rgba(245, 158, 11, 0.2)',
                                            color: '#f59e0b',
                                            fontSize: '11px',
                                            fontFamily: 'monospace',
                                        }}
                                    >
                                        #{hoveredElement.id}
                                    </span>
                                )}
                            </div>
                            {hoveredElement.classes.length > 0 && (
                                <div
                                    style={{
                                        fontSize: '10px',
                                        color: '#737373',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        fontFamily: 'monospace',
                                    }}
                                >
                                    .{hoveredElement.classes.slice(0, 3).join(' .')}
                                    {hoveredElement.classes.length > 3 && ` +${hoveredElement.classes.length - 3}`}
                                </div>
                            )}
                            <div style={{ fontSize: '10px', color: '#525252', marginTop: '4px' }}>
                                {hoveredElement.width}×{hoveredElement.height}px
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Processing indicator */}
                {isCapturing && (
                    <div
                        style={{
                            marginTop: '12px',
                            padding: '10px',
                            borderRadius: '10px',
                            background: 'rgba(16, 185, 129, 0.1)',
                            textAlign: 'center',
                            fontSize: '12px',
                            color: '#10b981',
                        }}
                    >
                        ⏳ Захват элемента...
                    </div>
                )}
            </motion.div>

            {/* Toast Notifications */}
            <Toast visible={toast.visible} message={toast.message} type={toast.type} />
        </>
    );
});
