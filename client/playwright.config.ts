import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: './e2e',
    workers: 1,
    fullyParallel: false,
    timeout: 90_000,
    expect: {
        timeout: 10_000,
    },
    reporter: [['list']],
    outputDir: './playwright-artifacts/test-results',
    use: {
        baseURL: 'http://127.0.0.1:4173',
        headless: true,
        trace: 'retain-on-failure',
        video: 'retain-on-failure',
        screenshot: 'only-on-failure',
    },
    projects: [
        {
            name: 'desktop-chromium',
            use: {
                browserName: 'chromium',
                viewport: { width: 1440, height: 960 },
            },
        },
        {
            name: 'mobile-chromium',
            use: {
                browserName: 'chromium',
                viewport: { width: 390, height: 844 },
                isMobile: true,
                hasTouch: true,
            },
        },
    ],
    webServer: [
        {
            command: 'npm --prefix ../server run start',
            url: 'http://127.0.0.1:3001/api/health',
            reuseExistingServer: true,
            stdout: 'pipe',
            stderr: 'pipe',
            timeout: 120_000,
        },
        {
            command: 'npm run preview -- --host 127.0.0.1 --port 4173',
            url: 'http://127.0.0.1:4173',
            reuseExistingServer: true,
            stdout: 'pipe',
            stderr: 'pipe',
            timeout: 120_000,
        },
    ],
});
