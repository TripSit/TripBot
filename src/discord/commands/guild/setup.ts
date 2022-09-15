/* eslint-disable no-unused-vars */
import {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  Colors,
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  ButtonBuilder,
  TextChannel,
} from 'discord.js';
import {
  ApplicationCommandType,
  ChannelType,
  ButtonStyle,
  TextInputStyle,
} from 'discord-api-types/v10';
import {SlashCommand} from '../../@types/commandDef';
import {embedTemplate} from '../../utils/embedTemplate';
import {stripIndents} from 'common-tags';
import {globalTemplate} from '../../../global/commands/_g.template';
import env from '../../../global/utils/env.config';
import logger from '../../../global/utils/logger';
import * as path from 'path';
const PREFIX = path.parse(__filename).name;

export const discordTemplate: SlashCommand = {
  data: new SlashCommandBuilder()
      .setName('setup')
      .setDescription('Setup TripSit in your server!'),
  async execute(interaction:ChatInputCommandInteraction) {
    logger.debug(`[${PREFIX}] starting!`);
    await interaction.deferReply({ephemeral: true});

    // Create the tripsitter role
    const tripsitterRole = await interaction.guild!.roles.create({
      name: 'Tripsitter',
      color: 'Blue',
      permissions: [
        PermissionFlagsBits.SendMessagesInThreads,
        PermissionFlagsBits.EmbedLinks,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.AddReactions,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.UseExternalEmojis,
      ],
    });

    // Create the tripsit channel
    const tripsitChannel = await interaction.guild?.channels.create({
      name: 'tripsit',
      type: ChannelType.GuildText,
      topic: 'Use this channel to ask for help from a Tripsitter!',
      reason: 'Tripsit setup',
      permissionOverwrites: [
        {
          id: tripsitterRole.id,
          deny: [PermissionFlagsBits.ViewChannel],
        },
      ],
    });

    // Send the initial message
    const buttonText = stripIndents`
      Welcome to the TripSit room!

      **Need to talk with a tripsitter? Click the buttom below!**
      Share what substance you're asking about, time and size of dose, and any other relevant info.
      This will create a new thread and alert the community that you need assistance!
      🛑 Please do not message tripsitters directly! 🛑

      Stay safe!
    `;
    const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('tripsitme')
                .setLabel('I need assistance!')
                .setStyle(ButtonStyle.Primary),
        );
    await (tripsitChannel as TextChannel).send({content: buttonText, components: [row]});

    // Create the tripsitter channel
    const tripsitterChannel = await interaction.guild?.channels.create({
      name: 'tripsitters',
      type: ChannelType.GuildText,
      topic: 'Use this room to talk about #tripsit encounters!',
      reason: 'Tripsit setup',
      permissionOverwrites: [
        {
          id: tripsitterRole.id,
          deny: [PermissionFlagsBits.ViewChannel],
        },
      ],
    });

    await (tripsitterChannel as TextChannel).send(
        {content: stripIndents`
        Welcome to the Tripsitters room!

        As people need help, a thread will be created in ${tripsitChannel} and a sister-thread will be created here.
        Use the thread in ${tripsitChannel} to help the person in need, and use the thread here to talk with the team.

        ${tripsitChannel} threads are archived after 24 hours, and deleted after 7 days.

        For full details on how the ${tripsitChannel} works, please see https://discord.tripsit.me/pages/tripsit.html

        For a refresher on tripsitting please see the following resources:
        - <https://docs.google.com/document/d/1vE3jl9imdT3o62nNGn19k5HZVOkECF3jhjra8GkgvwE>
        - <https://wiki.tripsit.me/wiki/How_To_Tripsit_Online>
        `},
    );


    await interaction.editReply({content: stripIndents`
    I've created ${tripsitterRole}, ${tripsitChannel} and ${tripsitterChannel}
    You can now rename/move this role/these channels to whatever you want.
    `});
    logger.debug(`[${PREFIX}] finished!`);
  },
};
