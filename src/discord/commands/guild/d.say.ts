/* eslint-disable no-unused-vars */
import {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  Colors,
  SlashCommandBuilder,
  TextChannel,
} from 'discord.js';
import {
  TextInputStyle,
} from 'discord-api-types/v10';
import {SlashCommand} from '../../@types/commandDef';
import {embedTemplate} from '../../utils/embedTemplate';
import env from '../../../global/utils/env.config';
import logger from '../../../global/utils/logger';
import * as path from 'path';
const PREFIX = path.parse(__filename).name;

export const bug: SlashCommand = {
  data: new SlashCommandBuilder()
      .setName('say')
      .setDescription('Say something like a real person!')
      .addStringOption((option) => option.setName('say')
          .setDescription('What do you want to say?')
          .setRequired(true))
      .addChannelOption((option) => option
          .setDescription(`Where should I say it? (Default: 'here')`)
          .setName('channel'),
      ),
  async execute(interaction) {
    logger.debug(`[${PREFIX}] starting!`);
    const channel = interaction.options.getChannel('channel') as TextChannel;
    const say = interaction.options.getString('say', true);

    if (channel) {
      channel.send(say);
    } else {
      interaction.channel?.send(say);
    }

    interaction.reply({
      content: `I said '${say}' in ${channel ? channel.toString() : interaction.channel?.toString()}`,
      ephemeral: true},
    );

    logger.debug(`[${PREFIX}] finished!`);
  },
};
