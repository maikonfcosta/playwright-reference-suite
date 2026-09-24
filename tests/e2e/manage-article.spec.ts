import { test, expect } from '../fixtures';
import { newArticle } from '../../src/data/factory';

test.describe('author manages own article', { tag: '@full' }, () => {
  test('edits the title', async ({ page, editorPage, articlePage, myApi }) => {
    const article = await myApi.createArticleOk(newArticle());

    await articlePage.open(article.slug);
    await articlePage.editButton.click();
    await expect(editorPage.title).toHaveValue(article.title);
    await editorPage.fillForm({ title: `${article.title} (v2)` });
    const saved = await editorPage.publish();

    expect(saved.status()).toBe(200);
    await expect(articlePage.heading).toHaveText(`${article.title} (v2)`);
    await expect(page).toHaveURL(/\/article\//);
  });

  test('deletes it and it is gone from the API', async ({ page, articlePage, myApi }) => {
    const article = await myApi.createArticleOk(newArticle());

    await articlePage.open(article.slug);
    const deleted = page.waitForResponse((res) => res.request().method() === 'DELETE');
    await articlePage.deleteButton.click();

    expect((await deleted).ok()).toBe(true);
    await expect(page).toHaveURL('/');
    expect((await myApi.getArticle(article.slug)).status()).toBe(404);
  });

  test('does not see edit or delete on someone else\'s article', async ({ articlePage, api, otherUser }) => {
    const article = await api.as(otherUser.token).createArticleOk(newArticle());

    await articlePage.open(article.slug);

    await expect(articlePage.editButton).toBeHidden();
    await expect(articlePage.deleteButton).toBeHidden();
  });
});
