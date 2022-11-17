import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ButtonInteraction,
} from 'discord.js';
import {SlashCommand} from '../../@types/commandDef';
// import {embedTemplate} from '../../utils/embedTemplate';
// import {stripIndents} from 'common-tags';
// import env from '../../../global/utils/env.config';
import log from '../../../global/utils/log';
import * as path from 'path';
import {tripsitmeButton, tripsitmeClose} from '../../utils/tripsitme';
const PREFIX = path.parse(__filename).name;

export const tripsitmode: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('tripsitmode')
    .setDescription(
      'This command will apply the NeedsHelp role onto a user, and remove other roles!',
    )
    .addSubcommand(subcommand => subcommand
      .setName('on')
      .setDescription('Turn on Tripsit Mode')
      .addUserOption(option => option
        .setName('user')
        .setDescription('Member to help')
        .setRequired(true)))
    .addSubcommand(subcommand => subcommand
      .setName('off')
      .setDescription('Turn off Tripsit Mode')
      .addUserOption(option => option
        .setName('user')
        .setDescription('Member to stop helping')
        .setRequired(true))),
  async execute(interaction:ChatInputCommandInteraction) {
    const enable = interaction.options.getSubcommand();

    const targetMember = interaction.options.getMember('user');

    log.debug(`[${PREFIX}] 
    enable: ${enable}
    targetMember: ${targetMember}
    `);

    if (enable === 'on') {
      const testInteraction = {
        client: interaction.client,
        id: interaction.id,
        customId: `tripsitmodeOn~${targetMember}`,
        guild: interaction.guild,
        member: targetMember,
        user: interaction.user,
        channel: interaction.channel,
        deferReply: () => {
          return interaction.deferReply();
        },
        reply: content => {
          if (interaction.deferred || interaction.replied) {
            return interaction.followUp(content);
          } else {
            return interaction.reply(content);
          }
        },
        followUp: content => {
          return interaction.followUp(content);
        },
        showModal: modal => {
          return interaction.showModal(modal);
        },
        awaitModalSubmit: params => {
          return interaction.awaitModalSubmit(params);
        },
      } as ButtonInteraction;
      tripsitmeButton(testInteraction);
    }
    if (enable === 'off') {
      const testInteraction = {
        client: interaction.client,
        id: interaction.id,
        customId: `tripsitmodeOn~${targetMember}`,
        guild: interaction.guild,
        member: targetMember,
        user: interaction.user,
        channel: interaction.channel,
        deferReply: () => {
          return interaction.deferReply();
        },
        reply: content => {
          if (interaction.deferred || interaction.replied) {
            return interaction.followUp(content);
          } else {
            return interaction.reply(content);
          }
        },
        followUp: content => {
          return interaction.followUp(content);
        },
        showModal: modal => {
          return interaction.showModal(modal);
        },
        awaitModalSubmit: params => {
          return interaction.awaitModalSubmit(params);
        },
      } as ButtonInteraction;
      tripsitmeClose(testInteraction);
    }
    return true;
  },
};
