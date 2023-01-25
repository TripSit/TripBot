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
import { rssCreate, rssList, rssDelete } from '../../../global/commands/g.rss';
import { startLog } from '../../utils/startLog';

const F = f(__filename);

export default dRss;

export const dRss: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('rss')
    .setDescription('Add or remove a subscription to an RSS feed!')
    .addSubcommand(subcommand => subcommand
      .setName('add')
      .setDescription('Add an RSS subscription to this channel')
      .addStringOption(option => option.setName('url')
        .setDescription('URL of the RSS feed, ends with .rss')
        .setRequired(true))
      .addChannelOption(option => option.setName('channel')
        .setDescription('Where to post this feed?')
        .setRequired(true)))
    .addSubcommand(subcommand => subcommand
      .setName('remove')
      .setDescription('Remove an RSS feed from this channel')
      .addChannelOption(option => option.setName('channel')
        .setDescription('Remove RSS feed from which channel?')
        .setRequired(true)))
    .addSubcommand(subcommand => subcommand
      .setName('list')
      .setDescription('List all RSS feeds')),
  async execute(interaction) {
    startLog(F, interaction);

    if (!interaction.guild) return false;

    const channel = interaction.options.getChannel('channel');
    const subcommand = interaction.options.getSubcommand();

    const verb = subcommand === 'add' ? 'added' : 'removed';
    const preposition = subcommand === 'add' ? 'to' : 'from';

    const embed = embedTemplate()
      .setColor(subcommand === 'add' ? Colors.Green : Colors.Red);

    if (subcommand === 'add') {
      if (!(channel instanceof TextChannel)) {
        await interaction.reply({
          content: 'You must specify a text channel!',
          ephemeral: true,
        });
        return false;
      }
      const url = interaction.options.getString('url', true);
      await rssCreate(channel.id, channel.guild.id, url);
      embed.setColor(Colors.Green);
      embed.setTitle(`RSS feed ${verb} ${preposition} ${channel.name}!`);
      embed.setDescription(`I've started watching ${url}!`);
    } else if (subcommand === 'list') {
      const results = await rssList(interaction.guild.id);
      // log.debug(F, `results: ${JSON.stringify(results, null, 2)}`);
      if (results.length > 0) {
        embed.setColor(Colors.Purple);
        embed.setTitle(`${interaction.guild.name} has the following RSS feeds:!`);
        let description = '';
        results.forEach(element => {
          description += `${element.url} -> <#${element.destination}>`;
        });
        embed.setDescription(description);
      } else {
        embed.setColor(Colors.Purple);
        embed.setTitle(`${interaction.guild.name} has no RSS feeds!`);
      }
    } else if (subcommand === 'remove') {
      if (!(channel instanceof TextChannel)) {
        await interaction.reply({
          content: 'You must specify a text channel!',
          ephemeral: true,
        });
        return false;
      }
      await rssDelete(channel.id, channel.guild.id);
      embed.setColor(Colors.Red);
      embed.setTitle(`RSS feed ${verb} ${preposition} ${channel.name}!`);
    }

    interaction.reply({ embeds: [embed], ephemeral: true });
    return true;
  },
};
