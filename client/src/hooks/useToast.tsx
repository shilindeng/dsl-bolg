import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
    id: number;
    message: string;
    type: ToastType;
}

interface ToastContextValue {
    showToast: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType) => {
        const id = Date.now();
        setToasts((current) => [...current, { id, message, type }]);

        window.setTimeout(() => {
            setToasts((current) => current.filter((toast) => toast.id !== id));
        }, 3200);
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}

            <div
                aria-live="polite"
                style={{
                    position: 'fixed',
                    right: 16,
                    bottom: 16,
                    zIndex: 2500,
                    display: 'grid',
                    gap: '0.75rem',
                    width: 'min(360px, calc(100vw - 2rem))',
                }}
            >
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className="panel"
                        style={{
                            borderColor:
                                toast.type === 'error'
                                    ? 'rgba(255,124,168,0.38)'
                                    : toast.type === 'success'
                                        ? 'rgba(126,247,200,0.32)'
                                        : undefined,
                        }}
                    >
                        <div className="panel-body" style={{ padding: '1rem 1.1rem', display: 'grid', gap: '0.35rem' }}>
                            <strong style={{ color: toast.type === 'error' ? 'var(--accent-rose)' : toast.type === 'success' ? 'var(--accent-emerald)' : 'var(--accent-cyan)' }}>
                                {toast.type === 'error' ? 'Error' : toast.type === 'success' ? 'Success' : 'Info'}
                            </strong>
                            <span className="muted">{toast.message}</span>
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
