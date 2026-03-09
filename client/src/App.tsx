import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import AdminRoute from './components/AdminRoute';
import AuthenticatedRoute from './components/AuthenticatedRoute';
import { ThemeProvider } from './hooks/useTheme';
import { ToastProvider } from './hooks/useToast';
import { useAuth } from './hooks/useAuth';

const Blog = lazy(() => import('./pages/Blog'));
const BlogPost = lazy(() => import('./pages/BlogPost'));
const Editor = lazy(() => import('./pages/Editor'));
const Projects = lazy(() => import('./pages/Projects'));
const About = lazy(() => import('./pages/About'));
const Login = lazy(() => import('./pages/Login'));
const Newsletter = lazy(() => import('./pages/Newsletter'));
const NewsletterIssue = lazy(() => import('./pages/NewsletterIssue'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const NewsletterManager = lazy(() => import('./pages/admin/NewsletterManager'));
const HomepageManager = lazy(() => import('./pages/admin/HomepageManager'));
const NotFound = lazy(() => import('./pages/NotFound'));
const AccountLayout = lazy(() => import('./pages/account/AccountLayout'));
const AccountProfile = lazy(() => import('./pages/account/Profile'));
const AccountComments = lazy(() => import('./pages/account/Comments'));
const AccountBookmarks = lazy(() => import('./pages/account/Bookmarks'));
const AccountHistory = lazy(() => import('./pages/account/History'));

function App() {
    const { isAdmin, isAuthenticated } = useAuth();

    return (
        <ThemeProvider>
            <ToastProvider>
                <div className="app-shell">
                    <Navbar isAdmin={isAdmin} isAuthenticated={isAuthenticated} />

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
                                <Route path="/newsletter" element={<Newsletter />} />
                                <Route path="/newsletter/:slug" element={<NewsletterIssue />} />
                                <Route path="/login" element={<Login />} />

                                <Route element={<AuthenticatedRoute />}>
                                    <Route path="/account" element={<AccountLayout />}>
                                        <Route index element={<AccountProfile />} />
                                        <Route path="comments" element={<AccountComments />} />
                                        <Route path="bookmarks" element={<AccountBookmarks />} />
                                        <Route path="history" element={<AccountHistory />} />
                                    </Route>
                                </Route>

                                <Route element={<AdminRoute />}>
                                    <Route path="/editor" element={<Editor />} />
                                    <Route path="/editor/:slug" element={<Editor />} />
                                    <Route path="/admin/dashboard" element={<Dashboard />} />
                                    <Route path="/admin/newsletter" element={<NewsletterManager />} />
                                    <Route path="/admin/homepage" element={<HomepageManager />} />
                                </Route>

                                <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
                                <Route path="*" element={<NotFound />} />
                            </Routes>
                        </Suspense>
                    </main>

                    <Footer />
                </div>
            </ToastProvider>
        </ThemeProvider>
    );
}

export default App;
