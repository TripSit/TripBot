import {
  SlashCommandBuilder,
} from 'discord.js';
import {SlashCommand} from '../../utils/commandDef';
import {embedTemplate} from '../../utils/embedTemplate';
import logger from '../../../global/utils/logger';
import * as path from 'path';
const PREFIX = path.parse(__filename).name;

export const discordTemplate: SlashCommand = {
  data: new SlashCommandBuilder()
      .setName('warmline')
      .setDescription('(USA only) Need someone to talk to, but don\'t need a "hotline"?'),

  async execute(interaction) {
    const embed = embedTemplate()
        .setDescription('[Check out the warmline directory](https://warmline.org/warmdir.html#directory)');
    interaction.reply({embeds: [embed], ephemeral: false});
    logger.debug(`[${PREFIX}] finished!`);
  },
};
