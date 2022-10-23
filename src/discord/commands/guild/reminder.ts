/* eslint-disable no-unused-vars */
/* eslint-disable max-len */
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

const reminderDict = {
  [env.CHANNEL_TEAMTRIPSIT]: 'Reminder: bloop is cool!',
  [env.CHANNEL_GENERAL]: 'Remember, #general is the first place new members see and is for SFW general discussion. We ask that you move all NSFW conversation including most drug-related talk to #lounge or the appropriate drug-specific channels to ensure a comfortable landing space for new members. On behalf of all the staff here at TripSit, we thank you for your understanding! <3',
};

export const reminder: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('reminder')
    .setDescription('Sends a reminder on what the channel is for!'),
  async execute(interaction) {
    logger.debug(`[${PREFIX}] starting!`);

    interaction.channel?.send(reminderDict[interaction.channelId]);

    interaction.reply({content: 'Reminder sent!', ephemeral: true});

    logger.debug(`[${PREFIX}] starting!`);
  },
};
