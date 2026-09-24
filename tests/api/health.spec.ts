import { test, expect } from '@playwright/test';

test('API answers through the web proxy', { tag: '@critical' }, async ({ request }) => {
  const response = await request.get('/api/tags');

  expect(response.status()).toBe(200);
  expect(await response.json()).toHaveProperty('tags');
});
