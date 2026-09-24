import { randomUUID } from 'node:crypto';

export type NewUser = { username: string; email: string; password: string };
export type NewArticle = { title: string; description: string; body: string; tagList?: string[] };

// Short unique suffix so parallel tests and repeated runs never collide on unique columns.
const uid = () => randomUUID().slice(0, 8);

export function newUser(prefix = 'qa'): NewUser {
  const id = uid();
  return { username: `${prefix}_${id}`, email: `${prefix}_${id}@test.local`, password: `Pw-${id}-secret` };
}

export function newArticle(overrides: Partial<NewArticle> = {}): NewArticle {
  const id = uid();
  return {
    title: `Release checklist ${id}`,
    description: 'What we verify before shipping',
    body: 'Smoke the critical paths, check the error budget, then ship.',
    tagList: ['qa'],
    ...overrides,
  };
}
