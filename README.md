# playwright-reference-suite

[![ci](https://github.com/maikonfcosta/playwright-reference-suite/actions/workflows/ci.yml/badge.svg)](https://github.com/maikonfcosta/playwright-reference-suite/actions/workflows/ci.yml)
[![nightly](https://github.com/maikonfcosta/playwright-reference-suite/actions/workflows/nightly.yml/badge.svg)](https://github.com/maikonfcosta/playwright-reference-suite/actions/workflows/nightly.yml)
[![last nightly](https://img.shields.io/endpoint?url=https://maikonfcosta.github.io/playwright-reference-suite/badge.json)](https://maikonfcosta.github.io/playwright-reference-suite/)

E2E and API tests for [RealWorld / Conduit](https://github.com/gothinkster/realworld), a Medium clone. I built it the way I set up testing on real products at work: a small critical ring on every push, the rest at night, access control checked at the API, and a CI that tells a flaky test apart from a broken one.

**[Latest nightly report](https://maikonfcosta.github.io/playwright-reference-suite/)** · [Spec](SPEC.md) · [Versão em português](#português)

![Publishing an article and commenting on it](docs/demo.gif)

## What is covered

| Ring | Runs | What | Time |
|---|---|---|---|
| `@critical` | every push and PR, Chromium | sign up / sign in, publish, comment, auth contract (401 / 422 / 409), ownership (403) | ~10 s of tests, ~2 min job |
| `@full` | nightly, sharded in 3, Chromium + Firefox + WebKit | everything above plus edit/delete, favorites, follow + feed, settings, API failure | ~3 min per shard |

## Run it

Needs Docker and Node 24.

```bash
npm ci && npx playwright install chromium
npm run app:up          # builds and starts Conduit (API + web) on localhost:4200
npm run test:critical   # or: npm run test:full
npm run app:down        # stops it and drops the database
```

`npm run demo` records the critical journeys slowly and rebuilds the GIF above.

## How it is organized

```
docker/            Dockerfiles for the pinned upstream API and web, nginx proxy
src/api/           thin Conduit API client (used to create data and to test the API)
src/data/          factories with unique names, so parallel tests never collide
src/pages/         page objects: locators and user actions, no assertions
tests/auth.setup   signs up one user through the API and saves the browser session
tests/api/         contract and access control
tests/e2e/         user journeys
scripts/           flaky report, README badge, demo GIF
```

## Decisions and trade-offs

### The app runs from Docker, pinned to upstream commits

No test depends on a public demo being up, and upstream changes only reach the suite through a PR that bumps the pin. The Angular app hardcodes the public API URL, so the image rewrites it to `/api` and nginx proxies it. The build fails if that rewrite stops matching, instead of silently testing the wrong backend.

### Login goes through the API, once

The browser projects start with a saved session. Only `tests/e2e/auth.spec.ts` uses the login form, because that form is what it tests.

### Every test creates its own data

I learned this one on this repo. A test that checked "my new tag shows up in `/api/tags`" passed on a fresh database and failed after a few runs: the endpoint returns only the 10 most used tags. The test now checks `?tag=` filtering, which is the actual contract.

### No blind waits

`waitForTimeout`, `waitForSelector` and `force: true` are lint errors. Tests wait for the API response they depend on. It also caught a mistake of mine: `toBeHidden()` passes when the element does not exist yet, so a check that ran before the page rendered was passing for the wrong reason.

### Retries only in CI, and flaky tests are listed

Playwright counts "failed, then passed on retry" as passed. `scripts/flaky-report.ts` puts those tests in the job summary with their first error, and `--max=N` can turn them into a failure.

### A known upstream bug, kept visible with `test.fail()`

When `GET /api/articles` fails, the Angular feed shows "Loading articles..." forever (`article-list.component` has no error handler). `tests/e2e/resilience.spec.ts` documents it. It stays green while the bug exists and turns red when someone fixes it.

### Selectors use placeholders

The Conduit forms have no labels, so `getByPlaceholder` is the most user-facing option available. With labels, these would be `getByLabel`.

### Accepted for now

- Docker images are rebuilt on every CI run (about 70 s of the 2 min job). Build caching is the next improvement.
- The settings test changes the bio of the shared session user. Nothing else reads the bio; if something does, that test gets its own user.
- No visual regression, mobile viewports or load testing. Load testing lives in a separate Locust project.

---

## Português

Testes E2E e de API para o [RealWorld / Conduit](https://github.com/gothinkster/realworld), um clone do Medium, montados do jeito que eu estruturo testes num produto real.

O `@critical` roda a cada push e leva uns 10 s de teste. O `@full` roda de madrugada, dividido em 3 máquinas, no Chromium, Firefox e WebKit.

Além das jornadas na tela, a suíte testa a API: contrato de autenticação (401, 422, 409) e posse de recurso. O usuário B não consegue editar nem apagar o conteúdo do usuário A.

Cada teste cria os próprios dados pela API, com nomes únicos. `waitForTimeout` é erro de lint, então o teste espera a resposta da API de que depende. Retry só existe no CI, e os testes que só passaram na segunda tentativa aparecem no resumo do job.

Para rodar, precisa de Docker e Node 24. Os comandos estão em [Run it](#run-it).

Três coisas apareceram enquanto eu montava a suíte, e estão explicadas em [Decisions and trade-offs](#decisions-and-trade-offs): um teste que dependia do estado acumulado do banco (a lista de tags só traz as 10 mais usadas), um falso positivo do `toBeHidden()` e um bug real no frontend do Conduit, documentado com `test.fail()`.
