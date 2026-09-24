import { test as setup, expect } from '@playwright/test';
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { ConduitApi } from '../src/api/conduit-api';
import { newUser } from '../src/data/factory';
import { AUTH_FILE, USER_FILE } from './paths';

// Registers one user through the API and hands its session to the browser projects.
// The Angular app keeps the JWT in localStorage, so the state is written directly: no login form involved.
setup('create session for e2e user', async ({ request, baseURL }) => {
  const credentials = newUser('e2e');
  const user = await new ConduitApi(request).registerOk(credentials);
  expect(user.token, 'API must return a JWT on sign up').toBeTruthy();

  await mkdir(dirname(AUTH_FILE), { recursive: true });
  await writeFile(
    AUTH_FILE,
    JSON.stringify({
      cookies: [],
      origins: [{ origin: new URL(baseURL!).origin, localStorage: [{ name: 'jwtToken', value: user.token }] }],
    }),
  );
  await writeFile(USER_FILE, JSON.stringify({ ...credentials, token: user.token }));
});
