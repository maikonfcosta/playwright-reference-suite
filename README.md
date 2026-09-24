# playwright-reference-suite

[![ci](https://github.com/maikonfcosta/playwright-reference-suite/actions/workflows/ci.yml/badge.svg)](https://github.com/maikonfcosta/playwright-reference-suite/actions/workflows/ci.yml)
[![nightly](https://github.com/maikonfcosta/playwright-reference-suite/actions/workflows/nightly.yml/badge.svg)](https://github.com/maikonfcosta/playwright-reference-suite/actions/workflows/nightly.yml)
[![last nightly](https://img.shields.io/endpoint?url=https://maikonfcosta.github.io/playwright-reference-suite/badge.json)](https://maikonfcosta.github.io/playwright-reference-suite/)

**[English](#english)** · **[Português](#português)**

![Publishing an article and commenting on it](docs/demo.gif)

## English

E2E and API tests for [RealWorld / Conduit](https://github.com/gothinkster/realworld), a Medium clone. I built it the way I set up testing on real products at work: a small critical ring on every push, the rest at night, access control checked at the API, and a CI that tells a flaky test apart from a broken one.

**[Latest nightly report](https://maikonfcosta.github.io/playwright-reference-suite/)** · [Spec](SPEC.md)

### What is covered

| Ring | Runs | What | Time |
|---|---|---|---|
| `@critical` | every push and PR, Chromium | sign up / sign in, publish, comment, auth contract (401 / 422 / 409), ownership (403) | ~10 s of tests, ~2 min job |
| `@full` | nightly, sharded in 3, Chromium + Firefox + WebKit | everything above plus edit/delete, favorites, follow + feed, settings, API failure | ~3 min per shard |

### Run it

Needs Docker and Node 24.

```bash
npm ci && npx playwright install chromium
npm run app:up          # builds and starts Conduit (API + web) on localhost:4200
npm run test:critical   # or: npm run test:full
npm run app:down        # stops it and drops the database
```

`npm run demo` records the critical journeys slowly and rebuilds the GIF above.

### How it is organized

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

### Decisions and trade-offs

#### The app runs from Docker, pinned to upstream commits

No test depends on a public demo being up, and upstream changes only reach the suite through a PR that bumps the pin. The Angular app hardcodes the public API URL, so the image rewrites it to `/api` and nginx proxies it. The build fails if that rewrite stops matching, instead of silently testing the wrong backend.

#### Login goes through the API, once

The browser projects start with a saved session. Only `tests/e2e/auth.spec.ts` uses the login form, because that form is what it tests.

#### Every test creates its own data

I learned this one on this repo. A test that checked "my new tag shows up in `/api/tags`" passed on a fresh database and failed after a few runs: the endpoint returns only the 10 most used tags. The test now checks `?tag=` filtering, which is the actual contract.

#### No blind waits

`waitForTimeout`, `waitForSelector` and `force: true` are lint errors. Tests wait for the API response they depend on. It also caught a mistake of mine: `toBeHidden()` passes when the element does not exist yet, so a check that ran before the page rendered was passing for the wrong reason.

#### Retries only in CI, and flaky tests are listed

Playwright counts "failed, then passed on retry" as passed. `scripts/flaky-report.ts` puts those tests in the job summary with their first error, and `--max=N` can turn them into a failure.

#### A known upstream bug, kept visible with `test.fail()`

When `GET /api/articles` fails, the Angular feed shows "Loading articles..." forever (`article-list.component` has no error handler). `tests/e2e/resilience.spec.ts` documents it. It stays green while the bug exists and turns red when someone fixes it.

#### Selectors use placeholders

The Conduit forms have no labels, so `getByPlaceholder` is the most user-facing option available. With labels, these would be `getByLabel`.

#### Accepted for now

- Docker images are rebuilt on every CI run (about 70 s of the 2 min job). Build caching is the next improvement.
- The settings test changes the bio of the shared session user. Nothing else reads the bio; if something does, that test gets its own user.
- No visual regression, mobile viewports or load testing. Load testing lives in a separate Locust project.

---

## Português

Testes E2E e de API para o [RealWorld / Conduit](https://github.com/gothinkster/realworld), um clone do Medium. Montei do jeito que estruturo testes em produtos reais no trabalho: um ring crítico pequeno a cada push, o resto de madrugada, controle de acesso checado na API e um CI que diferencia teste instável (flaky) de teste quebrado.

**[Relatório do último nightly](https://maikonfcosta.github.io/playwright-reference-suite/)** · [Spec](SPEC.md)

### O que é coberto

| Ring | Quando roda | O quê | Tempo |
|---|---|---|---|
| `@critical` | a cada push e PR, Chromium | cadastro / login, publicar, comentar, contrato de autenticação (401 / 422 / 409), posse de recurso (403) | ~10 s de teste, ~2 min de job |
| `@full` | de madrugada, dividido em 3 shards, Chromium + Firefox + WebKit | tudo acima mais editar/apagar, favoritos, seguir + feed, configurações, falha da API | ~3 min por shard |

### Como rodar

Precisa de Docker e Node 24.

```bash
npm ci && npx playwright install chromium
npm run app:up          # faz o build e sobe o Conduit (API + web) em localhost:4200
npm run test:critical   # ou: npm run test:full
npm run app:down        # derruba tudo e apaga o banco
```

`npm run demo` grava as jornadas críticas em câmera lenta e gera de novo o GIF acima.

### Como está organizado

```
docker/            Dockerfiles da API e do web do upstream com commit fixado, proxy nginx
src/api/           cliente fino da API do Conduit (usado para criar massa e para testar a API)
src/data/          factories com nomes únicos, para testes em paralelo nunca colidirem
src/pages/         page objects: locators e ações do usuário, sem asserções
tests/auth.setup   cadastra um usuário pela API e salva a sessão do navegador
tests/api/         contrato e controle de acesso
tests/e2e/         jornadas do usuário
scripts/           relatório de flaky, badge do README, GIF de demo
```

### Decisões e trade-offs

#### O app roda em Docker, com commits do upstream fixados

Nenhum teste depende de uma demo pública estar no ar, e mudanças do upstream só chegam na suíte por um PR que atualiza o commit fixado. O app Angular tem a URL da API pública escrita no código, então a imagem troca por `/api` e o nginx faz o proxy. O build falha se essa troca deixar de encontrar o trecho, em vez de testar o backend errado sem ninguém perceber.

#### O login passa pela API, uma vez só

Os projetos de navegador começam com uma sessão salva. Só o `tests/e2e/auth.spec.ts` usa o formulário de login, porque é esse formulário que ele testa.

#### Cada teste cria os próprios dados

Aprendi essa neste repo. Um teste que checava "minha tag nova aparece em `/api/tags`" passava com o banco zerado e falhava depois de algumas execuções: o endpoint devolve só as 10 tags mais usadas. Agora o teste checa o filtro `?tag=`, que é o contrato de verdade.

#### Sem espera cega

`waitForTimeout`, `waitForSelector` e `force: true` são erro de lint. Os testes esperam a resposta da API de que dependem. Isso também pegou um erro meu: `toBeHidden()` passa quando o elemento ainda não existe, então uma checagem feita antes da página renderizar passava pelo motivo errado.

#### Retry só no CI, e os testes flaky são listados

O Playwright conta "falhou e passou no retry" como aprovado. O `scripts/flaky-report.ts` coloca esses testes no resumo do job com o primeiro erro, e o `--max=N` pode transformá-los em falha.

#### Um bug conhecido do upstream, mantido visível com `test.fail()`

Quando o `GET /api/articles` falha, o feed do Angular mostra "Loading articles..." para sempre (o `article-list.component` não trata erro). O `tests/e2e/resilience.spec.ts` documenta isso. Ele fica verde enquanto o bug existir e fica vermelho quando alguém corrigir.

#### Os seletores usam placeholder

Os formulários do Conduit não têm label, então `getByPlaceholder` é a opção mais próxima do que o usuário vê. Com label, seriam `getByLabel`.

#### Aceito por enquanto

- As imagens Docker são reconstruídas em todo run do CI (uns 70 s dos 2 min do job). Cache de build é a próxima melhoria.
- O teste de configurações muda a bio do usuário compartilhado da sessão. Nenhum outro teste lê a bio; se algum passar a ler, esse teste ganha usuário próprio.
- Sem regressão visual, viewport mobile ou teste de carga. Teste de carga fica num projeto separado, com Locust.
