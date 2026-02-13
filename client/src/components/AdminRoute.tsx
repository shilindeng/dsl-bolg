import { Navigate, Outlet } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function AdminRoute() {
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            // Simple email check for now. Ideally use Role or Custom Claim.
            if (user?.email === 'admin@example.com') {
                setIsAdmin(true);
            }
            setLoading(false);
        });
    }, []);

    if (loading) return (
        <div style={{ padding: '50px', textAlign: 'center', color: 'var(--accent-cyan)' }}>
            [ VERIFYING_BIOMETRICS... ]
        </div>
    );

    return isAdmin ? <Outlet /> : <Navigate to="/login" replace />;
}
