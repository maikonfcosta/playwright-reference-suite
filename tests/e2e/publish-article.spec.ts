import { test, expect } from '../fixtures';
import { newArticle } from '../../src/data/factory';

test('author publishes an article and sees it rendered', { tag: '@critical' }, async ({ page, editorPage, articlePage, myApi }) => {
  const draft = newArticle({ body: 'First line with **bold** text.', tagList: ['release', 'checklist'] });

  await editorPage.open();
  await editorPage.fillForm(draft);
  const saved = await editorPage.publish();

  expect(saved.status()).toBe(201);
  const { article } = await saved.json();
  await expect(page).toHaveURL(`/article/${article.slug}`);
  await expect(articlePage.heading).toHaveText(draft.title);
  await expect(page.locator('.article-content strong')).toHaveText('bold');
  await expect(page.locator('.article-content .tag-list li')).toHaveText(['release', 'checklist']);

  // The UI can lie; the API is the source of truth for what was stored.
  const stored = await (await myApi.getArticle(article.slug)).json();
  expect(stored.article).toMatchObject({ title: draft.title, description: draft.description });
});
