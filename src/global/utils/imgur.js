'use strict';

const axios = require('axios');
const logger = require('./logger');
// eslint-disable-next-line import/order
const PREFIX = require('path').parse(__filename).name;

module.exports = {

  async search(query) {
    const url = `https://api.imgur.com/3/gallery/search/?q=${query}`;

    return new Promise((resolve, reject) => {
      axios.get(url, {
        headers: {
          Authorization: `Client-ID ${process.env.ImgurClientID}`,
        },
      }).then(res => {
        resolve(res.data.data[0].images[0].link);
      }).catch(err => { reject(err); });
    });
  },
};
