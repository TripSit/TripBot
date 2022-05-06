'use strict';

const path = require('path');
const { SlashCommandBuilder } = require('@discordjs/builders');
const logger = require('../../utils/logger');

const { getUserInfo } = require('../../utils/get-user-info');
const { setUserInfo } = require('../../utils/set-user-info');

const PREFIX = path.parse(__filename).name;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('chitragupta')
    .setDescription('Keep it positive please!'),

  async execute(interaction, actor, action, emoji, target) {
    logger.debug(`[${PREFIX}] ${actor} ${action} ${emoji} ${target}!`);

    if (actor === target) { return; }
    // Extract actor data
    const actorResults = await getUserInfo(actor);
    const actorData = actorResults[0];

    // Transform actor data
    if ('karma_given' in actorData) {
      logger.debug(`[${PREFIX}] Updating karma_given info!`);
      actorData.karma_given[emoji] = (actorData.karma_given[emoji] || 0) + action;
    } else {
      logger.debug(`[${PREFIX}] Creating karma_given info!`);
      actorData.karma_given = { [emoji]: action };
    }

    // Load actor data
    await setUserInfo(actorResults[1], actorData);

    // Extract target data
    const targetResults = await getUserInfo(target);
    const targetData = targetResults[0];

    // Transform target data
    if ('karma_recieved' in targetData) {
      logger.debug(`[${PREFIX}] Updating karma_recieved info!`);
      targetData.karma_recieved[emoji] = (targetData.karma_recieved[emoji] || 0) + action;
    } else {
      logger.debug(`[${PREFIX}] Creating karma_given info!`);
      targetData.karma_recieved = { [emoji]: action };
    }

    // Load target data
    await setUserInfo(targetResults[1], targetData);

    return logger.debug(`[${PREFIX}] finished!`);
  },
};
