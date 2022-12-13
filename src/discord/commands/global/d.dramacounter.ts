import {
  time,
  SlashCommandBuilder,
} from 'discord.js';
import { DateTime } from 'luxon';
import { stripIndents } from 'common-tags';
import { dramacounter } from '../../../global/commands/g.dramacounter';
import { startLog } from '../../utils/startLog';
import { embedTemplate } from '../../utils/embedTemplate';
import { SlashCommand } from '../../@types/commandDef';
import { parseDuration } from '../../../global/utils/parseDuration';

const F = f(__filename);

export default dDramacounter;

export const dDramacounter: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('dramacounter')
    .setDescription('How long since the last drama incident?!')
    .addSubcommand(subcommand => subcommand
      .setName('get')
      .setDescription('Get the time since last drama.'))
    .addSubcommand(subcommand => subcommand
      .setName('set')
      .setDescription('Set the dramacounter >.<')
      .addStringOption(option => option
        .setName('dramatime')
        .setDescription('When did the drama happen? "3 hours (ago)"')
        .setRequired(true))
      .addStringOption(option => option
        .setName('dramaissue')
        .setDescription('What was the drama? Be descriptive, or cryptic.')
        .setRequired(true))),
  async execute(interaction) {
    startLog(F, interaction);
    const command = interaction.options.getSubcommand() as 'get' | 'set';

    if (!interaction.guild) {
      interaction.reply({
        content: 'This command can only be used in a server.',
        ephemeral: true,
      });
      return false;
    }
    // log.debug(F, `interaction.guild: ${JSON.stringify(interaction.guild, null, 2)}`);

    let lastDramaAt = {} as Date;
    let dramaReason = '';
    if (command === 'set') {
      const dramaVal = interaction.options.getString('dramatime');
      // log.debug(F, `dramaVal: ${JSON.stringify(dramaVal, null, 2)}`);
      if (!dramaVal) {
        interaction.reply({
          content: 'You need to specify a time for the drama to have happened.',
          ephemeral: true,
        });
        return false;
      }
      const dramatimeValue = await parseDuration(dramaVal);
      // log.debug(F, `dramatimeValue: ${JSON.stringify(dramatimeValue, null, 2)}`);
      const dramaIssue = interaction.options.getString('dramaissue');
      // log.debug(F, `dramaIssue: ${JSON.stringify(dramaIssue, null, 2)}`);
      if (!dramaIssue) {
        interaction.reply({
          content: 'You need to specify what the drama was.',
          ephemeral: true,
        });
        return false;
      }
      dramaReason = dramaIssue;
      lastDramaAt = DateTime.now().minus(dramatimeValue).toJSDate();
      // log.debug(F, `dramaTime: ${JSON.stringify(lastDramaAt, null, 2)}`);
    }

    const response = await dramacounter(command, interaction.guild.id, lastDramaAt, dramaReason);

    const embed = embedTemplate()
      .setTitle('Drama Counter');

    if (command === 'get') {
      if (!response.lastDramaAt) {
        embed.setDescription('There has been no drama yet!');
        await interaction.reply({ embeds: [embed] });
        return true;
      }
      embed.setDescription(
        `The last drama was ${time(new Date(response.lastDramaAt), 'R')}: ${response.dramaReason}`,
      );
      await interaction.reply({ embeds: [embed] });
    } else {
      if (!response.lastDramaAt) {
        return false;
      }
      embed.setDescription(
        stripIndents`The drama counter has been reset to ${time(new Date(response.lastDramaAt), 'R')} ago, \
      and the issue was: ${response.dramaReason}`,
      );
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
    return true;
  },
};
