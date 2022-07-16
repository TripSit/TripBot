'use strict';

// const PREFIX = require('path').parse(__filename).name;
// const logger = require('./logger');

module.exports = {
  async breathe(choice) {
    switch (choice) {
      case undefined:
        return 'https://i.imgur.com/n5jBp45.gif';
      case '1':
        return 'https://i.imgur.com/n5jBp45.gif';
      case '2':
        return 'https://i.imgur.com/XbH6gP4.gif';
      case '3':
        return 'https://i.imgur.com/g57i96f.gif';
      case '4':
        return 'https://i.imgur.com/MkUcTPl.gif';
      default:
        return 'https://i.imgur.com/n5jBp45.gif';
    }
  },
};
