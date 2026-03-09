import {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from 'react';
import { fetchCurrentUser, logout as logoutRequest, type User } from '../api/client';

interface AuthContextValue {
    user: User | null;
    loading: boolean;
    isAuthenticated: boolean;
    isAdmin: boolean;
    setSession: (input: { token: string; user: User }) => void;
    clearSession: () => void;
    refreshUser: () => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredUser() {
    const raw = localStorage.getItem('auth_user');
    if (!raw) return null;

    try {
        return JSON.parse(raw) as User;
    } catch {
        return null;
    }
}

function clearStoredSession() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(readStoredUser);
    const [loading, setLoading] = useState(true);

    const clearSession = () => {
        clearStoredSession();
        setUser(null);
        window.dispatchEvent(new Event('auth-change'));
    };

    const refreshUser = async () => {
        const token = localStorage.getItem('auth_token');
        if (!token) {
            setUser(null);
            return;
        }

        try {
            const nextUser = await fetchCurrentUser();
            localStorage.setItem('auth_user', JSON.stringify(nextUser));
            setUser(nextUser);
        } catch {
            clearStoredSession();
            setUser(null);
        }
    };

    useEffect(() => {
        refreshUser().finally(() => setLoading(false));

        const sync = () => {
            setUser(readStoredUser());
        };

        window.addEventListener('auth-change', sync);
        window.addEventListener('storage', sync);
        return () => {
            window.removeEventListener('auth-change', sync);
            window.removeEventListener('storage', sync);
        };
    }, []);

    const value = useMemo<AuthContextValue>(() => ({
        user,
        loading,
        isAuthenticated: Boolean(user),
        isAdmin: user?.role === 'admin',
        setSession: ({ token, user: nextUser }) => {
            localStorage.setItem('auth_token', token);
            localStorage.setItem('auth_user', JSON.stringify(nextUser));
            setUser(nextUser);
            window.dispatchEvent(new Event('auth-change'));
        },
        clearSession,
        refreshUser,
        logout: async () => {
            try {
                await logoutRequest();
            } catch {
                // Client-side session invalidation is the source of truth.
            }
            clearSession();
        },
    }), [user, loading]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
