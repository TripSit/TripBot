import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
} from 'discord.js';
import {SlashCommand} from '../../utils/commandDef';
import {stripIndents} from 'common-tags';
import {bridgeWording} from '../../../global/commands/g.bridge';
// import logger from '../../../global/utils/logger';
// const PREFIX = require('path').parse(__filename).name;

export const bridge: SlashCommand = {
  data: new SlashCommandBuilder()
      .setName('bridge')
      .setDescription('Information on the bridge!'),
  execute: async (interaction: ChatInputCommandInteraction) => {
    // logger.debug(`[${PREFIX}] starting!`);
    const response = await bridgeWording();
    interaction.reply(stripIndents`${response}`);
    // logger.debug(`[${PREFIX}] finished!`);
  },
};
