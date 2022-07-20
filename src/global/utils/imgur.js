'use strict';

const axios = require('axios');

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
