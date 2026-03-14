import 'dotenv/config';
import { createServer } from 'node:http';
import { createApp } from './app.js';
import { assertRuntimeEnv } from './lib/env.js';
import { startNewsletterWorker } from './lib/newsletterWorker.js';

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

assertRuntimeEnv();

const app = createApp();
const server = createServer(app);

server.listen(Number(PORT), HOST, () => {
    console.log(`Server running at http://${HOST}:${PORT}`);
});

if (process.env.DISABLE_NEWSLETTER_WORKER !== 'true') {
    startNewsletterWorker();
}

export default app;
