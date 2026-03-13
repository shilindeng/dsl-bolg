import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    charts: ['echarts/core', 'echarts/charts', 'echarts/components', 'echarts/renderers'],
                    markdown: ['react-markdown', 'remark-gfm', 'rehype-highlight'],
                    reactVendor: ['react', 'react-dom', 'react-router-dom', 'react-helmet-async'],
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
