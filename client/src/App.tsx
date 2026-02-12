import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import Editor from './pages/Editor';
import Projects from './pages/Projects';
import About from './pages/About';
import { ThemeProvider } from './hooks/useTheme';
import { ToastProvider } from './hooks/useToast';
import CRTOverlay from './components/CRTOverlay';

function App() {
    return (
        <ThemeProvider>
            <ToastProvider>
                <div className="app" style={{
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative'
                }}>
                    <CRTOverlay />
                    <Navbar />

                    <main style={{ flex: 1, position: 'relative', zIndex: 1 }}>
                        <Routes>
                            <Route path="/" element={<Home />} />
                            <Route path="/blog" element={<Blog />} />
                            <Route path="/blog/:slug" element={<BlogPost />} />
                            <Route path="/editor" element={<Editor />} />
                            <Route path="/projects" element={<Projects />} />
                            <Route path="/about" element={<About />} />
                        </Routes>
                    </main>

                    <Footer />
                </div>
            </ToastProvider>
        </ThemeProvider >
    );
}

export default App;
