'use strict';

/* eslint-disable global-require */

const { Composer } = require('telegraf');

module.exports = Composer.compose([
  require('./start'),
  require('./drug'),
  require('./topic'),
  require('./combo'),
  require('./breathe'),
  require('./combochart'),
  require('./irc'),
]);
