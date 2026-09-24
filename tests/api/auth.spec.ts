import { test, expect } from '../fixtures';
import { newArticle, newUser } from '../../src/data/factory';

test.describe('auth contract', { tag: '@critical' }, () => {
  test('write endpoints reject requests without a token', async ({ api, myApi }) => {
    const article = await myApi.createArticleOk(newArticle());

    const responses = await Promise.all([
      api.createArticle(newArticle()),
      api.updateArticle(article.slug, { title: 'hijacked' }),
      api.deleteArticle(article.slug),
      api.addComment(article.slug, 'anonymous comment'),
    ]);

    for (const res of responses) expect(res.status()).toBe(401);
  });

  test('an invalid token is rejected with a readable error', async ({ api }) => {
    const res = await api.as('not-a-real-token').currentUser();

    expect(res.status()).toBe(401);
    expect(await res.json()).toEqual({ errors: { token: ['is invalid'] } });
  });

  test('sign up validates required fields', async ({ api }) => {
    const { username, password } = newUser();

    const res = await api.register({ username, password, email: '' });

    expect(res.status()).toBe(422);
    expect((await res.json()).errors).toHaveProperty('email');
  });

  test('sign up rejects an email or username already in use', async ({ api, me }) => {
    const res = await api.register({ username: me.username, email: me.email, password: 'whatever-123' });

    expect(res.status()).toBe(409);
    expect((await res.json()).errors).toMatchObject({
      email: ['has already been taken'],
      username: ['has already been taken'],
    });
  });

  test('wrong password does not reveal whether the email exists', async ({ api, me }) => {
    const wrongPassword = await api.login(me.email, 'wrong-password');
    const unknownEmail = await api.login('nobody@test.local', 'wrong-password');

    expect(wrongPassword.status()).toBe(401);
    expect(await wrongPassword.json()).toEqual(await unknownEmail.json());
  });
});
