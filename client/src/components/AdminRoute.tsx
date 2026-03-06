import { Navigate, Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { fetchCurrentUser } from '../api/client';

export default function AdminRoute() {
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        let cancelled = false;

        async function verifyAdmin() {
            const token = localStorage.getItem('auth_token');
            if (!token) {
                if (!cancelled) setLoading(false);
                return;
            }

            try {
                const user = await fetchCurrentUser();
                if (!cancelled) {
                    setIsAdmin(user.role === 'admin');
                }
            } catch {
                if (!cancelled) {
                    setIsAdmin(false);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        verifyAdmin();
        return () => {
            cancelled = true;
        };
    }, []);

    if (loading) {
        return (
            <div className="container page-shell">
                <div className="empty-state">正在验证管理员权限...</div>
            </div>
        );
    }

    return isAdmin ? <Outlet /> : <Navigate to="/login" replace />;
}
