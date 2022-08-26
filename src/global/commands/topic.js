'use strict';

const topics = require('../assets/data/topics.json');

module.exports = {
  async topic() {
    const randomTopic = topics[Math.floor(Math.random() * Object.keys(topics).length).toString()];
    return randomTopic;
  },
};
