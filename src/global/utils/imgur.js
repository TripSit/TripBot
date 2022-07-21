'use strict';

const axios = require('axios');
const PREFIX = require('path').parse(__filename).name;
const logger = require('./logger');

const {
  imgurId,
} = require('../../../env');

module.exports = {

  async search(query) {
    const url = `https://api.imgur.com/3/gallery/search/?q=${query}`;
    logger.debug(`[${PREFIX}] url: ${url}`);
    logger.debug(`[${PREFIX}] imgurSecret: ${imgurId}`);
    return new Promise((resolve, reject) => {
      axios.get(url, {
        headers: {
          Authorization: `Client-ID ${imgurId}`,
        },
      }).then(res => {
        let imageLink = '';

        if (res.data.data.length > 0) {
          let topUps = 0;
          let topPost = {};

          // Get the most popular result
          // eslint-disable-next-line no-restricted-syntax
          for (const i in res.data.data) {
            if (res.data.data[i].ups) {
              // logger.debug(`[${PREFIX}] ups: ${res.data.data[i].ups}`);
              if (res.data.data[i].ups > topUps) {
                topPost = res.data.data[i];
                topUps = res.data.data[i].ups;
                // logger.debug(`[${PREFIX}] New top post!`);
              }
            }
          }
          // logger.debug(`[${PREFIX}] topPost: ${JSON.stringify(topPost, null, 2)}`);

          // If it's an album, pull the first image
          if (topPost.is_album) {
            // Only gifv and mp4s display on discord.
            // Find the "gifv" property, if that doesnt exist find the "link"
            if (topPost.images[0].gifv) {
              imageLink = topPost.images[0].gifv;
            } else {
              imageLink = topPost.images[0].link;
            }
          } else if (topPost.gifv) {
            imageLink = topPost.gifv;
          } else if (topPost.link) {
            imageLink = topPost.link;
          }
        } else {
          logger.debug(`[${PREFIX}] No results found!`);
          imageLink = `No results found for ${query}!`;
        }

        logger.debug(`[${PREFIX}] imageLink: ${imageLink}`);

        resolve(imageLink);
      }).catch(err => { reject(err); });
    });
  },
};
