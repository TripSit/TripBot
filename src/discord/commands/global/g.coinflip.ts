import {
  SlashCommandBuilder,
} from 'discord.js';
import {SlashCommand} from '../../utils/commandDef';
import logger from '../../../global/utils/logger';
import {coinflip} from '../../../global/commands/g.coinflip';

import * as path from 'path';
const PREFIX = path.parse(__filename).name;

export const discordTemplate: SlashCommand = {
  data: new SlashCommandBuilder()
      .setName('coinflip')
      .setDescription('Flip a coin'),
  async execute(interaction) {
    interaction.reply(await coinflip());
    logger.debug(`[${PREFIX}] finished!`);
  },

};
