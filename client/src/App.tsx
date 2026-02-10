import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './hooks/useTheme';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import Projects from './pages/Projects';
import About from './pages/About';
import Editor from './pages/Editor';

function App() {
    return (
        <ThemeProvider>
            <BrowserRouter>
                <div className="app-wrapper">
                    <Navbar />
                    <main style={{ minHeight: 'calc(100vh - var(--navbar-height) - 200px)', paddingTop: 'var(--navbar-height)' }}>
                        <Routes>
                            <Route path="/" element={<Home />} />
                            <Route path="/blog" element={<Blog />} />
                            <Route path="/blog/:slug" element={<BlogPost />} />
                            <Route path="/editor" element={<Editor />} />
                            <Route path="/editor/:slug" element={<Editor />} />
                            <Route path="/projects" element={<Projects />} />
                            <Route path="/about" element={<About />} />
                        </Routes>
                    </main>
                    <Footer />
                </div>
            </BrowserRouter>
        </ThemeProvider>
    );
}

export default App;
