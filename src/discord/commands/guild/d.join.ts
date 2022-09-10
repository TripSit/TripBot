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
import env from '../../../global/utils/env.config';
import logger from '../../../global/utils/logger';
const PREFIX = require('path').parse(__filename).name;

export const discordTemplate: SlashCommand = {
  data: new SlashCommandBuilder()
      .setName('join')
      .setDescription('Display a message to join a bridged channel on both sides')
      .addStringOption((option) => option
          .setRequired(true)
          .setDescription('The channel you want to send the message for')
          .addChoices(
              {name: '#🦮│tripsitters🔗', value: '#tripsitters'},
              {name: '#⛺│open-tripsit🔗', value: '#tripsit'},
              {name: '#🌅│open-tripsit-1🔗', value: '#tripsit1'},
              {name: '#🌄│open-tripsit-2🔗', value: '#tripsit2'},
              {name: '#🌃│closed-tripsit🔗', value: '#tripsit3'},
              {name: '#⛪│sanctuary🔗', value: '#sanctuary'},
              {name: '#🌃│lounge', value: '#lounge'},
              {name: '#🐉│opiates', value: '#opiates'},
              {name: '#🐆│stimchat', value: '#stimulants'},
              {name: '#🦥│depressants', value: '#depressants'},
              {name: '#👾│dissociatives', value: '#dissociatives'},
              {name: '#🍄│psychedelics', value: '#psychedelics'},
          )
          .setName('channel')),

  async execute(interaction:ChatInputCommandInteraction) {
    logger.debug(`[${PREFIX}] starting!`);

    const ircChannel = `${interaction.options.getString('channel')}`;
    let discordChannel;

    switch (ircChannel) {
      case '#tripsitters':
        discordChannel = env.CHANNEL_TRIPSITTERS;
        break;

      case '#tripsit':
        discordChannel = env.CHANNEL_OPENTRIPSIT;
        break;

      case '#tripsit1':
        discordChannel = env.CHANNEL_OPENTRIPSIT1;
        break;

      case '#tripsit2':
        discordChannel = env.CHANNEL_OPENTRIPSIT2;
        break;

      case '#tripsit3':
        discordChannel = env.CHANNEL_CLOSEDTRIPSIT;
        break;

      case '#sanctuary':
        discordChannel = env.CHANNEL_SANCTUARY;
        break;

      case '#lounge':
        discordChannel = env.CHANNEL_LOUNGE;
        break;

      case '#opiates':
        discordChannel = env.CHANNEL_OPIATES;
        break;

      case '#stimulants':
        discordChannel = env.CHANNEL_STIMULANTS;
        break;

      case '#depressants':
        discordChannel = env.CHANNEL_DEPRESSANTS;
        break;

      case '#dissociatives':
        discordChannel = env.CHANNEL_DISSOCIATIVES;
        break;

      case '#psychedelics':
        discordChannel = env.CHANNEL_PSYCHEDELICS;
        break;
    }

    interaction.reply(`🤖🔗 <#${discordChannel}> is bridged with ${ircChannel} on IRC. Just click on the channel, 
      or type /join ${ircChannel} on irc. /bridge for more information`);

    logger.debug(`[${PREFIX}] finished!`);
  },
};
