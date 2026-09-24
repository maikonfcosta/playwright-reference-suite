import { test, expect } from '../fixtures';
import { newArticle } from '../../src/data/factory';

// Access control: a logged-in user must not change someone else's content.
test.describe('ownership', { tag: '@critical' }, () => {
  test('another user cannot edit my article', async ({ myApi, api, otherUser }) => {
    const article = await myApi.createArticleOk(newArticle());

    const res = await api.as(otherUser.token).updateArticle(article.slug, { title: 'hijacked' });

    expect(res.status()).toBe(403);
    const current = await (await api.getArticle(article.slug)).json();
    expect(current.article.title).toBe(article.title);
  });

  test('another user cannot delete my article', async ({ myApi, api, otherUser }) => {
    const article = await myApi.createArticleOk(newArticle());

    const res = await api.as(otherUser.token).deleteArticle(article.slug);

    expect(res.status()).toBe(403);
    expect((await api.getArticle(article.slug)).status()).toBe(200);
  });

  test('another user cannot delete my comment', async ({ myApi, api, otherUser }) => {
    const article = await myApi.createArticleOk(newArticle());
    const { comment } = await (await myApi.addComment(article.slug, 'mine')).json();

    const res = await api.as(otherUser.token).deleteComment(article.slug, comment.id);

    expect(res.status()).toBe(403);
  });
});
