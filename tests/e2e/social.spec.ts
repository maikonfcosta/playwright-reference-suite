import { test, expect } from '../fixtures';
import { newArticle } from '../../src/data/factory';

test.describe('social features', { tag: '@full' }, () => {
  test('favoriting an article updates the counter', async ({ page, articlePage, api, otherUser }) => {
    const article = await api.as(otherUser.token).createArticleOk(newArticle());
    await articlePage.open(article.slug);
    const favorite = page.getByRole('button', { name: /Favorite Article/ }).first();

    await expect(favorite).toContainText('(0)');
    await favorite.click();

    await expect(page.getByRole('button', { name: /Unfavorite Article/ }).first()).toContainText('(1)');
  });

  test('following an author puts their articles in "Your Feed"', async ({ page, articlePage, api, otherUser }) => {
    const article = await api.as(otherUser.token).createArticleOk(newArticle());
    await articlePage.open(article.slug);

    await page.getByRole('button', { name: `Follow ${otherUser.username}` }).first().click();
    await expect(page.getByRole('button', { name: `Unfollow ${otherUser.username}` }).first()).toBeVisible();

    const feed = page.waitForResponse((res) => res.url().includes('/api/articles/feed') && res.ok());
    await page.goto('/?feed=following');
    await feed;
    await expect(page.getByRole('heading', { name: article.title })).toBeVisible();
  });

  test('updating the bio shows it on the profile', async ({ page, me }) => {
    const bio = `QA who reads the logs before blaming the test (${Date.now()})`;

    await page.goto('/settings');
    await page.getByPlaceholder('Short bio about you').fill(bio);
    const saved = page.waitForResponse((res) => res.url().endsWith('/api/user') && res.request().method() === 'PUT');
    await page.getByRole('button', { name: 'Update Settings' }).click();
    expect((await saved).ok()).toBe(true);

    await page.goto(`/profile/${me.username}`);
    await expect(page.getByText(bio)).toBeVisible();
  });
});
