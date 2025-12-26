/**
 * Ninja Panel - Content Script UI Component
 *
 * The main control panel that appears when Visual Sniper is activated.
 * Features:
 * - Element highlighter (hover to select)
 * - Mode selection (Copy/Download)
 * - Asset download with progress
 * - Exit button (ESC key)
 */

import { useState, useEffect, useCallback, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ElementHighlighter, type HighlightedElement } from './ElementHighlighter';
import { Toast } from './ui/Toast';
import { DownloadProgress } from './DownloadProgress';
import { scanDocument } from '@/modules/AssetScanner';
import { ZipBuilder } from '@/modules/ZipBuilder';
import { getStyledHtml } from '@/modules/StyleExtractor';
import { extractStylesheets, buildExtractedCSS } from '@/modules/StylesheetExtractor';
import type { Asset, FetchAssetResponse } from '@/types/assets';

// ============================================================================
// Types
// ============================================================================

interface NinjaPanelProps {
    onClose: () => void;
}

interface ToastState {
    visible: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
}

interface DownloadState {
    active: boolean;
    current: number;
    total: number;
    currentAsset: string;
    cancelled: boolean;
}

type CaptureMode = 'copy' | 'download';

// ============================================================================
// Main Component
// ============================================================================

export const NinjaPanel = memo(function NinjaPanel({ onClose }: NinjaPanelProps) {
    const [hoveredElement, setHoveredElement] = useState<HighlightedElement | null>(null);
    const [isCapturing, setIsCapturing] = useState(false);
    const [captureMode, setCaptureMode] = useState<CaptureMode>('copy');
    const [toast, setToast] = useState<ToastState>({ visible: false, message: '', type: 'info' });
    const [download, setDownload] = useState<DownloadState>({
        active: false,
        current: 0,
        total: 0,
        currentAsset: '',
        cancelled: false,
    });

    const panelRef = useRef<HTMLDivElement>(null);
    const downloadCancelledRef = useRef(false);

    // Handle ESC key to close
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (download.active) {
                    handleCancelDownload();
                } else {
                    onClose();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose, download.active]);

    // Show toast notification
    const showToast = useCallback((message: string, type: ToastState['type'] = 'info') => {
        setToast({ visible: true, message, type });
        setTimeout(() => setToast((prev) => ({ ...prev, visible: false })), 3000);
    }, []);

    // Cancel download
    const handleCancelDownload = useCallback(() => {
        downloadCancelledRef.current = true;
        setDownload((prev) => ({ ...prev, cancelled: true, active: false }));
        showToast('❌ Загрузка отменена', 'info');
    }, [showToast]);

    // Copy HTML to clipboard
    const handleCopyHtml = useCallback(
        async (element: HTMLElement) => {
            try {
                const html = element.outerHTML;
                await navigator.clipboard.writeText(html);
                showToast('✅ HTML скопирован в буфер обмена!', 'success');
                setTimeout(onClose, 1000);
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Не удалось скопировать';
                showToast(`❌ ${message}`, 'error');
            }
        },
        [onClose, showToast]
    );

    // Download as ZIP with assets
    const handleDownloadZip = useCallback(
        async (element: HTMLElement) => {
            downloadCancelledRef.current = false;

            try {
                // Step 1: Scan for assets
                showToast('🔍 Сканирование ассетов...', 'info');
                const scanResult = scanDocument(element);
                const assets = scanResult.assets;

                if (assets.length === 0) {
                    // No assets - just create HTML-only ZIP
                    const builder = new ZipBuilder();
                    builder.setHtml(element.outerHTML);
                    builder.setCss('/* No external styles */');

                    const blob = await builder.generate();
                    await triggerDownload(blob);

                    showToast('✅ ZIP скачан (без ассетов)', 'success');
                    setTimeout(onClose, 1500);
                    return;
                }

                // Step 2: Start downloading assets
                setDownload({
                    active: true,
                    current: 0,
                    total: assets.length,
                    currentAsset: '',
                    cancelled: false,
                });

                const builder = new ZipBuilder();
                let successCount = 0;
                let failCount = 0;

                for (let i = 0; i < assets.length; i++) {
                    // Check for cancellation
                    if (downloadCancelledRef.current) {
                        return;
                    }

                    const asset = assets[i];

                    setDownload((prev) => ({
                        ...prev,
                        current: i + 1,
                        currentAsset: getAssetDisplayName(asset),
                    }));

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
                            console.warn('[NinjaPanel] Failed to fetch:', asset.originalUrl);
                            failCount++;
                        }
                    } catch (error) {
                        console.error('[NinjaPanel] Asset fetch error:', error);
                        failCount++;
                    }
                }

                // Step 3: Add HTML and generate ZIP
                if (downloadCancelledRef.current) {
                    return;
                }

                setDownload((prev) => ({
                    ...prev,
                    currentAsset: 'Извлечение стилей...',
                }));

                // Extract HTML with injected classes and computed CSS
                const { html, css: computedCss } = getStyledHtml(element);

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

                const blob = await builder.generate();

                // Step 4: Trigger download
                await triggerDownload(blob);

                setDownload((prev) => ({ ...prev, active: false }));

                // Show result
                if (failCount > 0) {
                    showToast(
                        `✅ ZIP скачан (${successCount} ассетов, ${failCount} пропущено)`,
                        'success'
                    );
                } else {
                    showToast(`✅ ZIP скачан (${successCount} ассетов)`, 'success');
                }

                setTimeout(onClose, 1500);
            } catch (error) {
                setDownload((prev) => ({ ...prev, active: false }));
                const message = error instanceof Error ? error.message : 'Не удалось создать ZIP';
                showToast(`❌ ${message}`, 'error');
            }
        },
        [onClose, showToast]
    );

    // Handle element selection based on mode
    const handleElementSelect = useCallback(
        async (element: HTMLElement) => {
            if (isCapturing || download.active) return;

            setIsCapturing(true);

            try {
                if (captureMode === 'copy') {
                    await handleCopyHtml(element);
                } else {
                    await handleDownloadZip(element);
                }
            } finally {
                setIsCapturing(false);
            }
        },
        [isCapturing, download.active, captureMode, handleCopyHtml, handleDownloadZip]
    );

    return (
        <>
            {/* Element Highlighter */}
            <ElementHighlighter
                onHover={setHoveredElement}
                onSelect={handleElementSelect}
                isDisabled={isCapturing || download.active}
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
                        disabled={download.active}
                        style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '8px',
                            border: 'none',
                            background: 'rgba(255, 255, 255, 0.1)',
                            color: '#a3a3a3',
                            cursor: download.active ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '14px',
                            transition: 'all 0.2s',
                            opacity: download.active ? 0.5 : 1,
                        }}
                        onMouseEnter={(e) => {
                            if (!download.active) {
                                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                                e.currentTarget.style.color = '#ef4444';
                            }
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                            e.currentTarget.style.color = '#a3a3a3';
                        }}
                    >
                        ✕
                    </button>
                </div>

                {/* Mode Toggle */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    <ModeButton
                        active={captureMode === 'copy'}
                        onClick={() => setCaptureMode('copy')}
                        disabled={download.active}
                    >
                        📋 Копировать
                    </ModeButton>
                    <ModeButton
                        active={captureMode === 'download'}
                        onClick={() => setCaptureMode('download')}
                        disabled={download.active}
                    >
                        📦 Скачать ZIP
                    </ModeButton>
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
                        <strong style={{ color: '#6366f1' }}>Наведите</strong> для выделения
                        <br />
                        <strong style={{ color: '#6366f1' }}>Кликните</strong> для{' '}
                        {captureMode === 'copy' ? 'копирования' : 'скачивания'}
                        <br />
                        <strong style={{ color: '#6366f1' }}>ESC</strong> для закрытия
                    </p>
                </div>

                {/* Hovered Element Info */}
                <AnimatePresence mode="wait">
                    {hoveredElement && !download.active && (
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
                {isCapturing && !download.active && (
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

            {/* Download Progress */}
            <AnimatePresence>
                {download.active && (
                    <DownloadProgress
                        current={download.current}
                        total={download.total}
                        currentAsset={download.currentAsset}
                        onCancel={handleCancelDownload}
                    />
                )}
            </AnimatePresence>

            {/* Toast Notifications */}
            <Toast visible={toast.visible} message={toast.message} type={toast.type} />
        </>
    );
});

// ============================================================================
// Sub-components
// ============================================================================

interface ModeButtonProps {
    active: boolean;
    onClick: () => void;
    disabled?: boolean;
    children: React.ReactNode;
}

function ModeButton({ active, onClick, disabled, children }: ModeButtonProps) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '8px',
                border: 'none',
                background: active ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                color: active ? '#6366f1' : '#a3a3a3',
                fontSize: '12px',
                fontWeight: 500,
                cursor: disabled ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                opacity: disabled ? 0.5 : 1,
            }}
        >
            {children}
        </button>
    );
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Trigger file download directly in content script
 * Using a click on a download link instead of messaging (avoids ArrayBuffer transfer issues)
 */
async function triggerDownload(blob: Blob): Promise<void> {
    const filename = `ninja-export-${Date.now()}.zip`;
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

    console.log('[NinjaPanel] Download triggered:', filename);
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

