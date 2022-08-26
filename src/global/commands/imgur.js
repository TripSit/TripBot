'use strict';

const axios = require('axios');
const PREFIX = require('path').parse(__filename).name;
const logger = require('../utils/logger');

const {
  imgurId,
} = require('../../../env');

module.exports = {

  async search(query) {
    return new Promise((resolve, reject) => {
      axios.get(query, {
        headers: {
          Authorization: `Client-ID ${imgurId}`,
        },
      }).then((res) => {
        let imageLink = '';

        if (res.data.data.length > 0) {
          // If it's an album, pull the first image
          if (res.data.data[0].is_album) {
            // Only gifv and mp4s display on discord.
            // Find the "gifv" property, if that doesnt exist find the "link"
            if (res.data.data[0].images[0].gifv) {
              imageLink = res.data.data[0].images[0].gifv;
            } else {
              imageLink = res.data.data[0].images[0].link;
            }
          } else if (res.data.data[0].gifv) {
            imageLink = res.data.data[0].gifv;
          } else if (res.data.data[0].link) {
            imageLink = res.data.data[0].link;
          }
        } else {
          logger.debug(`[${PREFIX}] No results found!`);
          imageLink = `No results found for ${query}!`;
        }

        logger.debug(`[${PREFIX}] imageLink: ${imageLink}`);

        resolve(imageLink);
      }).catch((err) => {
        reject(err);
      });
    });
  },
};
