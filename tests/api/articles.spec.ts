import { test, expect } from '../fixtures';
import { newArticle } from '../../src/data/factory';

test.describe('articles', { tag: '@full' }, () => {
  test('created article is readable by anyone and findable by its tag', async ({ myApi, api }) => {
    const tag = `tag-${Date.now()}`;
    const article = await myApi.createArticleOk(newArticle({ tagList: [tag] }));

    const res = await api.getArticle(article.slug);
    expect(res.status()).toBe(200);
    expect((await res.json()).article).toMatchObject({ title: article.title, tagList: [tag] });

    // Not /api/tags: it returns only the 10 most used tags, so a new tag may never show up there.
    const byTag = await (await api.request.get('/api/articles', { params: { tag } })).json();
    expect(byTag.articles.map((a: { slug: string }) => a.slug)).toEqual([article.slug]);
  });

  test('empty title is rejected', async ({ myApi }) => {
    const res = await myApi.createArticle(newArticle({ title: '' }));

    expect(res.status()).toBe(422);
    expect((await res.json()).errors).toEqual({ title: ["can't be blank"] });
  });

  test('unknown slug returns 404', async ({ api }) => {
    expect((await api.getArticle('does-not-exist-anywhere')).status()).toBe(404);
  });

  test('list respects limit and filters by author', async ({ myApi, api, me }) => {
    await Promise.all([1, 2, 3].map(() => myApi.createArticleOk(newArticle())));

    const res = await api.request.get('/api/articles', { params: { author: me.username, limit: 2 } });
    const body = await res.json();

    expect(body.articles).toHaveLength(2);
    expect(body.articlesCount).toBeGreaterThanOrEqual(3);
    for (const a of body.articles) expect(a.author.username).toBe(me.username);
  });

  test('favorite increments the counter once per user', async ({ myApi, api, otherUser }) => {
    const article = await myApi.createArticleOk(newArticle());
    const fan = api.as(otherUser.token);

    await fan.favorite(article.slug);
    const second = await fan.favorite(article.slug);

    expect((await second.json()).article).toMatchObject({ favorited: true, favoritesCount: 1 });
  });
});
