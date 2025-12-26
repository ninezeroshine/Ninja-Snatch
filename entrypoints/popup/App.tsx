/**
 * Ninja Snatch - Popup Application
 * 
 * Main popup interface for the extension.
 * Features:
 * - Visual Sniper activation
 * - Full page capture
 * - Mode selection (clean/styled/smart)
 * - Settings management
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Extraction modes
type ExtractionMode = 'clean' | 'styled' | 'smart';

// Output action
type OutputAction = 'copy' | 'download';

interface AppState {
    mode: ExtractionMode;
    action: OutputAction;
    isProcessing: boolean;
    status: string | null;
}

export default function App() {
    const [state, setState] = useState<AppState>({
        mode: 'styled',
        action: 'copy',
        isProcessing: false,
        status: null,
    });

    // Handle Visual Sniper activation
    const handleVisualSniper = useCallback(async () => {
        setState((prev) => ({ ...prev, isProcessing: true, status: 'Активация...' }));

        try {
            const [tab] = await browser.tabs.query({ active: true, currentWindow: true });

            if (!tab?.id) {
                throw new Error('Активная вкладка не найдена');
            }

            // Inject content script and activate sniper mode
            await browser.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['content-scripts/content.js'],
            });

            // Close popup after activation
            window.close();
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Неизвестная ошибка';
            setState((prev) => ({ ...prev, isProcessing: false, status: `Ошибка: ${message}` }));
        }
    }, []);

    // Handle full page capture
    const handleFullPage = useCallback(async () => {
        setState((prev) => ({ ...prev, isProcessing: true, status: 'Захват страницы...' }));

        try {
            const [tab] = await browser.tabs.query({ active: true, currentWindow: true });

            if (!tab?.id) {
                throw new Error('Активная вкладка не найдена');
            }

            // TODO: Implement full page capture
            setState((prev) => ({ ...prev, status: 'Скачивание страницы скоро будет доступно...' }));

            setTimeout(() => {
                setState((prev) => ({ ...prev, isProcessing: false, status: null }));
            }, 2000);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Неизвестная ошибка';
            setState((prev) => ({ ...prev, isProcessing: false, status: `Ошибка: ${message}` }));
        }
    }, []);

    return (
        <div className="ninja-container w-[320px] min-h-[400px] bg-[var(--ninja-bg-dark)] p-4">
            {/* Header */}
            <header className="flex items-center gap-3 mb-6">
                <div className="text-3xl">🥷</div>
                <div>
                    <h1 className="text-xl font-bold text-white">Ninja Snatch</h1>
                    <p className="text-xs text-[var(--ninja-text-secondary)]">v2.0 — Pixel Perfect</p>
                </div>
            </header>

            {/* Output Action Toggle */}
            <div className="flex gap-2 mb-6">
                <ActionButton
                    active={state.action === 'copy'}
                    onClick={() => setState((prev) => ({ ...prev, action: 'copy' }))}
                >
                    📋 Копировать
                </ActionButton>
                <ActionButton
                    active={state.action === 'download'}
                    onClick={() => setState((prev) => ({ ...prev, action: 'download' }))}
                >
                    📥 Скачать
                </ActionButton>
            </div>

            {/* Mode Selection */}
            <section className="mb-6">
                <h2 className="text-sm font-medium text-[var(--ninja-text-secondary)] mb-3 uppercase tracking-wider">
                    Режим извлечения
                </h2>
                <div className="space-y-2">
                    <ModeOption
                        mode="clean"
                        label="Чистый HTML"
                        description="HTML без стилей"
                        selected={state.mode === 'clean'}
                        onClick={() => setState((prev) => ({ ...prev, mode: 'clean' }))}
                    />
                    <ModeOption
                        mode="styled"
                        label="Со стилями"
                        description="HTML + весь CSS сохранён"
                        selected={state.mode === 'styled'}
                        onClick={() => setState((prev) => ({ ...prev, mode: 'styled' }))}
                    />
                    <ModeOption
                        mode="smart"
                        label="Умное извлечение"
                        description="Оптимизированный Tailwind код"
                        badge="✨"
                        selected={state.mode === 'smart'}
                        onClick={() => setState((prev) => ({ ...prev, mode: 'smart' }))}
                    />
                </div>
            </section>

            {/* Action Buttons */}
            <div className="space-y-3">
                <PrimaryButton
                    onClick={handleVisualSniper}
                    disabled={state.isProcessing}
                >
                    🎯 Выбор элемента
                </PrimaryButton>
                <SecondaryButton
                    onClick={handleFullPage}
                    disabled={state.isProcessing}
                >
                    📄 Вся страница
                </SecondaryButton>
            </div>

            {/* Status Message */}
            <AnimatePresence>
                {state.status && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mt-4 p-3 rounded-lg bg-[var(--ninja-bg-elevated)] text-sm text-center"
                    >
                        {state.status}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ============================================================================
// Sub-components
// ============================================================================

interface ActionButtonProps {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
}

function ActionButton({ active, onClick, children }: ActionButtonProps) {
    return (
        <button
            onClick={onClick}
            className={`
        flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200
        ${active
                    ? 'bg-[var(--ninja-primary)] text-white shadow-lg shadow-[var(--ninja-primary)]/25'
                    : 'bg-[var(--ninja-bg-elevated)] text-[var(--ninja-text-secondary)] hover:bg-[var(--ninja-bg-card)]'
                }
      `}
        >
            {children}
        </button>
    );
}

interface ModeOptionProps {
    mode: string;
    label: string;
    description: string;
    badge?: string;
    selected: boolean;
    onClick: () => void;
}

function ModeOption({ label, description, badge, selected, onClick }: ModeOptionProps) {
    return (
        <button
            onClick={onClick}
            className={`
        w-full p-3 rounded-xl text-left transition-all duration-200
        ${selected
                    ? 'bg-[var(--ninja-primary)]/10 border-2 border-[var(--ninja-primary)] shadow-lg shadow-[var(--ninja-primary)]/10'
                    : 'bg-[var(--ninja-bg-card)] border-2 border-transparent hover:border-[var(--ninja-border)]'
                }
      `}
        >
            <div className="flex items-center gap-2">
                <span className="font-medium text-white">{label}</span>
                {badge && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--ninja-accent)]/20 text-[var(--ninja-accent)]">
                        {badge}
                    </span>
                )}
            </div>
            <p className="text-xs text-[var(--ninja-text-secondary)] mt-0.5">{description}</p>
        </button>
    );
}

