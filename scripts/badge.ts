// Turns Playwright's JSON report into a shields.io endpoint file, so the README can show the last nightly result.
// Usage: node scripts/badge.ts <results.json> <badge.json>

import { readFileSync, writeFileSync } from 'node:fs';

const [input, output] = process.argv.slice(2);
if (!input || !output) {
  console.error('usage: badge.ts <results.json> <badge.json>');
  process.exit(2);
}

const { expected, unexpected, flaky } = JSON.parse(readFileSync(input, 'utf8')).stats;

const parts = [`${expected} passed`];
if (unexpected) parts.push(`${unexpected} failed`);
parts.push(`${flaky} flaky`);

const color = unexpected ? 'red' : flaky ? 'yellow' : 'brightgreen';

writeFileSync(output, JSON.stringify({ schemaVersion: 1, label: 'nightly', message: parts.join(' · '), color }));
console.log(`${output}: ${parts.join(' · ')}`);
