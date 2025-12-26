/**
 * Download Progress Component
 *
 * Shows progress indicator when downloading assets for ZIP bundle.
 */

import { memo } from 'react';
import { motion } from 'framer-motion';

export interface DownloadProgressProps {
    /** Current asset index (1-based) */
    current: number;
    /** Total number of assets */
    total: number;
    /** Current asset name/path being downloaded */
    currentAsset: string;
    /** Optional cancel callback */
    onCancel?: () => void;
}

/**
 * Progress indicator for asset downloads
 */
export const DownloadProgress = memo(function DownloadProgress({
    current,
    total,
    currentAsset,
    onCancel,
}: DownloadProgressProps) {
    const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            style={{
                position: 'fixed',
                bottom: '16px',
                right: '16px',
                width: '300px',
                padding: '16px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
                zIndex: 2147483646,
            }}
        >
            {/* Header */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '12px',
                }}
            >
                <span
                    style={{
                        fontSize: '14px',
                        fontWeight: 600,
                        color: '#ffffff',
                    }}
                >
                    📦 Загрузка ассетов
                </span>
                <span
                    style={{
                        fontSize: '12px',
                        color: '#a3a3a3',
                        fontFamily: 'monospace',
                    }}
                >
                    {current}/{total}
                </span>
            </div>

            {/* Progress Bar */}
            <div
                style={{
                    height: '8px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    marginBottom: '10px',
                }}
            >
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    style={{
                        height: '100%',
                        background: 'linear-gradient(90deg, #6366f1 0%, #22d3ee 100%)',
                        borderRadius: '4px',
                    }}
                />
            </div>

            {/* Current Asset */}
            <p
                style={{
                    fontSize: '11px',
                    color: '#737373',
                    margin: 0,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    fontFamily: 'monospace',
                }}
                title={currentAsset}
            >
                {currentAsset || 'Подготовка...'}
            </p>

            {/* Cancel Button */}
            {onCancel && (
                <button
                    onClick={onCancel}
                    style={{
                        marginTop: '12px',
                        width: '100%',
                        padding: '8px',
                        borderRadius: '6px',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: '#ef4444',
                        fontSize: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                    }}
                >
                    Отмена
                </button>
            )}

            {/* Percentage Label */}
            <div
                style={{
                    position: 'absolute',
                    top: '16px',
                    right: '80px',
                    fontSize: '12px',
                    color: '#6366f1',
                    fontWeight: 600,
                }}
            >
                {percentage}%
            </div>
        </motion.div>
    );
});
