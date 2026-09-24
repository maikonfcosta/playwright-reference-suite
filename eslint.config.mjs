import tseslint from 'typescript-eslint';
import playwright from 'eslint-plugin-playwright';

export default tseslint.config(
  { ignores: ['playwright-report/', 'test-results/', 'playwright/.auth/'] },
  ...tseslint.configs.recommended,
  {
    files: ['tests/**'],
    ...playwright.configs['flat/recommended'],
    rules: {
      ...playwright.configs['flat/recommended'].rules,
      // Blind waits are the main source of flaky tests. Wait for a response or an assertion instead.
      'playwright/no-wait-for-timeout': 'error',
      'playwright/no-wait-for-selector': 'error',
      'playwright/no-force-option': 'error',
      'playwright/no-skipped-test': ['error', { allowConditional: true }],
    },
  },
);
