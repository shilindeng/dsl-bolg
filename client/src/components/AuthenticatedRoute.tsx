import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function AuthenticatedRoute() {
    const { loading, isAuthenticated } = useAuth();

    if (loading) {
        return (
            <div className="container page-shell">
                <div className="empty-state">正在验证登录状态...</div>
            </div>
        );
    }

    return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}
