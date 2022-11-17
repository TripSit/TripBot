'use strict';

module.exports = {
  'root': true,
  'extends': [
    'google',
  ],
  'parserOptions': {
    'sourceType': 'script',
    'ecmaVersion': 2022,
  },
  'rules': {
    // This requires that you have "use strict" at the top of every file.
    // https://www.w3schools.com/js/js_strict.asp
    // THIS IS NOT NECESSARY because we use "strict" in the typescript file
    // 'strict': [2, 'global'],
    // This is somewhat nice to have, but it's not necessary. SC prefers this
    'arrow-parens': [2, 'as-needed'],
    // This is a personal preference to enforce good code
    '@typescript-eslint/no-non-null-assertion': 'warn',
    '@typescript-eslint/indent': [
      'error',
      2,
    ],
    'indent': 'off',
    'linebreak-style': ['error', 'unix'],
    'max-len': ['error', {'code': 120}],
  },
  'env': {
    'node': true,
    'browser': true,
    'commonjs': true,
    'es2021': true,
  },

  'parser': '@typescript-eslint/parser',

  'plugins': [
    '@typescript-eslint',
  ],
};
