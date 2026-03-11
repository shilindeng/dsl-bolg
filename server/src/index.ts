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
import openRouter from './routes/open.js';
import accountRouter from './routes/account.js';
import newsletterRouter from './routes/newsletter.js';
import homepageRouter from './routes/homepage.js';
import seriesRouter from './routes/series.js';
import { isR2Enabled, siteConfig } from './lib/site.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

app.set('trust proxy', 1);

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' },
});

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(
    cors({
        origin(origin, callback) {
            if (!origin || siteConfig.allowedOrigins.includes(origin)) {
                callback(null, true);
                return;
            }

            callback(new Error(`Origin ${origin} is not allowed by CORS`));
        },
        credentials: true,
    }),
);
app.use(express.json({ limit: '10mb' }));
app.use(limiter);
app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next();
});

if (!isR2Enabled) {
    app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
}

app.use('/api/auth', authRouter);
app.use('/api/account', accountRouter);
app.use('/api/open', openRouter);
app.use('/api/newsletter', newsletterRouter);
app.use('/api/homepage', homepageRouter);
app.use('/api/posts', postsRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/series', seriesRouter);
app.use('/api/tags', tagsRouter);
app.use('/api/comments', commentsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/feed', feedRouter);
app.use('/api', uploadRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/', sitemapRouter);

app.get('/api/health', (_req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        storage: isR2Enabled ? 'r2' : 'local',
    });
});

app.listen(Number(PORT), HOST, () => {
    console.log(`Server running at http://${HOST}:${PORT}`);
});

export default app;