interface ButtonProps {
    onClick: () => void;
    disabled?: boolean;
    children: React.ReactNode;
}

function PrimaryButton({ onClick, disabled, children }: ButtonProps) {
    return (
        <motion.button
            onClick={onClick}
            disabled={disabled}
            whileHover={{ scale: disabled ? 1 : 1.02 }}
            whileTap={{ scale: disabled ? 1 : 0.98 }}
            className={`
        w-full py-3 px-4 rounded-xl font-semibold text-white transition-all duration-200
        bg-gradient-to-r from-[var(--ninja-primary)] to-[var(--ninja-accent)]
        shadow-lg shadow-[var(--ninja-primary)]/30
        hover:shadow-xl hover:shadow-[var(--ninja-primary)]/40
        disabled:opacity-50 disabled:cursor-not-allowed
      `}
        >
            {children}
        </motion.button>
    );
}

function SecondaryButton({ onClick, disabled, children }: ButtonProps) {
    return (
        <motion.button
            onClick={onClick}
            disabled={disabled}
            whileHover={{ scale: disabled ? 1 : 1.02 }}
            whileTap={{ scale: disabled ? 1 : 0.98 }}
            className={`
        w-full py-3 px-4 rounded-xl font-medium transition-all duration-200
        bg-[var(--ninja-bg-elevated)] text-[var(--ninja-text-primary)]
        border border-[var(--ninja-border)]
        hover:bg-[var(--ninja-bg-card)] hover:border-[var(--ninja-text-secondary)]
        disabled:opacity-50 disabled:cursor-not-allowed
      `}
        >
            {children}
        </motion.button>
    );
}
