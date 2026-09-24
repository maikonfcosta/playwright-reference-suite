import { test, expect } from '../fixtures';
import { newArticle } from '../../src/data/factory';

test('reader comments on an article and the comment survives a reload', { tag: '@critical' }, async ({ page, articlePage, api, otherUser }) => {
  const article = await api.as(otherUser.token).createArticleOk(newArticle());

  await articlePage.open(article.slug);
  const saved = await articlePage.postComment('Great checklist, adding it to our release notes.');

  expect(saved.status()).toBe(201);
  await expect(articlePage.comments).toHaveText(['Great checklist, adding it to our release notes.']);
  await expect(articlePage.commentBox).toBeEmpty();

  await page.reload();
  await expect(articlePage.comments).toHaveText(['Great checklist, adding it to our release notes.']);
});
