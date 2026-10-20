import js from '@eslint/js';
import globals from 'globals';
export default [
  { ignores: ['dist/**', 'evidence/**', 'test-results/**', 'playwright-report/**'] },
  js.configs.recommended,
  { files: ['**/*.mjs'], languageOptions: { globals: { ...globals.node, ...globals.browser } }, rules: { 'no-unused-vars': ['error', { argsIgnorePattern: '^_' }], 'no-control-regex': 'off' } }
];
