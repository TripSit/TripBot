'use strict';

module.exports = function babelConfig(api) {
  api.cache(process.env.NODE_ENV !== 'production');

  return {
    plugins: [
      '@babel/plugin-proposal-optional-chaining',
    ],
  };
};
