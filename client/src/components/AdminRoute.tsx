import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function AdminRoute() {
    const { loading, isAdmin } = useAuth();

    if (loading) {
        return (
            <div className="container page-shell">
                <div className="empty-state">正在验证管理员权限...</div>
            </div>
        );
    }

    return isAdmin ? <Outlet /> : <Navigate to="/login" replace />;
}
