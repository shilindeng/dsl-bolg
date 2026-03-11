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

test('desktop smoke covers public navigation and reading flow', async ({ page, context }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium');

    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    await page.goto('/');
    await expect(page.getByTestId('home-hero')).toBeVisible();
    await expect(page.getByTestId('primary-nav')).toBeVisible();
    await saveScreenshot(page, testInfo, 'home');

    await page.getByTestId('primary-nav').getByRole('link', { name: /专栏/ }).click();
    await expect(page).toHaveURL(/\/series$/);
    await expect(page.locator('[data-testid^="series-card-"]').first()).toBeVisible();
    await saveScreenshot(page, testInfo, 'series');

    await page.locator('[data-testid^="series-card-"]').first().click();
    await expect(page).toHaveURL(/\/series\/.+/);
    await expect(page.getByRole('heading', { name: /章节目录/ })).toBeVisible();
    await expect(page.locator('[data-testid^="series-post-"]').first()).toBeVisible();
    await saveScreenshot(page, testInfo, 'series-detail');

    await page.locator('[data-testid^="series-post-"]').first().click();
    await expect(page).toHaveURL(/\/blog\/.+/);
    await expect(page.getByTestId('series-rail-sidebar')).toBeVisible();

    await page.getByTestId('primary-nav').getByRole('link', { name: /博客/ }).click();
    await expect(page).toHaveURL(/\/blog$/);
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

    await page.getByTestId('primary-nav').getByRole('link', { name: /项目/ }).click();
    await expect(page).toHaveURL(/\/projects$/);
    await expect(page.locator('[data-testid^="project-card-"]').first()).toBeVisible();

    await page.getByTestId('primary-nav').getByRole('link', { name: /关于/ }).click();
    await expect(page).toHaveURL(/\/about$/);
    await expect(page.locator('main').getByRole('heading', { name: /^DSL$/ })).toBeVisible();

    await page.getByRole('link', { name: /Newsletter/ }).first().click();
    await expect(page).toHaveURL(/\/newsletter$/);
    await expect(page.getByRole('heading', { name: /订阅长期写作与产品化更新/ })).toBeVisible();

    await page.getByRole('link', { name: /登录/ }).first().click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByTestId('reader-login-form')).toBeVisible();
    await saveScreenshot(page, testInfo, 'login');
});

test('mobile smoke covers menu navigation and article reading', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-chromium');

    await page.goto('/');
    await expect(page.getByTestId('home-hero')).toBeVisible();
    await saveScreenshot(page, testInfo, 'home-mobile');

    await page.getByRole('button', { name: /打开导航菜单/ }).click();
    await page.getByLabel('移动端导航').getByRole('link', { name: /专栏/ }).click();
    await expect(page).toHaveURL(/\/series$/);
    await expect(page.locator('[data-testid^="series-card-"]').first()).toBeVisible();

    await page.locator('[data-testid^="series-card-"]').first().click();
    await expect(page).toHaveURL(/\/series\/.+/);
    await expect(page.locator('[data-testid^="series-post-"]').first()).toBeVisible();
    await page.locator('[data-testid^="series-post-"]').first().click();
    await expect(page.getByTestId('series-rail-inline')).toBeVisible();
    await saveScreenshot(page, testInfo, 'series-article-mobile');

    await page.getByRole('button', { name: /打开导航菜单/ }).click();
    await page.getByLabel('移动端导航').getByRole('link', { name: /博客/ }).click();
    await expect(page).toHaveURL(/\/blog$/);
    await expect(page.locator('[data-testid^="post-card-"]').first()).toBeVisible();

    await page.locator('[data-testid^="post-card-"]').first().click();
    await expect(page.getByTestId('article-content')).toBeVisible();
    await expect(page.getByTestId('article-meta')).toBeVisible();
    await saveScreenshot(page, testInfo, 'article-mobile');
});
