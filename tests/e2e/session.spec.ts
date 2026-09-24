import { test, expect } from '../fixtures';

test('browser starts signed in with the session created by the API', { tag: '@critical' }, async ({ page, me }) => {
  await page.goto('/');

  await expect(page.getByRole('link', { name: 'New Article' })).toBeVisible();
  await expect(page.getByRole('link', { name: me.username })).toBeVisible();
});
