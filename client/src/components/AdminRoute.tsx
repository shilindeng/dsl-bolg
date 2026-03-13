import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function AdminRoute() {
    const { loading, isAdmin } = useAuth();

    if (loading) {
        return (
            <section className="section">
                <div className="container">
                    <div className="empty-state">正在验证管理员权限...</div>
                </div>
            </section>
        );
    }

    return isAdmin ? <Outlet /> : <Navigate to="/login" replace />;
}
