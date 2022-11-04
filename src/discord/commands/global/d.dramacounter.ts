import {
  time,
  SlashCommandBuilder,
} from 'discord.js';
import {dramacounter} from '../../../global/commands/g.dramacounter';
import {embedTemplate} from '../../utils/embedTemplate';
import {DateTime} from 'luxon';
import {SlashCommand1} from '../../@types/commandDef';
import {parseDuration} from '../../../global/utils/parseDuration';
import logger from '../../../global/utils/logger';
import * as path from 'path';
import {stripIndents} from 'common-tags';
const PREFIX = path.parse(__filename).name;

export const bug: SlashCommand1 = {
  data: new SlashCommandBuilder()
    .setName('dramacounter')
    .setDescription('How long since the last drama incident?!')
    .addSubcommand((subcommand) => subcommand
      .setName('get')
      .setDescription('Get the time since last drama.'),
    )
    .addSubcommand((subcommand) => subcommand
      .setName('set')
      .setDescription('Set the dramacounter >.<')
      .addStringOption((option) => option
        .setName('dramatime')
        .setDescription('When did the drama happen? "3 hours (ago)"')
        .setRequired(true),
      )
      .addStringOption((option) => option
        .setName('dramaissue')
        .setDescription('What was the drama? Be descriptive, or cryptic.')
        .setRequired(true),
      ),
    ),
  async execute(interaction) {
    logger.debug(`[${PREFIX}] starting!`);
    const command = interaction.options.getSubcommand() as 'get' | 'set';

    if (!interaction.guild) {
      interaction.reply({
        content: 'This command can only be used in a server.',
        ephemeral: true,
      });
      return false;
    }
    // logger.debug(`[${PREFIX}] interaction.guild: ${JSON.stringify(interaction.guild, null, 2)}`);

    const dramaVal = interaction.options.getString('dramatime');
    logger.debug(`[${PREFIX}] dramaVal: ${JSON.stringify(dramaVal, null, 2)}`);
    if (!dramaVal) {
      interaction.reply({
        content: 'You need to specify a time for the drama to have happened.',
        ephemeral: true,
      });
      return false;
    }
    const dramatimeValue = await parseDuration(dramaVal);
    logger.debug(`[${PREFIX}] dramatimeValue: ${JSON.stringify(dramatimeValue, null, 2)}`);
    const dramaReason = interaction.options.getString('dramaissue');
    logger.debug(`[${PREFIX}] dramaIssue: ${JSON.stringify(dramaReason, null, 2)}`);
    if (!dramaReason) {
      interaction.reply({
        content: 'You need to specify what the drama was.',
        ephemeral: true,
      });
      return false;
    }

    const dramaDate = DateTime.now().minus(dramatimeValue).toJSDate();
    logger.debug(`[${PREFIX}] dramaTime: ${JSON.stringify(dramaDate, null, 2)}`);

    const response = await dramacounter(command, interaction.guild.id, dramaDate, dramaReason);

    const embed = embedTemplate()
      .setTitle('Drama Counter');

    if (command === 'get') {
      embed.setDescription(
        `The last drama was ${time(new Date(response[1]), 'R')}: ${response[0]}`);
      await interaction.reply({embeds: [embed]});
    } else {
      embed.setDescription(stripIndents`The drama counter has been reset to ${time(new Date(response[1]), 'R')} ago, \
      and the issue was: ${response[0]}`);
      await interaction.reply({embeds: [embed], ephemeral: true});
    }
    return true;
  },
};
