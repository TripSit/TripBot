'use strict';

const ytSearch = require('youtube-search');
const path = require('path');
const logger = require('./logger');

const {
  YouTubeApiToken,
} = require('../../../env');

const PREFIX = path.parse(__filename).name;

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
