import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
} from 'discord.js';
import {SlashCommand} from '../../utils/commandDef';
import {grounding} from '../../../global/commands/g.grounding';
// import logger from '../../../global/utils/logger';
// const PREFIX = require('path').parse(__filename).name;

export const discordTemplate: SlashCommand = {
  data: new SlashCommandBuilder()
      .setName('grounding')
      .setDescription('Send an image with the 5-senses grounding exercise'),
  async execute(interaction:ChatInputCommandInteraction) {
    // logger.debug(`[${PREFIX}] starting!`);
    interaction.reply(await grounding());
    // logger.debug(`[${PREFIX}] finished!`);
  },
};
