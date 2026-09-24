import { test, expect } from '../fixtures';

test.describe('when the API fails', { tag: '@full' }, () => {
  test('home feed tells the user something went wrong', async ({ page }) => {
    test.fail(true, 'Known upstream bug: article-list.component has no error handler, so it shows "Loading articles..." forever.');

    await page.route('**/api/articles?**', (route) => route.fulfill({ status: 500, json: { errors: { server: ['down'] } } }));
    const failed = page.waitForResponse((res) => res.url().includes('/api/articles?') && res.status() === 500);

    await page.goto('/');
    // Without this wait, toBeHidden passes before the list even renders: an element that does not exist yet counts as hidden.
    await failed;

    await expect(page.getByText('Loading articles...')).toBeHidden({ timeout: 5_000 });
  });
});
