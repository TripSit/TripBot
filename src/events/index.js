'use strict';

const fs = require('fs/promises');

module.exports = async function registerEvents(client) {
    const eventFiles = await fs.readdir(__dirname);
    eventFiles
        .filter(file => !file.endsWith('index.js'))
        .map(file => require(`./${file}`))
        .forEach(event => {
            if (event.once) client.once(event.name, (...args) => event.execute(...args));
            else client.on(event.name, (...args) => event.execute(...args, client));
        });
};
