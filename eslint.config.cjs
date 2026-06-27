const js = require('@eslint/js');
const tseslint = require('typescript-eslint');

module.exports = [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.ts'],
    rules: {
      semi: ['error', 'always'],
      quotes: ['error', 'single'],
    },
  },
  {
    ignores: ['node_modules', 'dist', 'out'],
  },
];
