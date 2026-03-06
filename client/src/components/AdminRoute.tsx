import { Navigate, Outlet } from 'react-router-dom';
import { useState, useEffect } from 'react';

export default function AdminRoute() {
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const checkAdmin = async () => {
            const token = localStorage.getItem('auth_token');
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const res = await fetch('/api/auth/me', {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (res.ok) {
                    const user = await res.json();
                    if (user.role === 'admin') {
                        setIsAdmin(true);
                    }
                }
            } catch (error) {
                console.error('Admin check failed:', error);
            }

            setLoading(false);
        };

        checkAdmin();
    }, []);

    if (loading) return (
        <div style={{ padding: '50px', textAlign: 'center', color: 'var(--accent-cyan)' }}>
            [ VERIFYING_BIOMETRICS... ]
        </div>
    );

    return isAdmin ? <Outlet /> : <Navigate to="/login" replace />;
}
