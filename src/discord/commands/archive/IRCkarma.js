'use strict';

const path = require('path');
const logger = require('../../../global/utils/log');
const template = require('../../utils/embed-template');
const {getGuildInfo, setGuildInfo} = require('../../../global/services/firebaseAPI');

const PREFIX = path.parse(__filename).name;

const {
  DISCORD_GUILD_ID,
} = require('../../../../env');

module.exports = {
  async karma(message) {
    // Check if '++' is in the message
    if (message.cleanContent.includes('++')) {
      log.debug(`[${PREFIX}] Found ++ in message`);
      // Find the word directly before the ++
      const wordBeforePlus = message.cleanContent.split('++')[0];
      log.debug(`[${PREFIX}] Word before ++: ${wordBeforePlus}`);

      // If the word is blank, ignore it
      if (wordBeforePlus === null ||
        wordBeforePlus === undefined ||
        wordBeforePlus.length === 0
      ) {
        return;
      }

      // If the user is typing "C++", ignore it
      if (wordBeforePlus === 'C') {
        return;
      }

      const [targetData, targetFbid] = message.client.guilds.resolve(DISCORD_GUILD_ID);

      let karmaValue = 1;
      // Transform guild data
      if (targetData.karma) {
        // Get karma value
        karmaValue = (targetData.karma[wordBeforePlus] || 0) + karmaValue;
        targetData.karma[wordBeforePlus] = karmaValue;
      } else {
        targetData.karma = {[wordBeforePlus]: karmaValue};
      }

      setGuildInfo(targetFbid, targetData);
      const embed = template
          .embedTemplate()
          .setDescription(`'${wordBeforePlus}' karma increased to ${karmaValue}!`);
      message.channel.send({
        embeds: [embed],
        ephemeral: false,
      });
    }

    if (message.cleanContent.includes('--')) {
      log.debug(`[${PREFIX}] Found -- in message`);
      // Find the word directly before the --
      const wordBeforePlus = message.cleanContent.split('--')[0];
      log.debug(`[${PREFIX}] Word before --: ${wordBeforePlus}`);

      // Extract guild data
      const tripsitGuild = message.client.guilds.resolve(DISCORD_GUILD_ID);
      const [targetData, targetFbid] = await getGuildInfo(tripsitGuild);

      let karmaValue = 1;
      // Transform guild data
      if (targetData.karma) {
        // Get karma value
        karmaValue = (targetData.karma[wordBeforePlus] || 0) - karmaValue;
        targetData.karma[wordBeforePlus] = karmaValue;
      } else {
        targetData.karma = {[wordBeforePlus]: karmaValue};
      }

      setGuildInfo(targetFbid, targetData);
      const embed = template
          .embedTemplate()
          .setDescription(`'${wordBeforePlus}' karma decreased to ${karmaValue}!`);
      message.channel.send({embeds: [embed], ephemeral: false});
    }
  },
};
