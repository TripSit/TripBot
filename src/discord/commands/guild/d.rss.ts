/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  Colors,
  SlashCommandBuilder,
  TextChannel,
  ModalSubmitInteraction,
} from 'discord.js';
import {
  TextInputStyle,
} from 'discord-api-types/v10';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import { rssCreate, rssDelete } from '../../../global/commands/g.rss';
import { startLog } from '../../utils/startLog';

const F = f(__filename);

export default dRss;

export const dRss: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('rss')
    .setDescription('Add or remove a subscription to an RSS feed!')
    .addSubcommand(subcommand => subcommand
      .setName('add')
      .setDescription('subcommand')
      .addStringOption(option => option.setName('url')
        .setDescription('URL of the RSS feed, ends with .xml')
        .setRequired(true))
      .addChannelOption(option => option.setName('channel')
        .setDescription('Where to post this feed?')
        .setRequired(true)))
    .addSubcommand(subcommand => subcommand
      .setName('remove')
      .setDescription('subcommand')
      .addChannelOption(option => option.setName('channel')
        .setDescription('Remove RSS feed from which channel?')
        .setRequired(true))),
  async execute(interaction) {
    startLog(F, interaction);

    const channel = interaction.options.getChannel('channel', true);
    if (!(channel instanceof TextChannel)) {
      await interaction.reply({
        content: 'You must specify a text channel!',
        ephemeral: true,
      });
      return false;
    }

    const subcommand = interaction.options.getSubcommand();
    const verb = subcommand === 'add' ? 'added' : 'removed';
    const preposition = subcommand === 'add' ? 'to' : 'from';

    const embed = embedTemplate()
      .setColor(subcommand === 'add' ? Colors.Green : Colors.Red)
      .setTitle(`RSS feed ${verb} ${preposition} ${channel.name}!`);

    if (subcommand === 'add') {
      const url = interaction.options.getString('url', true);
      await rssCreate(channel.id, channel.guild.id, url);
      embed.setDescription(`I've started watching ${url}!`);
    } else {
      const url = await rssDelete(channel.id, channel.guild.id);
      embed.setDescription(`I will no longer forward posts from ${url}!`);
    }

    return true;
  },
};
