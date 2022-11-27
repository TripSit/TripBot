'use strict';

module.exports = {
  root: true,
  env: {
    node: true,
    // 'browser': true, // I had this set before but idk why
    // 'commonjs': true, // I had this set before but idk why
    es2022: true,
  },
  extends: [
    'airbnb-base',
  ],
  plugins: [
    '@typescript-eslint',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    sourceType: 'script',
    ecmaVersion: 2022,
  },
  rules: {
    // This enforces strict checks on .js files, it's not necessary for .ts files
    // https://www.w3schools.com/js/js_strict.asp
    strict: [2, 'global'],
    // Removes () around single parameter arrow functions
    'arrow-parens': [2, 'as-needed'],
    // This is a personal preference to enforce good code
    '@typescript-eslint/no-non-null-assertion': 'warn',
    'max-len': ['warn', { code: 120 }],
    '@typescript-eslint/no-explicit-any': 'warn',
  },

  overrides: [
    {
      files: ['**/*.ts'],
      extends: [
        'airbnb-base',
        'airbnb-typescript/base',
      ],
      parserOptions: {
        project: './tsconfig.json',
      },
      rules: {
        // This enforces strict checks on .js files, it's not necessary for .ts files
        // https://www.w3schools.com/js/js_strict.asp
        strict: [2, 'global'],
        // Removes () around single parameter arrow functions
        'arrow-parens': [2, 'as-needed'],
        // This is a personal preference to enforce good code
        '@typescript-eslint/no-non-null-assertion': 'warn',
        'max-len': ['warn', { code: 120 }],
      },
    },
  ],

};
