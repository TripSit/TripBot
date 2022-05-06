'use strict';

const path = require('path');
const { SlashCommandBuilder } = require('@discordjs/builders');
const logger = require('../../utils/logger');
const { getUserInfo } = require('../../utils/get-user-info');
const { setUserInfo } = require('../../utils/set-user-info');

const PREFIX = require('path').parse(__filename).name; // eslint-disable-line

module.exports = {
  data: new SlashCommandBuilder()
    .setName('chitragupta')
    .setDescription('Keep it positive please!'),

  async execute(interaction, actor, action, emoji, target) {
    logger.debug(`[${PREFIX}] ${actor} ${action} ${emoji} ${target}!`);

    if (actor === target) { return; }
    // Extract actor data
    const [actorData, actorFbid] = await getUserInfo(actor);

    // Transform actor data
    if ('karma_given' in actorData) {
      logger.debug(`[${PREFIX}] Updating karma_given info!`);
      actorData.karma_given[emoji] = (actorData.karma_given[emoji] || 0) + action;
    } else {
      logger.debug(`[${PREFIX}] Creating karma_given info!`);
      actorData.karma_given = { [emoji]: action };
    }

    // Load actor data
    await setUserInfo(actorFbid, actorData);

    // Extract target data
    const [targetData, targetFbid] = await getUserInfo(target);

    // Transform target data
    if ('karma_recieved' in targetData) {
      logger.debug(`[${PREFIX}] Updating karma_recieved info!`);
      targetData.karma_recieved[emoji] = (targetData.karma_recieved[emoji] || 0) + action;
    } else {
      logger.debug(`[${PREFIX}] Creating karma_given info!`);
      targetData.karma_recieved = { [emoji]: action };
    }

    // Load target data
    await setUserInfo(targetFbid, targetData);

    return logger.debug(`[${PREFIX}] finished!`);
  },
};
