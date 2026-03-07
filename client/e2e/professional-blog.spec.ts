import fs from 'node:fs';
import path from 'node:path';
import { expect, test, type Page, type TestInfo } from '@playwright/test';

const screenshotsDir = path.join(process.cwd(), 'playwright-artifacts', 'screenshots');

function sanitizeFileSegment(value: string) {
    return value.replace(/[^\w-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

async function saveScreenshot(page: Page, testInfo: TestInfo, name: string) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
    const filename = `${sanitizeFileSegment(testInfo.project.name)}-${sanitizeFileSegment(name)}.png`;
    await page.screenshot({ path: path.join(screenshotsDir, filename), fullPage: true });
}

test.beforeEach(async ({ page }) => {
    await page.route('https://ipwho.is/**', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                success: true,
                city: 'Shanghai',
                country: 'China',
                latitude: 31.2304,
                longitude: 121.4737,
                timezone: { id: 'Asia/Shanghai' },
            }),
        });
    });

    await page.route('https://api.open-meteo.com/**', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                current: {
                    temperature_2m: 22.4,
                    apparent_temperature: 23.1,
                    weather_code: 1,
                    wind_speed_10m: 9.5,
                    is_day: 1,
                },
            }),
        });
    });
});

test('desktop flow covers public reading, admin moderation and project CRUD', async ({ page, context }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium');

    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    const commentSuffix = Date.now().toString();
    const commentBody = `Playwright integration comment ${commentSuffix}`;
    const projectSlug = `playwright-project-${commentSuffix}`;

    await page.goto('/');

    await expect(page.getByTestId('home-hero')).toBeVisible();
    await expect(page.getByTestId('hero-panel')).toBeVisible();
    await expect(page.getByTestId('hero-particles')).toBeVisible();
    await expect(page.getByTestId('weather-card')).toBeVisible();
    await expect(page.getByTestId('weather-temperature')).toContainText('22');
    await expect(page.getByTestId('weather-location-note')).toContainText('自动定位');
    await saveScreenshot(page, testInfo, 'home');

    await page.goto('/blog');
    await expect(page).toHaveURL(/\/blog$/);

    await expect(page.getByTestId('blog-search-input')).toBeVisible();
    await page.getByTestId('blog-search-input').fill('Cloudflare');
    await expect(page.locator('[data-testid^="post-card-"]')).toHaveCount(1);

    await page.locator('[data-testid^="post-card-"]').first().click();
    await expect(page).toHaveURL(/\/blog\/.+/);
    const articleUrl = page.url();

    await expect(page.getByTestId('article-meta')).toBeVisible();
    await expect(page.getByTestId('post-toc')).toBeVisible();

    const likeButton = page.getByTestId('article-like-button');
    const likeTextBefore = await likeButton.textContent();
    const previousLikes = Number((likeTextBefore || '').match(/(\d+)/)?.[1] || '0');
    const [likeResponse] = await Promise.all([
        page.waitForResponse((response) => response.url().includes('/like') && response.request().method() === 'POST'),
        likeButton.click(),
    ]);
    expect(likeResponse.ok()).toBeTruthy();
    await expect.poll(async () => {
        const currentText = await likeButton.textContent();
        return Number((currentText || '').match(/(\d+)/)?.[1] || '0');
    }).toBe(previousLikes + 1);

    await page.getByTestId('article-copy-link-button').click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain('/blog/');

    await page.getByTestId('comment-author-input').fill('Playwright QA');
    await page.getByTestId('comment-email-input').fill('playwright@example.com');
    await page.getByTestId('comment-content-input').fill(commentBody);
    await page.getByTestId('comment-submit-button').click();

    await expect(page.getByTestId('pending-comment-badge')).toBeVisible();
    await saveScreenshot(page, testInfo, 'article');

    await page.goto('/login');
    await page.getByTestId('login-email-input').fill('admin@dsl.blog');
    await page.getByTestId('login-password-input').fill('admin123');
    await page.getByTestId('login-submit-button').click();

    await expect(page).toHaveURL(/\/admin\/dashboard$/);
    await expect(page.getByTestId('pending-comments-panel')).toBeVisible();
    await expect(page.getByTestId('dashboard-trend-chart')).toBeVisible();
    await expect(page.getByTestId('dashboard-top-posts-chart')).toBeVisible();
    await expect(page.getByTestId('dashboard-comment-chart')).toBeVisible();

    const pendingComment = page.locator('[data-testid^="pending-comment-"]').filter({ hasText: commentBody }).first();
    await expect(pendingComment).toBeVisible();
    await pendingComment.locator('[data-testid^="approve-comment-"]').click();
    await expect(pendingComment).toHaveCount(0);
    await saveScreenshot(page, testInfo, 'dashboard');

    await page.goto('/editor');
    await page.getByTestId('editor-cover-upload-input').setInputFiles(path.join(process.cwd(), 'public', 'og-default.svg'));
    await expect(page.locator('.editor-cover-preview img')).toBeVisible();

    await page.goto('/admin/dashboard');
    await page.getByRole('button', { name: '分发与项目' }).click();

    await page.getByTestId('project-name-input').fill('Playwright Project');
    await page.getByTestId('project-slug-input').fill(projectSlug);
    await page.getByTestId('project-summary-input').fill('A temporary project created by Playwright E2E.');
    await page.getByTestId('project-description-input').fill('This record validates project CRUD on the admin dashboard.');
    await page.getByTestId('project-techstack-input').fill('Playwright, React, Express');
    await page.getByTestId('project-live-url-input').fill('https://example.com/playwright');
    await page.getByTestId('project-repo-url-input').fill('https://github.com/example/playwright');
    await page.getByTestId('project-featured-input').check();
    await page.getByTestId('project-order-input').fill('99');
    await page.getByTestId('project-submit-button').click();

    const createdProject = page.getByTestId(`project-row-${projectSlug}`);
    await expect(createdProject).toBeVisible();

    await page.getByRole('button', { name: '创建 API Key' }).click();
    await expect(page.locator('.latest-key-card')).toBeVisible();
    const apiKey = (await page.locator('.api-key-value').textContent())?.trim();
    expect(apiKey).toBeTruthy();

    const mediaUpload = await page.request.post('/api/open/v1/media', {
        headers: { Authorization: `Bearer ${apiKey}` },
        multipart: {
            image: {
                name: 'og-default.svg',
                mimeType: 'image/svg+xml',
                buffer: fs.readFileSync(path.join(process.cwd(), 'public', 'og-default.svg')),
            },
        },
    });
    expect(mediaUpload.ok()).toBeTruthy();
    const mediaPayload = await mediaUpload.json();

    const openApiSlug = `playwright-open-api-${commentSuffix}`;
    const publishResponse = await page.request.put(`/api/open/v1/posts/playwright/${commentSuffix}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
        data: {
            title: `Playwright Open API ${commentSuffix}`,
            content: '# Playwright Open API\n\nThis post validates external publishing.',
            excerpt: 'Open API smoke test',
            coverImage: mediaPayload.url,
            published: true,
            featured: false,
            tags: ['Playwright', 'Open API'],
            slug: openApiSlug,
        },
    });
    expect(publishResponse.ok()).toBeTruthy();

    await page.getByTestId(`delete-project-${projectSlug}`).click();
    await expect(createdProject).toHaveCount(0);

    await page.goto(articleUrl);
    await expect(page.locator('body')).toContainText(commentBody);

    await page.goto(`/blog/${openApiSlug}`);
    await expect(page.getByTestId('article-content')).toContainText('Playwright Open API');
});

test('mobile smoke covers hero rendering and article navigation', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-chromium');

    await page.goto('/');
    await expect(page.getByTestId('home-hero')).toBeVisible();
    await expect(page.getByTestId('weather-card')).toBeVisible();
    await saveScreenshot(page, testInfo, 'home-mobile');

    await page.goto('/blog');
    await expect(page.locator('[data-testid^="post-card-"]').first()).toBeVisible();
    await page.locator('[data-testid^="post-card-"]').first().click();
    await expect(page.getByTestId('article-content')).toBeVisible();
    await expect(page.getByTestId('post-toc')).toBeVisible();
});
