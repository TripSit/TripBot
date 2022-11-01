import {
  Colors,
  SlashCommandBuilder,
} from 'discord.js';
import {SlashCommand1} from '../../@types/commandDef';
import {leaderboard} from '../../../global/commands/g.leaderboard';
import {embedTemplate} from '../../utils/embedTemplate';
import logger from '../../../global/utils/logger';
import env from '../../../global/utils/env.config';
import * as path from 'path';
const PREFIX = path.parse(__filename).name;

type rankType = {'rank': number, 'id': string, 'level': number}
type leaderboardType = {
  [key: string]: rankType[],
};

export const dLeaderboard: SlashCommand1 = {
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
    const categoryOption = interaction.options.get('category');
    const categoryName = categoryOption ? categoryOption.value as string : 'OVERALL';
    logger.debug(`[${PREFIX}] starting | category: ${categoryName}`);

    // Get the tripsit guild
    const guild = client.guilds.cache.get(env.DISCORD_GUILD_ID)!;

    const response = await leaderboard(categoryName);
    const leaderboardVals = response.results as leaderboardType;

    // logger.debug(`[${PREFIX}] response: ${JSON.stringify(leaderboardVals, null, 2)}`);

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

    for (const [category, value] of Object.entries(leaderboardVals)) {
      // logger.debug(`[${PREFIX}] Category name: ${category}`);
      // Capitalize the first letter in user.rank
      const categoryName = rankDict[category as keyof typeof rankDict];
      const catNameCapitalized = categoryName.charAt(0).toUpperCase() + categoryName.slice(1);
      // logger.debug(`[${PREFIX}] Proper name: ${catNameCapitalized}`);
      value.forEach((user) => {
        // Get the user's discord username from the discord API
        const discordUsername = guild.members.cache.get(user.id);
        // logger.debug(`[${PREFIX}] discordUsername: ${discordUsername}`);
        embed.addFields({
          name: `#${user.rank} ${catNameCapitalized}`,
          value: `L.${user.level} ${discordUsername?.toString()}`,
          inline: true});
      });
    };

    interaction.reply({embeds: [embed]});

    return true;
  },
};
