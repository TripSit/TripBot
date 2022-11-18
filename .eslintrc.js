module.exports = {
  root: true,
  extends: [
    'airbnb-base',
  ],
  plugins: [
    '@typescript-eslint',
  ],
  parserOptions: {
    sourceType: 'script',
    ecmaVersion: 2022,
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
        'max-len': ['warn', { code: 120 }],
      },
    },
  ],
  rules: {
    // This requires that you have "use strict" at the top of every file.
    // https://www.w3schools.com/js/js_strict.asp
    // THIS IS NOT NECESSARY because we use "strict" in the typescript file
    // 'strict': [2, 'global'],
    // This is somewhat nice to have, but it's not necessary. SC prefers this
    'arrow-parens': [2, 'as-needed'],
    // This is a personal preference to enforce good code
    '@typescript-eslint/no-non-null-assertion': 'warn',
    // '@typescript-eslint/indent': [
    //   'error',
    //   2,
    // ],
    // 'indent': 'off',
    // 'linebreak-style': ['error', 'unix'],
    // 'max-len': ['error', { code: 120 }],
  },
  // An environment provides predefined global variables.
  // https://eslint.org/docs/latest/user-guide/configuring/language-options#specifying-environments
  env: {
    node: true,
    // 'browser': true, // I had this set before but idk why
    // 'commonjs': true, // I had this set before but idk why
    es2022: true,
  },

  // This lets me use import instead of require?
  parser: '@typescript-eslint/parser',
};
