'use strict';

const { announcements } = require('../utils/announcements');
const { karma } = require('../utils/karma');
const { experience } = require('../utils/experience');

const {
  discordGuildId,
} = require('../../env');

module.exports = {
  name: 'messageCreate',
  async execute(message) {
    // {
    //   "channelId": "960606558549594162",
    //   "guildId": "960606557622657026",
    //   "id": "983832049687363655",
    //   "createdTimestamp": 1654634239361,
    //   "type": "DEFAULT",
    //   "system": false,
    //   "content": "test",
    //   "authorId": "177537158419054592",
    //   "pinned": false,
    //   "tts": false,
    //   "nonce": "983832049582342144",
    //   "embeds": [],
    //   "components": [],
    //   "attachments": [],
    //   "stickers": [],
    //   "editedTimestamp": null,
    //   "webhookId": null,
    //   "groupActivityApplicationId": null,
    //   "applicationId": null,
    //   "activity": null,
    //   "flags": 0,
    //   "reference": null,
    //   "interaction": null,
    //   "cleanContent": "test"
    // }

    // Only run on Tripsit
    if (message.guild.id !== discordGuildId) { return; }

    // Don't run on bot messages
    if (message.author.bot) { return; }

    announcements(message);
    karma(message);
    experience(message);
  },
};
