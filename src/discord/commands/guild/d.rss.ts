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
import { t, getLocale, getCommandLocalizations } from '../../../i18n/index';

const F = f(__filename);

const testUrl = 'https://www.reddit.com/r/TripSit/new.rss'; // eslint-disable-line

export const dRss: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('rss')
    .setNameLocalizations(getCommandLocalizations('rss', 'commandName'))
    .setDescription(t('en-US', 'rss', 'commandDescription'))
    .setDescriptionLocalizations(getCommandLocalizations('rss', 'commandDescription'))
    .setIntegrationTypes([0])
    .addSubcommand(subcommand => subcommand
      .setName('add')
      .setDescription(t('en-US', 'rss', 'addSubcommand'))
      .addStringOption(option => option.setName('url')
        .setDescription(t('en-US', 'rss', 'urlOption'))
        .setDescriptionLocalizations(getCommandLocalizations('rss', 'urlOption'))
        .setRequired(true))
      .addChannelOption(option => option.setName('add_to_channel')
        .setDescription(t('en-US', 'rss', 'addToChannelOption'))
        .setDescriptionLocalizations(getCommandLocalizations('rss', 'addToChannelOption'))
        .setRequired(true)))
    .addSubcommand(subcommand => subcommand
      .setName('remove')
      .setDescription(t('en-US', 'rss', 'removeSubcommand'))
      .addChannelOption(option => option.setName('remove_from_channel')
        .setDescription(t('en-US', 'rss', 'removeFromChannelOption'))
        .setDescriptionLocalizations(getCommandLocalizations('rss', 'removeFromChannelOption'))
        .setRequired(true)))
    .addSubcommand(subcommand => subcommand
      .setName('list')
      .setDescription(t('en-US', 'rss', 'listSubcommand'))),
  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    const locale = await getLocale(interaction, 'rss');
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    if (!interaction.guild) {
      await interaction.editReply({ content: t(locale, 'rss', 'guildOnlyError') });
      return false;
    }

    const subcommand = interaction.options.getSubcommand();

    const embed = embedTemplate()
      .setColor(subcommand === 'add' ? Colors.Green : Colors.Red);

    if (subcommand === 'add') {
      const url = interaction.options.getString('url', true);
      if (!url.endsWith('.rss')) {
        await interaction.editReply({ content: t(locale, 'rss', 'invalidRssUrlError') });
        return false;
      }

      const parser: Parser<any> = new Parser({ // eslint-disable-line @typescript-eslint/no-explicit-any
        timeout: 1000,
      });

      try {
        await parser.parseURL(url);
      } catch (e) {
        log.error(F, `Error parsing URL: ${e}`);
        await interaction.editReply({ content: t(locale, 'rss', 'rssParseError') });
        return false;
      }

      const channel = interaction.options.getChannel('add_to_channel');
      if (!(channel instanceof TextChannel)) {
        await interaction.editReply({ content: t(locale, 'rss', 'textChannelError') });
        return false;
      }
      await rssCreate(channel.id, interaction.guild.id, url);
      embed.setColor(Colors.Green);
      embed.setTitle(t(locale, 'rss', 'feedAddedTitle', { channel: channel.name }));
      embed.setDescription(t(locale, 'rss', 'feedAddedDesc', { url }));
    } else if (subcommand === 'list') {
      const results = await rssList(interaction.guild.id);
      embed.setColor(Colors.Purple);
      if (results.length > 0) {
        embed.setTitle(t(locale, 'rss', 'feedListTitle', { guild: interaction.guild.name }));
        let description = '';
        results.forEach(element => {
          description += `${element.url} -> <#${element.destination}>`;
        });
        embed.setDescription(description);
      } else {
        embed.setTitle(t(locale, 'rss', 'feedListEmpty', { guild: interaction.guild.name }));
      }
    } else if (subcommand === 'remove') {
      const channel = interaction.options.getChannel('remove_from_channel');
      if (!(channel instanceof TextChannel)) {
        await interaction.editReply({ content: t(locale, 'rss', 'textChannelError') });
        return false;
      }
      await rssDelete(channel.id, channel.guild.id);
      embed.setColor(Colors.Red);
      embed.setTitle(t(locale, 'rss', 'feedRemovedTitle', { channel: channel.name }));
    }

    await interaction.editReply({ embeds: [embed] });
    return true;
  },
};

export default dRss;
