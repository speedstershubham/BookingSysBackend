const js = require('@eslint/js');
const tseslint = require('typescript-eslint');
const unusedImports = require('eslint-plugin-unused-imports');
const importPlugin = require('eslint-plugin-import');

/**
 * Codebase conventions enforced here:
 * - const arrow functions only (no function declarations)
 * - export default for modules (object, singleton, or factory result)
 * - export type for named types in *.types.ts and validation infer types
 * - @/ path alias for internal imports
 * - no unknown, no namespace, no any
 * - single quotes + semicolons (aligned with Prettier)
 */
module.exports = [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.ts'],
    plugins: {
      'unused-imports': unusedImports,
      import: importPlugin,
    },
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      semi: ['error', 'always'],
      quotes: ['error', 'single', { avoidEscape: true }],
      'func-style': ['error', 'expression', { allowArrowFunctions: true }],
      'prefer-const': 'error',
      'no-var': 'error',
      'prefer-arrow-callback': 'error',
      'arrow-body-style': ['error', 'as-needed'],
      'no-restricted-syntax': [
        'error',
        {
          selector: 'FunctionDeclaration',
          message:
            'Use const with an arrow function instead of a function declaration.',
        },
        {
          selector: 'ExportNamedDeclaration > FunctionDeclaration',
          message:
            'Use export default with a const object instead of export function.',
        },
        {
          selector: 'TSUnknownKeyword',
          message:
            'Avoid unknown; use specific types or Error with instanceof narrowing.',
        },
      ],
      '@typescript-eslint/no-namespace': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'error',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],
      'import/no-duplicates': ['error', { 'prefer-inline': true }],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['../*', '../**', './*', './**'],
              message: 'Use @/ path alias instead of relative imports.',
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      'src/**/*.types.ts',
      'src/**/validations/**/*.ts',
      'src/database/database.types.ts',
      'src/core/http/http.types.ts',
    ],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'FunctionDeclaration',
          message:
            'Use const with an arrow function instead of a function declaration.',
        },
        {
          selector: 'TSUnknownKeyword',
          message:
            'Avoid unknown; use specific types or Error with instanceof narrowing.',
        },
      ],
    },
  },
  {
    ignores: [
      'node_modules',
      'dist',
      'out',
      'eslint.config.cjs',
      'prettier.config.cjs',
    ],
  },
];
