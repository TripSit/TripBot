/* eslint-disable no-unused-vars */
import {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  Colors,
  SlashCommandBuilder,
  ChatInputCommandInteraction,
} from 'discord.js';
import {SlashCommand} from '../../utils/commandDef';
import {embedTemplate} from '../../utils/embedTemplate';
import {stripIndents} from 'common-tags';
import {globalTemplate} from '../../../global/commands/_g.template';
import env from '../../../global/utils/env.config';
import logger from '../../../global/utils/logger';
const PREFIX = require('path').parse(__filename).name;

export const discordTemplate: SlashCommand = {
  data: new SlashCommandBuilder()
      .setName('template')
      .setDescription('template')
      .addStringOption((option) => option
          .setRequired(true)
          .setDescription('test')
          .addChoices(
              {name: 'Test', value: 'test'},
          )
          .setName('test'))
      .addIntegerOption((option) => option
          .setRequired(true)
          .setDescription('test')
          .setName('test2')),
  async execute(interaction:ChatInputCommandInteraction) {
    logger.debug(`[${PREFIX}] starting!`);
    logger.debug(`[${PREFIX}] finished!`);
  },
};
