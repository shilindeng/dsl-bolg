import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    build: {
        rollupOptions: {
            output: {
                manualChunks(id) {
                    const normalized = id.replace(/\\\\/g, '/');

                    if (!normalized.includes('node_modules/')) {
                        return undefined;
                    }

                    // Heavy, admin-only charts chunk.
                    if (normalized.includes('/echarts/')) {
                        return 'charts';
                    }

                    if (
                        normalized.includes('/@tiptap/') ||
                        normalized.includes('/prosemirror-')
                    ) {
                        return 'editor';
                    }

                    // Markdown rendering toolchain (keep off the landing page).
                    if (
                        normalized.includes('/react-markdown/') ||
                        normalized.includes('/remark-gfm/') ||
                        normalized.includes('/rehype-highlight/') ||
                        normalized.includes('/unified/') ||
                        normalized.includes('/remark-') ||
                        normalized.includes('/rehype-') ||
                        normalized.includes('/mdast-') ||
                        normalized.includes('/micromark-')
                    ) {
                        return 'markdown';
                    }

                    // Core React runtime + router + helmet.
                    if (
                        normalized.includes('/react/') ||
                        normalized.includes('/react-dom/') ||
                        normalized.includes('/react-router/') ||
                        normalized.includes('/react-router-dom/') ||
                        normalized.includes('/react-helmet-async/')
                    ) {
                        return 'reactVendor';
                    }

                    return undefined;
                },
            },
        },
    },
    server: {
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://localhost:3001',
                changeOrigin: true,
            },
            '/uploads': {
                target: 'http://localhost:3001',
                changeOrigin: true,
            },
        },
    },
    resolve: {
        alias: {
            'react-is': path.resolve(__dirname, 'node_modules/react-is'),
        },
    },
    optimizeDeps: {
        include: ['echarts'],
    },
});
