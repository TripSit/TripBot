/* eslint-disable no-unused-vars */
import {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  Colors,
  SlashCommandBuilder,
  ChatInputCommandInteraction,
} from 'discord.js';
import {
  ApplicationCommandType,
  ChannelType,
  ButtonStyle,
  TextInputStyle,
} from 'discord-api-types/v10';
import {SlashCommand} from '../../utils/commandDef';
import {embedTemplate} from '../../utils/embedTemplate';
import {stripIndents} from 'common-tags';
import {globalTemplate} from '../../../global/commands/_g.template';
import {grounding} from '../../../global/commands/g.grounding';
import env from '../../../global/utils/env.config';
import logger from '../../../global/utils/logger';
const PREFIX = require('path').parse(__filename).name;

export const discordTemplate: SlashCommand = {
  data: new SlashCommandBuilder()
      .setName('grounding')
      .setDescription('Send an image with the 5-senses grounding exercise'),
  async execute(interaction:ChatInputCommandInteraction) {
    logger.debug(`[${PREFIX}] starting!`);
    interaction.reply(await grounding());
    logger.debug(`[${PREFIX}] finished!`);
  },
};


