// Reads Playwright's JSON report and lists tests that failed first and passed on retry.
// Playwright already marks them as "flaky"; this makes them visible instead of hiding inside a green run.
//
// Usage: node scripts/flaky-report.ts <results.json> [--max=N]
// --max makes the script exit 1 when there are more flaky tests than N.

import { readFileSync, appendFileSync } from 'node:fs';

type Result = { status: string; retry: number; error?: { message?: string } };
type Test = { projectName: string; status: string; results: Result[] };
type Spec = { title: string; file: string; line: number; tests: Test[] };
type Suite = { title: string; specs?: Spec[]; suites?: Suite[] };
type Report = { suites: Suite[]; stats: { expected: number; unexpected: number; flaky: number; skipped: number } };

const [file, ...flags] = process.argv.slice(2);
if (!file) {
  console.error('usage: flaky-report.ts <results.json> [--max=N]');
  process.exit(2);
}
const max = Number(flags.find((f) => f.startsWith('--max='))?.split('=')[1] ?? Infinity);

const report: Report = JSON.parse(readFileSync(file, 'utf8'));

function* specs(suites: Suite[], path: string[] = []): Generator<{ spec: Spec; path: string[] }> {
  for (const suite of suites) {
    const here = suite.title && !suite.title.endsWith('.ts') ? [...path, suite.title] : path;
    for (const spec of suite.specs ?? []) yield { spec, path: here };
    yield* specs(suite.suites ?? [], here);
  }
}

const flaky = [];
for (const { spec, path } of specs(report.suites)) {
  for (const test of spec.tests) {
    if (test.status !== 'flaky') continue;
    const firstFailure = test.results.find((r) => r.status !== 'passed');
    flaky.push({
      name: [...path, spec.title].join(' › '),
      project: test.projectName,
      location: `${spec.file}:${spec.line}`,
      attempts: test.results.length,
      // First line only, without ANSI colors, so the summary table stays readable.
      error: (firstFailure?.error?.message ?? '').split('\n')[0].replace(/\u001b\[[0-9;]*m/g, '').slice(0, 120),
    });
  }
}

const { expected, unexpected, skipped } = report.stats;
const lines = [
  '## Flaky tests',
  '',
  `passed: ${expected} · failed: ${unexpected} · flaky: ${flaky.length} · skipped: ${skipped}`,
  '',
];
if (flaky.length === 0) {
  lines.push('No flaky tests in this run.');
} else {
  lines.push('| Test | Project | Location | Attempts | First error |', '|---|---|---|---|---|');
  for (const f of flaky) lines.push(`| ${f.name} | ${f.project} | \`${f.location}\` | ${f.attempts} | ${f.error.replace(/\|/g, '\\|')} |`);
}

const output = lines.join('\n');
console.log(output);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, output + '\n');

if (flaky.length > max) {
  console.error(`\n${flaky.length} flaky tests, limit is ${max}.`);
  process.exit(1);
}
