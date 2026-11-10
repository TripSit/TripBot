'use strict';

const execute = (...args) => { module.exports.calls.push(['on', ...args]); };
module.exports = { onEvent: { name: 'messageCreate', execute }, calls: [] };
