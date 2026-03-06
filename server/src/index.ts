import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import rateLimit from 'express-rate-limit';
import postsRouter from './routes/posts.js';
import projectsRouter from './routes/projects.js';
import tagsRouter from './routes/tags.js';
import commentsRouter from './routes/comments.js';
import categoriesRouter from './routes/categories.js';
import feedRouter from './routes/feed.js';
import { uploadRouter } from './middleware/upload.js';
import sitemapRouter from './routes/sitemap.js';
import analyticsRouter from './routes/analytics.js';
import authRouter from './routes/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// 全局限流
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: { error: '请求过于频繁，请稍后再试' },
});

// Middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:3000'], credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(limiter);

// Static files — uploaded images
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/posts', postsRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/tags', tagsRouter);
app.use('/api/comments', commentsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/feed', feedRouter);
app.use('/api', uploadRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/', sitemapRouter);

// Health check
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});

export default app;
