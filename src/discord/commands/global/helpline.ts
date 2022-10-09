import {
  SlashCommandBuilder,
} from 'discord.js';
import {SlashCommand} from '../../@types/commandDef';
import {embedTemplate} from '../../utils/embedTemplate';
import logger from '../../../global/utils/logger';
import * as path from 'path';
const PREFIX = path.parse(__filename).name;

export const dwarmline: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('helpline')
    .setDescription('Need immediate assistance? Use these crisis lines!'),

  async execute(interaction) {
    const embed = embedTemplate()
      .setDescription(`Hey friend! It seems like you're having a tough time right now. \
        If you are experiencing a mental health crisis, please reach out to your local crisis line:

        US: call 988 or text HOME to 741741
        Canada: call 1-833-456-4566 or text HOME to 74141
        UK: call 116 123 or text SHOUT to 85258
        
        Check https://blog.opencounseling.com/suicide-hotlines/ to find crisis lines for all other countries.`);
    interaction.reply({embeds: [embed], ephemeral: false});
    logger.debug(`[${PREFIX}] finished!`);
  },
};
