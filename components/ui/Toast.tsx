/**
 * Toast Notification Component
 * 
 * Shows temporary feedback messages to the user.
 */

import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ToastProps {
    visible: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
}

const typeStyles = {
    success: {
        background: 'rgba(16, 185, 129, 0.95)',
        border: '1px solid rgba(16, 185, 129, 0.5)',
    },
    error: {
        background: 'rgba(239, 68, 68, 0.95)',
        border: '1px solid rgba(239, 68, 68, 0.5)',
    },
    info: {
        background: 'rgba(99, 102, 241, 0.95)',
        border: '1px solid rgba(99, 102, 241, 0.5)',
    },
};

export const Toast = memo(function Toast({ visible, message, type }: ToastProps) {
    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    transition={{
                        type: 'spring',
                        damping: 20,
                        stiffness: 300,
                    }}
                    style={{
                        position: 'fixed',
                        bottom: '24px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        padding: '12px 20px',
                        borderRadius: '12px',
                        color: '#ffffff',
                        fontSize: '14px',
                        fontWeight: 500,
                        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
                        backdropFilter: 'blur(10px)',
                        zIndex: 2147483647,
                        ...typeStyles[type],
                    }}
                >
                    {message}
                </motion.div>
            )}
        </AnimatePresence>
    );
});
