'use strict';

module.exports = {
  apps: [{
    name: 'tripbot',
    node_args: ['--inspect'],
    script: './src/index.js',
    watch: './src',
  }],
};
