import {
  Colors,
  SlashCommandBuilder,
} from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
import { getLeaderboard } from '../../../global/commands/g.leaderboard';
import { startLog } from '../../utils/startLog';
import { embedTemplate } from '../../utils/embedTemplate';

const F = f(__filename);

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
        { name: 'Team', value: 'TEAM' },
        { name: 'Ignored', value: 'IGNORED' },
      )),
  async execute(interaction) {
    startLog(F, interaction);
    // Immediately defer to buy us time to do calculations and such, otherwise there's a 3 second window to respond
    await interaction.deferReply();

    // Get the category option from the slash command
    const categoryOption = interaction.options.getString('category');
    // If the category option is not null, convert it to lowercase, otherwise set it to 'overall'
    const categoryChoice = categoryOption ? categoryOption.toLowerCase() : 'overall';

    // Get the leaderboard data from the db, this looks like:
    // leaderboardData = {
    //   text: {
    //     total: [] as RankData[],
    //     tripsitter: [] as RankData[],
    //     general: [] as RankData[],
    //     developer: [] as RankData[],
    //     team: [] as RankData[],
    //     ignored: [] as RankData[],
    //   },
    //   voice: {
    //     total: [] as RankData[],
    //     tripsitter: [] as RankData[],
    //     general: [] as RankData[],
    //     developer: [] as RankData[],
    //     team: [] as RankData[],
    //     ignored: [] as RankData[],
    //   },
    // };
    //
    // Rank Data looks like:
    // RankData = {
    //   rank: number,
    //   discordId: string,
    //   level: number,
    //   exp: number,
    //   nextLevel: number,
    // };
    //
    // The data is sorted by most experience, so the first entry in the array is the highest rank
    // If there are no entries in the array, then there are no users in that category, but this wont happen in prod
    const leaderboardData = await getLeaderboard();

    // Create the embed that we will modify later
    const embed = embedTemplate()
      .setTitle('Leaderboard')
      .setColor(Colors.Gold);

    // Get the guild object from the client, do this outside the loop to save memory
    const tripsitGuild = await interaction.client.guilds.fetch(env.DISCORD_GUILD_ID); // eslint-disable-line

    // Create the message string that we will add to
    let message = '' as string;
    // Loop through the leaderboard data, first by the Type (text/voice)
    for (const [type, typeData] of Object.entries(leaderboardData)) { // eslint-disable-line
      log.debug(F, `Type: ${type}`);
      // Set header to false, we'll use this later to determine if we need to add the type header
      let header = false;
      // Loop through the individual category's rank data
      for (const [category, rankDataList] of Object.entries(typeData)) { // eslint-disable-line
        log.debug(F, `Category: ${category}`);

        // If the user chose a category, and the category we're on doesn't match the category they chose, skip it
        if (categoryChoice !== 'overall' && categoryChoice !== category) continue; // eslint-disable-line

        // If there are entries in the rank data list...
        if (rankDataList.length > 0) {
          // ...and the header hasnt been added yet, add the type header...
          if (header === false) {
            message += `** ### ${type.toUpperCase()} ### **\n`;
            header = true;
          }
          // ... otherwise just add the category header
          message += `*${category.toUpperCase()}*\n`;
        }

        // Initialize rank at 0 so we can increment it
        let rank = 0;
        // Loop through the rank data list
        for (const rankData of rankDataList) { // eslint-disable-line
          log.debug(F, `rankData: ${JSON.stringify(rankData, null, 2)}`);
          // RankData = {
          //   rank: number,
          //   discordId: string,
          //   level: number,
          //   exp: number,
          //   nextLevel: number,
          // };

          // Get the discord member object from the guild object
          const member = await tripsitGuild.members.fetch(rankData.discordId); // eslint-disable-line

          // Add the rank, member name, and level to the message string
          message += `${rank}. **${member.displayName}** - ${rankData.level} XP\n`;

          // Increment the rank
          rank += 1;
        }
      }
    }

    // Set the embed description to the message string
    embed.setDescription(message);

    // Edit the interaction response with the embed. We need to edit because we already deferred above.
    await interaction.editReply({ embeds: [embed] });

    return true;
  },
};
