import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import SiteIcon from '../components/SiteIcon';

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

const toastMeta = {
    success: {
        label: 'Success',
        icon: 'check',
    },
    error: {
        label: 'Error',
        icon: 'close',
    },
    info: {
        label: 'Info',
        icon: 'spark',
    },
} as const;

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

            <div className="toast-stack" aria-live="polite">
                {toasts.map((toast) => {
                    const meta = toastMeta[toast.type];

                    return (
                        <div key={toast.id} className={`toast-item is-${toast.type}`}>
                            <span className="toast-icon">
                                <SiteIcon name={meta.icon} size={14} />
                            </span>
                            <div className="toast-copy">
                                <strong>{meta.label}</strong>
                                <span>{toast.message}</span>
                            </div>
                        </div>
                    );
                })}
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
