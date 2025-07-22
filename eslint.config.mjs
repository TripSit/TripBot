import eslint from '@eslint/js';
import prettierConfigFlat from 'eslint-config-prettier/flat';
// import perfectionist from 'eslint-plugin-perfectionist';
import prettier from 'eslint-plugin-prettier';
import sonarjs from 'eslint-plugin-sonarjs';
import unicorn from 'eslint-plugin-unicorn';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  {
    ignores: [
      'build/**',
      '**/archive/**',
      '**/legacy/**',
      '**/matrix/**',
      '**/telegram/**',
      '**/irc/**',
      '**/jest/**',
      '**/tests/**',
      '**/node_modules/**',
      '**/dist/**',
      '**/coverage/**',
      '**/logs/**',
      '**/temp/**',
      '**/@prisma-moodle/**',
    ],
  },
  // Prettier plugin config block
  unicorn.configs.recommended,
  // perfectionist.configs['recommended-natural'],
  {
    plugins: {
      prettier,
      sonarjs,
    },
    rules: {
      'prettier/prettier': 'error',
      'sonarjs/cognitive-complexity': ['warn', 50],
      'unicorn/filename-case': 'off',
      'unicorn/prevent-abbreviations': 'off',
    },
  },
  // Disable conflicting rules via config-prettier
  prettierConfigFlat,
  {
    languageOptions: {
      globals: globals.browser,
      parser: tseslint.parser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
    rules: {
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/explicit-function-return-type': ['error', { allowExpressions: false }],
      '@typescript-eslint/explicit-module-boundary-types': 'error',
      '@typescript-eslint/no-floating-promises': ['error', { ignoreIIFE: false }],
      '@typescript-eslint/no-misused-promises': ['error', { checksVoidReturn: true }],
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          ignoreRestSiblings: true,
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/prefer-readonly': 'error',
      '@typescript-eslint/promise-function-async': 'error',
      '@typescript-eslint/return-await': 'error',
      '@typescript-eslint/strict-boolean-expressions': 'error',
      curly: 'error',
      eqeqeq: 'error',
      'no-console': 'error',
      'no-debugger': 'error',
      'no-fallthrough': 'error',
      'no-implicit-coercion': 'error',
      'no-implicit-globals': 'error',
      'no-multi-str': 'error',
      'no-param-reassign': ['error', { props: true }],
      'no-shadow': 'error',
      'no-throw-literal': 'error',
      'no-unused-vars': 'off',
      'no-var': 'error',
      'prefer-arrow-callback': 'error',
      'prefer-const': 'error',
      'require-await': 'error',
    },
    settings: {
      'import/resolver': {
        node: true,
        typescript: true,
      },
    },
  },
  {
    files: ['**/*.{js,cjs,mjs}'],
    ...tseslint.configs.disableTypeChecked,
  },
  {
    files: ['eslint.config.*'],
    languageOptions: {
      parserOptions: {
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': 'off', // you might have imports that aren't used
    },
  },
);
