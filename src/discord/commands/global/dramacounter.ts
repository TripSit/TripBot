import {
  time,
  SlashCommandBuilder,
} from 'discord.js';
import {db} from '../../../global/utils/knex';
import {guildEntry} from '../../../global/@types/pgdb.d';
import {DateTime} from 'luxon';
import {SlashCommand} from '../../@types/commandDef';
import {embedTemplate} from '../../utils/embedTemplate';
import {parseDuration} from '../../../global/utils/parseDuration';
import logger from '../../../global/utils/logger';
import * as path from 'path';
import {stripIndents} from 'common-tags';
const PREFIX = path.parse(__filename).name;

export const bug: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('dramacounter')
    .setDescription('How long since the last drama incident?!')
    .addSubcommand((subcommand) => subcommand
      .setName('get')
      .setDescription('Get the time since last drama.'),
    )
    .addSubcommand((subcommand) => subcommand
      .setName('reset')
      .setDescription('Reset the dramacounter >.<')
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
    const command = interaction.options.getSubcommand() as 'get' | 'reset';

    if (command === 'get') {
      const data = await db
        .select(db.ref('drama_date').as('drama_date'), db.ref('drama_reason').as('drama_reason'))
        .from<guildEntry>('guilds')
        .where('discord_id', interaction.guild!.id);


      if (data[0]) {
        const dramaDate = data[0].drama_date as Date;
        const dramaReason = data[0].drama_reason as String;
        const embed = embedTemplate()
          .setTitle('Drama Counter')
          .setDescription(
            `The last drama was ${time(new Date(dramaDate), 'R')}: ${dramaReason}`);
        interaction.reply({embeds: [embed]});
      } else {
        interaction.reply('No drama has been reported yet! Be thankful while it lasts...');
      }
    } else if (command === 'reset') {
      const dramaVal = interaction.options.getString('dramatime')!;
      logger.debug(`[${PREFIX}] dramaVal: ${JSON.stringify(dramaVal, null, 2)}`);
      const dramatimeValue = await parseDuration(dramaVal);
      logger.debug(`[${PREFIX}] dramatimeValue: ${JSON.stringify(dramatimeValue, null, 2)}`);
      const dramaReason = interaction.options.getString('dramaissue')!;
      logger.debug(`[${PREFIX}] dramaIssue: ${JSON.stringify(dramaReason, null, 2)}`);

      const dramaDate = DateTime.now().minus(dramatimeValue).toJSDate();
      logger.debug(`[${PREFIX}] dramaTime: ${JSON.stringify(dramaDate, null, 2)}`);

      await db('guilds')
        .insert({
          discord_id: interaction.guild!.id,
          drama_reason: dramaReason,
          drama_date: dramaDate,
        })
        .onConflict('discord_id')
        .merge()
        .returning('*');

      const timeDate = time(dramaDate, 'R');
      const embed = embedTemplate()
        .setTitle('Drama Counter')
        .setDescription(stripIndents`The drama counter has been reset to ${timeDate} ago, \
          and the issue was: ${dramaReason}`);
      interaction.reply({embeds: [embed]});
    }
    logger.debug(`[${PREFIX}] finished!`);
  },
};
