import { test, expect } from '../fixtures';
import { newUser } from '../../src/data/factory';

// These are the only tests that go through the login form, so they start without a session.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('sign up and sign in', { tag: '@critical' }, () => {
  test('new visitor signs up and lands on the home page signed in', async ({ page, authPage }) => {
    const user = newUser('signup');

    await authPage.signUp(user);

    await expect(page).toHaveURL('/');
    await expect(page.locator('app-layout-header').getByRole('link', { name: user.username })).toBeVisible();
  });

  test('existing user signs in', async ({ page, authPage, api }) => {
    const credentials = newUser('signin');
    await api.registerOk(credentials);

    await authPage.signIn(credentials.email, credentials.password);

    await expect(page.locator('app-layout-header').getByRole('link', { name: credentials.username })).toBeVisible();
  });

  test('wrong password keeps the user on the sign in page with an error', async ({ page, authPage, me }) => {
    await authPage.signIn(me.email, 'wrong-password');

    await expect(authPage.errors).toContainText('credentials invalid');
    await expect(page).toHaveURL('/login');
  });
});
