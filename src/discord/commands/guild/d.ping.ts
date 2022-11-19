/* eslint-disable @typescript-eslint/no-unused-vars */

import {
  ButtonInteraction,
  ModalSubmitInteraction,
  ModalBuilder,
  ActionRowBuilder,
  TextInputBuilder,
  Colors,
  TextChannel,
  GuildMember,
  ChannelType,
  ThreadChannel,
  time,
  User,
  ButtonBuilder,
  SelectMenuBuilder,
  SelectMenuInteraction,
  Role,
  PermissionsBitField,
  CategoryChannel,
  SlashCommandBuilder,
  EmbedBuilder,
} from 'discord.js';
import {
  TextInputStyle,
  // ChannelType,
  ButtonStyle,
  PermissionFlagsBits,
} from 'discord-api-types/v10';
import { parse } from 'path';
import env from '../../../global/utils/env.config';
import { startLog } from '../../utils/startLog';
import { SlashCommand } from '../../@types/commandDef';
import log from '../../../global/utils/log';
import { paginationEmbed } from '../../utils/pagination';

const PREFIX = parse(__filename).name;

export default ping;

export const ping: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Health check'),
  async execute(interaction) {
    startLog(PREFIX, interaction);

    if (!interaction.guild) {
      interaction.reply({ content: 'This command can only be used in a server', ephemeral: true });
      return false;
    }

    const command = 'modal' as string;

    if (command === 'modal') {
      // Create the modal
      const modal = new ModalBuilder()
        .setCustomId(`testModal~${interaction.id}`)
        .setTitle('testModal');
      modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder()
        .setCustomId('test')
        .setRequired(true)
        .setLabel('Test')
        .setStyle(TextInputStyle.Paragraph)));
      await interaction.showModal(modal);

      // Collect a modal submit interaction
      const filter = (i:ModalSubmitInteraction) => i.customId.startsWith('testModal');
      interaction.awaitModalSubmit({ filter, time: 0, dispose: true })
        .then(async i => {
          if (i.customId.split('~')[1] !== interaction.id) return;
          const test = i.fields.getTextInputValue('test');
          interaction.reply({ content: test, ephemeral: true });
        });
    }

    if (command === 'role check') {
      const role = interaction.guild.roles.cache.find(r => r.name === 'TripBot');

      if (env.DISCORD_CLIENT_ID) {
        const user = await interaction.client.users.fetch(env.DISCORD_CLIENT_ID) as User;
        log.debug(`[${PREFIX}] user: ${user}`);
        user.send('Hello!');
      }

      const embed1 = new EmbedBuilder()
        .setTitle('First Page')
        .setDescription(`
          role.icon: ${role?.icon}
          role.iconUrl: ${role?.iconURL()}
          role.unicodeEmoji: ${role?.unicodeEmoji}
          `);

      const embed2 = new EmbedBuilder()
        .setTitle('Second Page')
        .setDescription('This is the second page');

      const button1 = new ButtonBuilder()
        .setCustomId('previousbtn')
        .setLabel('Previous')
        .setStyle(ButtonStyle.Danger);

      const button2 = new ButtonBuilder()
        .setCustomId('nextbtn')
        .setLabel('Next')
        .setStyle(ButtonStyle.Success);

      // Create an array of embeds
      const pages = [
        embed1,
        embed2,
        // ....
        // embedN
      ];

      // create an array of buttons

      const buttonList = [
        button1,
        button2,
      ];
      // Call the paginationEmbed method, first three arguments are required
      // timeout is the time till the reaction collectors are active,
      // after this you can't change pages (in ms), defaults to 120000
      paginationEmbed(interaction, pages, buttonList, 120000);
      // There you go, now you have paged embeds
    }
    return false;
  },
};
