import { test as base } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { ConduitApi, type User } from '../src/api/conduit-api';
import { newUser, type NewUser } from '../src/data/factory';
import { ArticlePage } from '../src/pages/article.page';
import { AuthPage } from '../src/pages/auth.page';
import { EditorPage } from '../src/pages/editor.page';
import { USER_FILE } from './paths';

type Session = NewUser & { token: string };

type Fixtures = {
  /** Anonymous API client. */
  api: ConduitApi;
  /** The user whose session the browser already has (created in auth.setup.ts). */
  me: Session;
  /** API client authenticated as `me`, to prepare data the page will show. */
  myApi: ConduitApi;
  /** A brand-new user per test, for scenarios that need a second account. */
  otherUser: User & { password: string };
  authPage: AuthPage;
  editorPage: EditorPage;
  articlePage: ArticlePage;
};

export const test = base.extend<Fixtures>({
  api: async ({ request }, use) => {
    await use(new ConduitApi(request));
  },
  me: async ({}, use) => {
    await use(JSON.parse(readFileSync(USER_FILE, 'utf8')));
  },
  myApi: async ({ api, me }, use) => {
    await use(api.as(me.token));
  },
  otherUser: async ({ api }, use) => {
    const credentials = newUser('other');
    const user = await api.registerOk(credentials);
    await use({ ...user, password: credentials.password });
  },
  authPage: async ({ page }, use) => {
    await use(new AuthPage(page));
  },
  editorPage: async ({ page }, use) => {
    await use(new EditorPage(page));
  },
  articlePage: async ({ page }, use) => {
    await use(new ArticlePage(page));
  },
});

export { expect } from '@playwright/test';
