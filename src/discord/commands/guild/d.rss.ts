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
  MessageFlags,
  TextInputStyle,
} from 'discord-api-types/v10';
import Parser from 'rss-parser';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import { rssCreate, rssList, rssDelete } from '../../../global/commands/g.rss';
import commandContext from '../../utils/context';

const F = f(__filename);

const testUrl = 'https://www.reddit.com/r/TripSit/new.rss'; // eslint-disable-line

export const dRss: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('rss')
    .setDescription('Add or remove a subscription to an RSS feed!')
    .setIntegrationTypes([0])
    .addSubcommand(subcommand => subcommand
      .setName('add')
      .setDescription('Add an RSS subscription to this channel')
      .addStringOption(option => option.setName('url')
        .setDescription('URL of the RSS feed, ends with .rss')
        .setRequired(true))
      .addChannelOption(option => option.setName('add_to_channel')
        .setDescription('Where to post this feed?')
        .setRequired(true)))
    .addSubcommand(subcommand => subcommand
      .setName('remove')
      .setDescription('Remove an RSS feed from this channel')
      .addChannelOption(option => option.setName('remove_from_channel')
        .setDescription('Remove RSS feed from which channel?')
        .setRequired(true)))
    .addSubcommand(subcommand => subcommand
      .setName('list')
      .setDescription('List all RSS feeds')),
  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    if (!interaction.guild) {
      await interaction.editReply({ content: 'This command can only be used in a guild!' });
      return false;
    }

    const subcommand = interaction.options.getSubcommand();

    const verb = subcommand === 'add' ? 'added' : 'removed';
    const preposition = subcommand === 'add' ? 'to' : 'from';

    const embed = embedTemplate()
      .setColor(subcommand === 'add' ? Colors.Green : Colors.Red);

    if (subcommand === 'add') {
      const url = interaction.options.getString('url', true);
      if (!url.endsWith('.rss')) {
        await interaction.editReply({ content: 'You must use a URL ending with .rss!' });
        return false;
      }

      const parser: Parser<any> = new Parser({ // eslint-disable-line @typescript-eslint/no-explicit-any
        timeout: 1000,
      });

      try {
        await parser.parseURL(url);
      } catch (e) {
        log.error(F, `Error parsing URL: ${e}`);
        await interaction.editReply({ content: 'This is not a valid RSS URL, please check it and try again!' });
        return false;
      }

      const channel = interaction.options.getChannel('add_to_channel');
      // log.debug(F, `channel: ${JSON.stringify(channel, null, 2)}`);
      if (!(channel instanceof TextChannel)) {
        // log.error(F, 'channel is not a text channel');
        // log.debug(F, `channel instanceof TextChannel: ${channel instanceof TextChannel}`);
        await interaction.editReply({ content: 'You must specify a text channel!' });
        return false;
      }
      await rssCreate(channel.id, interaction.guild.id, url);
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
      const channel = interaction.options.getChannel('remove_from_channel');
      if (!(channel instanceof TextChannel)) {
        await interaction.editReply({ content: 'You must specify a text channel!' });
        return false;
      }
      await rssDelete(channel.id, channel.guild.id);
      embed.setColor(Colors.Red);
      embed.setTitle(`RSS feed ${verb} ${preposition} ${channel.name}!`);
    }

    await interaction.editReply({ embeds: [embed] });
    return true;
  },
};

export default dRss;
