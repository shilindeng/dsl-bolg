import { Suspense, lazy, useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import AdminRoute from './components/AdminRoute';
import { ThemeProvider } from './hooks/useTheme';
import { ToastProvider } from './hooks/useToast';
import CommandPalette from './components/CommandPalette';

const Blog = lazy(() => import('./pages/Blog'));
const BlogPost = lazy(() => import('./pages/BlogPost'));
const Editor = lazy(() => import('./pages/Editor'));
const Projects = lazy(() => import('./pages/Projects'));
const About = lazy(() => import('./pages/About'));
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const NotFound = lazy(() => import('./pages/NotFound'));

function readAdminState() {
    const raw = localStorage.getItem('auth_user');
    if (!raw) return false;

    try {
        const user = JSON.parse(raw) as { role?: string };
        return user.role === 'admin';
    } catch {
        return false;
    }
}

function App() {
    const [isAdmin, setIsAdmin] = useState(readAdminState);

    useEffect(() => {
        const syncAuth = () => setIsAdmin(readAdminState());

        window.addEventListener('auth-change', syncAuth);
        window.addEventListener('storage', syncAuth);
        return () => {
            window.removeEventListener('auth-change', syncAuth);
            window.removeEventListener('storage', syncAuth);
        };
    }, []);

    return (
        <ThemeProvider>
            <ToastProvider>
                <div className="app-shell">
                    <Navbar isAdmin={isAdmin} />

                    <main className="page-shell">
                        <Suspense
                            fallback={
                                <div className="container">
                                    <div className="empty-state">正在加载页面...</div>
                                </div>
                            }
                        >
                            <Routes>
                                <Route path="/" element={<Home />} />
                                <Route path="/blog" element={<Blog />} />
                                <Route path="/blog/:slug" element={<BlogPost />} />
                                <Route path="/projects" element={<Projects />} />
                                <Route path="/about" element={<About />} />
                                <Route path="/login" element={<Login />} />

                                <Route element={<AdminRoute />}>
                                    <Route path="/editor" element={<Editor />} />
                                    <Route path="/editor/:slug" element={<Editor />} />
                                    <Route path="/admin/dashboard" element={<Dashboard />} />
                                </Route>

                                <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
                                <Route path="*" element={<NotFound />} />
                            </Routes>
                        </Suspense>
                    </main>

                    <Footer />
                    <CommandPalette isAdmin={isAdmin} />
                </div>
            </ToastProvider>
        </ThemeProvider>
    );
}

export default App;
