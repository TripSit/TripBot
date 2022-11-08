import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ButtonInteraction,
} from 'discord.js';
import {SlashCommand} from '../../@types/commandDef';
// import {embedTemplate} from '../../utils/embedTemplate';
// import {stripIndents} from 'common-tags';
// import env from '../../../global/utils/env.config';
import logger from '../../../global/utils/logger';
import * as path from 'path';
import {tripsitmeClick, tripsitmeFinish} from '../../utils/tripsitme';
const PREFIX = path.parse(__filename).name;

export const tripsitmode: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('tripsitmode')
    .setDescription(
      'This command will apply the NeedsHelp role onto a user, and remove other roles!',
    )
    .addSubcommand((subcommand) => subcommand
      .setName('on')
      .setDescription('Turn on Tripsit Mode')
      .addUserOption((option) => option
        .setName('user')
        .setDescription('Member to help')
        .setRequired(true))
      .addRoleOption((option) => option
        .setName('roleneedshelp')
        .setDescription('What is your "needs help" role?')
        .setRequired(true))
      .addRoleOption((option) => option
        .setName('roletripsitter')
        .setDescription(`What's your 'tripsitter' role?`)
        .setRequired(true))
      .addChannelOption((option) => option
        .setName('channeltripsit')
        .setDescription(`What's your 'tripsit' channel?`)
        .setRequired(true)))
    .addSubcommand((subcommand) => subcommand
      .setName('off')
      .setDescription('Turn off Tripsit Mode')
      .addUserOption((option) => option
        .setName('user')
        .setDescription('Member to help')
        .setRequired(true))
      .addRoleOption((option) => option
        .setName('roleneedshelp')
        .setDescription(`What's your 'needs help' role?`)
        .setRequired(true))
      .addChannelOption((option) => option
        .setName('channelmetatripsit')
        .setDescription(`What's your 'tripsit' channel?`)
        .setRequired(true))),
  async execute(interaction:ChatInputCommandInteraction) {
    const enable = interaction.options.getSubcommand();

    const targetUser = interaction.options.getUser('user', true);
    const roleTripsitter = interaction.options.getRole('roletripsitter');
    const roleNeedshelp = interaction.options.getRole('roleneedshelp', true);
    const channelTripsit = interaction.options.getChannel('channeltripsit');
    const channelMetaTripsit = interaction.options.getChannel('channelmetatripsit');

    logger.debug(`[${PREFIX}] 
    enable: ${enable}
    targetUser: ${targetUser}
    roleTripsitter: ${roleTripsitter}
    roleNeedshelp: ${roleNeedshelp}
    channeltripsit: ${channelTripsit}
    channelMetatripsit: ${channelMetaTripsit}
    `);

    if (enable === 'on') {
      const testInteraction = {
        client: interaction.client,
        id: interaction.id,
        customId: `tripsitmodeOn~${roleNeedshelp.id}~${roleTripsitter?.id}~${channelTripsit?.id}~${targetUser.id}`,
        guild: interaction.guild,
        member: interaction.member,
        channel: interaction.channel,
        deferReply: () => {
          return interaction.deferReply();
        },
        reply: (content) => {
          if (interaction.deferred || interaction.replied) {
            return interaction.followUp(content);
          } else {
            return interaction.reply(content);
          }
        },
        followUp: (content) => {
          return interaction.followUp(content);
        },
        showModal: (modal) => {
          return interaction.showModal(modal);
        },
        awaitModalSubmit: (params) => {
          return interaction.awaitModalSubmit(params);
        },
      } as ButtonInteraction;
      tripsitmeClick(testInteraction);
    }
    if (enable === 'off') {
      const testInteraction = {
        client: interaction.client,
        id: interaction.id,
        customId: `tripsitmodeOff~them~${targetUser.id}~${roleNeedshelp.id}~${channelMetaTripsit?.id}`,
        guild: interaction.guild,
        member: interaction.member,
        channel: interaction.channel,
        deferReply: () => {
          return interaction.deferReply();
        },
        editReply: (content) => {
          return interaction.editReply(content);
        },
        reply: (content) => {
          if (interaction.deferred || interaction.replied) {
            return interaction.followUp(content);
          } else {
            return interaction.reply(content);
          }
        },
        followUp: (content) => {
          return interaction.followUp(content);
        },
        showModal: (modal) => {
          return interaction.showModal(modal);
        },
        awaitModalSubmit: (params) => {
          return interaction.awaitModalSubmit(params);
        },
      } as ButtonInteraction;
      tripsitmeFinish(testInteraction);
    }
  },
};
