import {
  Colors,
  GuildMember,
  SlashCommandBuilder,
} from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
import { leaderboard } from '../../../global/commands/g.leaderboard';
import { startLog } from '../../utils/startLog';
import { embedTemplate } from '../../utils/embedTemplate'; // eslint-disable-line @typescript-eslint/no-unused-vars

const F = f(__filename);

type RankType = { 'rank': number, 'id': string, 'level': number };
type LeaderboardType = {
  [key: string]: RankType[],
};

export default dLeaderboard;

export const dLeaderboard: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Show the experience leaderboard')
    .addStringOption(option => option.setName('category')
      .setDescription('Which leaderboard? (Default: Overall)')
      .addChoices(
        { name: 'Overall', value: 'OVERALL' },
        { name: 'Total', value: 'TOTAL' },
        { name: 'General', value: 'GENERAL' },
        { name: 'Tripsitter', value: 'TRIPSITTER' },
        { name: 'Developer', value: 'DEVELOPER' },
        { name: 'Team Tripsit', value: 'TEAM' },
        { name: 'Ignored', value: 'IGNORED' },
      )),
  async execute(interaction) {
    startLog(F, interaction);
    await interaction.deferReply();
    const categoryOption = interaction.options.getString('category');
    const categoryName = categoryOption ?? 'OVERALL';

    // Get the tripsit guild
    const guild = await interaction.client.guilds.fetch(env.DISCORD_GUILD_ID);

    const response = await leaderboard(categoryName);
    const leaderboardVals = response.results as LeaderboardType;

    // log.debug(F, `response: ${JSON.stringify(leaderboardVals, null, 2)}`);

    const embed = embedTemplate()
      .setTitle(response.title)
      .setColor(Colors.Gold)
      .setDescription(response.description);

    const rankDict = {
      OVERALL: 'Overall',
      TOTAL: 'Total',
      TRIPSITTER: 'Sitter',
      GENERAL: 'Shitposter',
      DEVELOPER: 'Codemonkey',
      TEAM: 'Teamtalker',
      IGNORED: 'Voidscreamer',
    };

    for (const [category, value] of Object.entries(leaderboardVals)) { // eslint-disable-line no-restricted-syntax
    // Object.entries(leaderboardVals).forEach(([category, value]) => {
      let row = 0;
      let rowName = '';
      // log.debug(F, `Category: ${category}`);
      // log.debug(F, `rowName: ${rowName}`);
      // log.debug(F, `row: ${row}`);
      // log.debug(F, `Category name: ${category}`);
      // Capitalize the first letter in user.rank
      const categoryTitle = rankDict[category as keyof typeof rankDict];
      const catNameCapitalized = categoryTitle.charAt(0).toUpperCase() + categoryTitle.slice(1);
      // log.debug(F, `Proper name: ${catNameCapitalized}`);
      for (const user of value) { // eslint-disable-line no-restricted-syntax
        // log.debug(F, `user.id: ${user.id}`);
        // log.debug(F, `row: ${row}`);
        if (rowName !== catNameCapitalized && rowName !== '') {
          rowName = catNameCapitalized;
          embed.addFields({ name: '\u200B', value: '\u200B', inline: true });
          // log.debug(F, `added first blank row`);
          row += 1;
          // log.debug(F, `row: ${row}`);
          if (row < 3) {
            // log.debug(F, `row is less than 3`);
            embed.addFields({ name: '\u200B', value: '\u200B', inline: true });
            // log.debug(F, `added second blank row`);
            row = 0;
          } else {
            // log.debug(F, `row is not less than 3`);
            row = 0;
          }
        }
        rowName = catNameCapitalized;

        // Get the user's discord username from the discord API
        let member = {} as GuildMember;
        try {
          member = await guild.members.fetch(user.id); // eslint-disable-line no-await-in-loop
        } catch (error) {
          //
        }
        embed.addFields({
          name: `#${user.rank} ${rowName}`,
          value: `L.${user.level} ${member.displayName}`,
          inline: true,
        });
        row += 1;
      }
    }

    await interaction.editReply({ embeds: [embed] });

    return true;
  },
};
