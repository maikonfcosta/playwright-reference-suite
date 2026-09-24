# Spec

## Goal

A Playwright suite that shows how I structure E2E and API tests for a real product, not a demo script collection.
The target is [RealWorld / Conduit](https://github.com/gothinkster/realworld), a Medium clone with a documented API spec.

Everything runs locally and in CI from Docker, so the suite never depends on a public site being up.

## System under test

| Part | Source | Pinned at |
|---|---|---|
| API | `realworld-apps/nitro-prisma-zod-realworld-example-app` (Nitro + Prisma + SQLite) | `c8c66858a436` |
| Web | `realworld-apps/angular-realworld-example-app` (Angular) | `dd99ed2cf39c` |

The Angular app hardcodes `https://api.realworld.show`. The web image rewrites it to a relative `/api` and nginx proxies `/api` to the API container. Same origin, no CORS setup.

RealWorld ships its own E2E spec to check that a frontend conforms to the UI contract. This suite has a different job: risk-based rings, an API layer, isolated test data and CI gates. It does not reuse that code.

Pinning the commits matters: if upstream changes, the suite breaks on purpose in a PR that bumps the pin, never randomly on `main`.

## What gets tested

### Critical ring (`@critical`) — every push, must stay under 3 min

| Journey | Layer | Why it is critical |
|---|---|---|
| Sign up and sign in | E2E | No login, no product |
| Publish an article | E2E | Core write path |
| Comment on an article | E2E | Main interaction between users |
| Auth contract: 401 without token, 422 on invalid payload | API | Cheap and catches most backend regressions |
| Ownership: user B cannot edit or delete user A's article | API | Access control bug = security incident |

### Full ring (`@full`) — nightly and on demand

- Edit and delete own article
- Favorite / unfavorite, follow / unfollow, feed shows followed authors
- Tags and pagination on the global feed
- Profile page and settings update
- Error handling: API down shows an error instead of a blank page
- Firefox and WebKit projects

## Design rules

1. **Login once through the API**, save the session (`storageState`) and reuse it. Only the sign-in test goes through the login form.
2. **Every test creates its own data** through the API (unique user, unique article). No shared fixtures that one test can break for another.
3. **No blind waits.** `page.waitForTimeout` is blocked by lint. Wait for the network response or a web-first assertion.
4. **Selectors:** role and label first, `data-testid` only when the UI gives nothing better. No CSS chains.
5. **Page objects stay thin**: locators and user actions. Assertions live in the test.
6. **Retries:** 1 in CI, 0 locally. A test that only passes on retry is reported as flaky, not as green.

## CI

- GitHub Actions: build images, `docker compose up`, run the ring, upload HTML report and traces.
- Critical ring on every push and PR. Full ring nightly, sharded.
- Report published to GitHub Pages.
- Pipeline fails on `failed > 0`. Flaky tests are listed in the job summary.

## Out of scope (for now)

- Visual regression
- Performance and load (separate project with Locust)
- Mobile viewports
- Testing the upstream apps' own unit tests

## Done when

- `docker compose up` + `npx playwright test` works on a clean machine with one command each
- Critical ring green in CI, under 3 min
- README explains the decisions in under 2 minutes of reading
