'use strict';

const ytSearch = require('youtube-search');
const PREFIX = require('path').parse(__filename).name;
const logger = require('./logger');

const {
  YouTubeApiToken,
} = require('../../../env');

module.exports = {

  async search(query) {
    return new Promise((resolve, reject) => {
      ytSearch(query, { maxResults: 1, key: YouTubeApiToken }, (err, result) => {
        if (err) {
          logger.debug(`[${PREFIX}] rejected!`);
          reject(err);
        }
        logger.debug(`[${PREFIX}] finished!`);
        resolve(result);
      });
    });
  },

};
