import { test, expect } from '@playwright/test';

test('home page loads the global feed from our API', { tag: '@critical' }, async ({ page }) => {
  const articles = page.waitForResponse((res) => res.url().includes('/api/articles') && res.ok());

  await page.goto('/');

  await articles;
  await expect(page.getByRole('link', { name: 'conduit' }).first()).toBeVisible();
  await expect(page.getByText('Global Feed')).toBeVisible();
});
