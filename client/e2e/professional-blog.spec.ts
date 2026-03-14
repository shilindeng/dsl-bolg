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

async function loginAsAdmin(page: Page) {
    await page.goto('/login');
    await page.getByRole('button', { name: /管理员/ }).click();
    await page.getByTestId('login-email-input').fill('admin@dsl.blog');
    await page.getByTestId('login-password-input').fill('admin123');
    await page.getByTestId('login-submit-button').click();
    await expect(page).toHaveURL(/\/admin\/dashboard$/);
}

test('desktop smoke covers public navigation and reading flow', async ({ page, context }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium');

    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    await page.goto('/');
    await expect(page.getByTestId('home-hero')).toBeVisible();
    await saveScreenshot(page, testInfo, 'home');

    await page.goto('/blog');
    await expect(page.getByTestId('blog-search-input')).toBeVisible();
    await expect(page.locator('[data-testid^="post-card-"]').first()).toBeVisible();
    await saveScreenshot(page, testInfo, 'blog');

    await page.locator('[data-testid^="post-card-"]').first().click();
    await expect(page).toHaveURL(/\/blog\/.+/);
    await expect(page.getByTestId('article-meta')).toBeVisible();
    await expect(page.getByTestId('article-content')).toBeVisible();
    await expect(page.getByTestId('post-toc')).toBeVisible();
    await page.getByTestId('article-copy-link-button').click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain('/blog/');
    await saveScreenshot(page, testInfo, 'article');
});

test('desktop admin smoke covers new admin pages and editor modes', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium');

    await loginAsAdmin(page);

    await page.goto('/admin/api-keys');
    await expect(page.getByRole('heading', { name: 'API Key 管理' })).toBeVisible();

    await page.goto('/admin/taxonomy');
    await expect(page.getByRole('heading', { name: '分类与标签' })).toBeVisible();

    await page.goto('/admin/homepage');
    await expect(page.getByRole('heading', { name: '首页编排面板' })).toBeVisible();

    await page.goto('/admin/series');
    await expect(page.getByRole('heading', { name: '专栏管理' })).toBeVisible();

    await page.goto('/editor');
    await expect(page.getByText('HTML 富文本模式')).toBeVisible();
    await expect(page.getByTestId('rich-editor-content')).toBeVisible();

    await page.goto('/blog');
    await page.locator('[data-testid^="post-card-"]').first().click();
    await expect(page.getByRole('link', { name: '编辑文章' })).toBeVisible();
    await page.getByRole('link', { name: '编辑文章' }).click();
    await expect(page.getByText('Markdown 兼容模式')).toBeVisible();
});

test('desktop admin can create a rich text article', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium');

    await loginAsAdmin(page);
    await page.goto('/editor');

    const uniqueTitle = `Playwright rich text ${Date.now()}`;
    await page.getByLabel('标题').fill(uniqueTitle);
    await page.getByLabel('Deck / 导语').fill('This deck is long enough for public rendering and homepage previews.');
    await page.getByLabel('摘要').fill('A generated test article created by Playwright.');
    await page.getByTestId('rich-editor-content').click();
    await page.keyboard.type('Hello from Playwright rich text editor.');
    await page.getByRole('button', { name: '保存文章' }).click();

    await expect(page).toHaveURL(/\/blog\/.+/);
    await expect(page.getByTestId('article-content')).toContainText('Hello from Playwright rich text editor.');
    await saveScreenshot(page, testInfo, 'rich-text-article');
});
