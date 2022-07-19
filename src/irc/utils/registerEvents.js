'use strict';

const fs = require('fs/promises');
const path = require('path');

module.exports = async function registerEvents() {
  const eventFolder = path.join(__dirname, '../events');
  const eventFiles = await fs.readdir(eventFolder);
  eventFiles
    .map(file => require(`../events/${file}`)) // eslint-disable-line
    .forEach(event => {
      event.execute();
    });
};
