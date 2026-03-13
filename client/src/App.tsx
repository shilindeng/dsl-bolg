import { Suspense, lazy } from 'react';
import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import AdminLayout from './components/AdminLayout';
import AdminRoute from './components/AdminRoute';
import AuthenticatedRoute from './components/AuthenticatedRoute';
import CommandPalette from './components/CommandPalette';
import Footer from './components/Footer';
import Navbar from './components/Navbar';
import ScrollManager from './components/ScrollManager';
import { ThemeProvider } from './hooks/useTheme';
import Home from './pages/Home';
import { ToastProvider } from './hooks/useToast';
import { useAuth } from './hooks/useAuth';

const Blog = lazy(() => import('./pages/Blog'));
const BlogPost = lazy(() => import('./pages/BlogPost'));
const Series = lazy(() => import('./pages/Series'));
const SeriesDetail = lazy(() => import('./pages/SeriesDetail'));
const Editor = lazy(() => import('./pages/Editor'));
const Projects = lazy(() => import('./pages/Projects'));
const ProjectDetail = lazy(() => import('./pages/ProjectDetail'));
const About = lazy(() => import('./pages/About'));
const Login = lazy(() => import('./pages/Login'));
const Newsletter = lazy(() => import('./pages/Newsletter'));
const NewsletterIssue = lazy(() => import('./pages/NewsletterIssue'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const NewsletterManager = lazy(() => import('./pages/admin/NewsletterManager'));
const HomepageManager = lazy(() => import('./pages/admin/HomepageManager'));
const SeriesManager = lazy(() => import('./pages/admin/SeriesManager'));
const NotFound = lazy(() => import('./pages/NotFound'));
const AccountLayout = lazy(() => import('./pages/account/AccountLayout'));
const AccountProfile = lazy(() => import('./pages/account/Profile'));
const AccountComments = lazy(() => import('./pages/account/Comments'));
const AccountBookmarks = lazy(() => import('./pages/account/Bookmarks'));
const AccountHistory = lazy(() => import('./pages/account/History'));

function RouteFallback() {
    return (
        <div className="container">
            <div className="empty-state">正在加载页面...</div>
        </div>
    );
}

function PublicLayout() {
    const { isAdmin, isAuthenticated } = useAuth();

    return (
        <div className="app-shell">
            <ScrollManager />
            <Navbar isAdmin={isAdmin} isAuthenticated={isAuthenticated} />
            <CommandPalette isAdmin={isAdmin} />

            <main className="page-shell">
                <Suspense fallback={<RouteFallback />}>
                    <Outlet />
                </Suspense>
            </main>

            <Footer />
        </div>
    );
}

function App() {
    return (
        <ThemeProvider>
            <ToastProvider>
                <Routes>
                    <Route element={<AdminRoute />}>
                        <Route element={<AdminLayout />}>
                            <Route path="/editor" element={<Editor />} />
                            <Route path="/editor/:slug" element={<Editor />} />
                            <Route path="/admin/dashboard" element={<Dashboard />} />
                            <Route path="/admin/newsletter" element={<NewsletterManager />} />
                            <Route path="/admin/homepage" element={<HomepageManager />} />
                            <Route path="/admin/series" element={<SeriesManager />} />
                            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
                        </Route>
                    </Route>

                    <Route element={<PublicLayout />}>
                        <Route path="/" element={<Home />} />
                        <Route path="/blog" element={<Blog />} />
                        <Route path="/blog/:slug" element={<BlogPost />} />
                        <Route path="/series" element={<Series />} />
                        <Route path="/series/:slug" element={<SeriesDetail />} />
                        <Route path="/projects" element={<Projects />} />
                        <Route path="/projects/:slug" element={<ProjectDetail />} />
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

                        <Route path="*" element={<NotFound />} />
                    </Route>
                </Routes>
            </ToastProvider>
        </ThemeProvider>
    );
}

export default App;
