import {
  Colors,
  Guild,
  SlashCommandBuilder,
} from 'discord.js';
import {SlashCommand} from '../../@types/commandDef';
import {leaderboard} from '../../../global/commands/g.leaderboard';
import {startLog} from '../../utils/startLog';
import {embedTemplate} from '../../utils/embedTemplate';
import log from '../../../global/utils/log'; // eslint-disable-line no-unused-vars
import env from '../../../global/utils/env.config';
import {parse} from 'path';
const PREFIX = parse(__filename).name;

type rankType = {'rank': number, 'id': string, 'level': number}
type leaderboardType = {
  [key: string]: rankType[],
};

export const dLeaderboard: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Show the experience leaderboard')
    .addStringOption((option) => option.setName('category')
      .setDescription('Which leaderboard? (Default: Overall)')
      .addChoices(
        {name: 'Overall', value: 'OVERALL'},
        {name: 'Total', value: 'TOTAL'},
        {name: 'General', value: 'GENERAL'},
        {name: 'Tripsitter', value: 'TRIPSITTER'},
        {name: 'Developer', value: 'DEVELOPER'},
        {name: 'Team Tripsit', value: 'TEAM'},
        {name: 'Ignored', value: 'IGNORED'},
      )),
  async execute(interaction) {
    startLog(PREFIX, interaction);
    const categoryOption = interaction.options.getString('category');
    const categoryName = categoryOption ?? 'OVERALL';

    // Get the tripsit guild
    const guild = interaction.client.guilds.cache.get(env.DISCORD_GUILD_ID) as Guild;

    const response = await leaderboard(categoryName);
    const leaderboardVals = response.results as leaderboardType;

    // log.debug(`[${PREFIX}] response: ${JSON.stringify(leaderboardVals, null, 2)}`);

    const embed = embedTemplate()
      .setTitle(response.title)
      .setColor(Colors.Gold)
      .setDescription(response.description);

    const rankDict = {
      'OVERALL': 'Overall',
      'TOTAL': 'Total',
      'TRIPSITTER': 'Sitter',
      'GENERAL': 'Shitposter',
      'DEVELOPER': 'Codemonkey',
      'TEAM': 'Teamtalker',
      'IGNORED': 'Voidscreamer',
    };

    let row = 0;
    let rowName = '';
    for (const [category, value] of Object.entries(leaderboardVals)) {
      // log.debug(`[${PREFIX}] Category: ${category}`);
      // log.debug(`[${PREFIX}] rowName: ${rowName}`);
      // log.debug(`[${PREFIX}] row: ${row}`);
      // log.debug(`[${PREFIX}] Category name: ${category}`);
      // Capitalize the first letter in user.rank
      const categoryName = rankDict[category as keyof typeof rankDict];
      const catNameCapitalized = categoryName.charAt(0).toUpperCase() + categoryName.slice(1);
      // log.debug(`[${PREFIX}] Proper name: ${catNameCapitalized}`);
      value.forEach((user) => {
        // log.debug(`[${PREFIX}] user.id: ${user.id}`);
        // log.debug(`[${PREFIX}] row: ${row}`);
        if (rowName !== catNameCapitalized && rowName !== '') {
          rowName = catNameCapitalized;
          embed.addFields({name: '\u200B', value: '\u200B', inline: true});
          // log.debug(`[${PREFIX}] added first blank row`);
          row++;
          // log.debug(`[${PREFIX}] row: ${row}`);
          if (row < 3) {
            // log.debug(`[${PREFIX}] row is less than 3`);
            embed.addFields({name: '\u200B', value: '\u200B', inline: true});
            // log.debug(`[${PREFIX}] added second blank row`);
            row = 0;
          } else {
            // log.debug(`[${PREFIX}] row is not less than 3`);
            row = 0;
          }
        }
        rowName = catNameCapitalized;

        // Get the user's discord username from the discord API
        const discordUsername = guild.members.cache.get(user.id);
        // log.debug(`[${PREFIX}] discordUsername: ${discordUsername}`);
        embed.addFields({
          name: `#${user.rank} ${rowName}`,
          value: `L.${user.level} ${discordUsername?.toString()}`,
          inline: true});
        row++;
      });
    };

    interaction.reply({embeds: [embed]});

    return true;
  },
};
