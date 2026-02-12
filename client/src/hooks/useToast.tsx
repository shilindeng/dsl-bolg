import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useSound } from '../hooks/useSound';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
    id: number;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const { play } = useSound();

    const showToast = useCallback((message: string, type: ToastType) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);

        // Play sound based on type
        if (type === 'success') play('success');
        else if (type === 'error') play('error');
        else play('click');

        // Auto remove after 3s
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3000);
    }, [play]);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div style={{
                position: 'fixed',
                top: '20px',
                right: '20px',
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                pointerEvents: 'none' // Allow clicking through
            }}>
                {toasts.map(toast => (
                    <div key={toast.id} className={`cyber-toast toast-${toast.type} animate-slide-in-right`} style={{
                        pointerEvents: 'auto',
                        minWidth: '300px',
                        padding: '15px 20px',
                        background: 'rgba(10, 10, 15, 0.95)',
                        border: `1px solid ${toast.type === 'error' ? 'var(--accent-pink)' : 'var(--accent-cyan)'}`,
                        boxShadow: `0 0 15px ${toast.type === 'error' ? 'rgba(255, 60, 170, 0.3)' : 'rgba(0, 240, 255, 0.3)'}`,
                        color: toast.type === 'error' ? 'var(--accent-pink)' : 'var(--accent-cyan)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.9rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)',
                        backdropFilter: 'blur(5px)',
                    }}>
                        <span style={{ fontSize: '1.2rem' }}>
                            {toast.type === 'success' ? '✔' : toast.type === 'error' ? '✖' : 'ℹ'}
                        </span>
                        <div>
                            <div style={{ fontSize: '0.7rem', opacity: 0.7, marginBottom: '2px' }}>
                                [{toast.type.toUpperCase()}]
                            </div>
                            {toast.message}
                        </div>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}
