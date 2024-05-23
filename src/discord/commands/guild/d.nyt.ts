/* eslint-disable max-len */
import {
  SlashCommandBuilder,
  GuildMember,
  EmbedBuilder,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import { SlashCommand } from '../../@types/commandDef';
import commandContext from '../../utils/context';
import { getUserWordleStats, getServerWordleStats } from '../../utils/nytUtils';

const F = f(__filename);

export const dNYT: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('nyt')
    .setDescription('See info for tracked NYT games')
    .addSubcommand(subcommand => subcommand
      .setName('user')
      .setDescription('See info for a user')
      .addStringOption(option => option
        .setName('game')
        .setDescription('The game to get stats for')
        .setRequired(true)
        .addChoices(
          { name: 'Wordle', value: 'wordle' },
          { name: 'Connections', value: 'connections' },
        ))
      .addUserOption(option => option
        .setName('target')
        .setDescription('The user to get stats for')
        .setRequired(false))
      .addBooleanOption(option => option
        .setName('ephemeral')
        .setDescription('Set to "True" to show the response only to you')
        .setRequired(false)))
    .addSubcommand(subcommand => subcommand
      .setName('server')
      .setDescription('See info for the server')
      .addStringOption(option => option
        .setName('game')
        .setDescription('The game to get stats for')
        .setRequired(true)
        .addChoices(
          { name: 'Wordle', value: 'wordle' },
          { name: 'Connections', value: 'connections' },
        ))
      .addIntegerOption(option => option
        .setName('puzzle')
        .setDescription('The puzzle to get stats for')
        .setRequired(true))
      .addBooleanOption(option => option
        .setName('ephemeral')
        .setDescription('Set to "True" to show the response only to you')
        .setRequired(false))),

  async execute(
    interaction,
  ) {
    log.info(F, await commandContext(interaction));
    await interaction.deferReply({ ephemeral: (interaction.options.getBoolean('ephemeral') === true) });
    if (!interaction.guild) {
      await interaction.editReply({ content: 'You can only use this command in a guild!' });
      return false;
    }

    const subcommand = interaction.options.getSubcommand();
    const game = interaction.options.getString('game');
    if (!game) {
      await interaction.editReply({ content: 'No game provided!' });
      return false;
    }

    if (subcommand === 'user') {
      const target = interaction.options.getMember('target')
        ? interaction.options.getMember('target') as GuildMember
        : interaction.member as GuildMember;
      const embed = new EmbedBuilder()
        .setTitle(`${target.displayName}'s ${game.charAt(0).toUpperCase() + game.slice(1)} stats`);

      const user = await db.users.findFirst({
        where: {
          discord_id: target.user.id,
        },
      });
      if (!user) {
        log.error(F, `No user found for discord_id: ${target.user.id}`);
        return false;
      }

      if (game === 'wordle') {
        const results = await getUserWordleStats(target.user.id);
        if (!results) {
          await interaction.editReply({ content: 'No stats found for this user!' });
          return false;
        }

        const numberEmoji = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣'];
        const maxFrequency = Math.max(...Object.values(results.scoreFrequency));
        let frequencyGraph = '';
        for (let score = 1; score <= 6; score += 1) {
          const frequency = results.scoreFrequency[score] || 0;
          // Calculate the bar length as the frequency of the score divided by the maximum frequency, multiplied by 10
          const barLength = frequency > 0 ? Math.round((frequency / maxFrequency) * 15) : 1;
          const bar = '▇'.repeat(barLength);
          // Use the corresponding emoji instead of the number
          const scoreEmoji = numberEmoji[score - 1];
          frequencyGraph += `${scoreEmoji}: ${bar} ${frequency}\n`;
        }
        embed.setColor('Green');
        embed.setDescription(stripIndents`
          **🎮 Games Played:** ${results.stats.gamesPlayed}

          **🏆 Win Rate:** ${(results.stats.winRate * 100)}%

          **🔥 Current Streak:** ${results.stats.currentStreak}

          **❤️‍🔥 Best Streak:** ${results.stats.bestStreak}

          **📊 Guess Distribution:**
          ${frequencyGraph}
          `);
        await interaction.editReply({ embeds: [embed] });
        return true;
      }

      if (game === 'connections') {
        // const connectionsStats = await db.connections_stats.findFirst({
        //   where: {
        //     user_id: user.id,
        //   },
        // });
        // if (!connectionsStats) {
        //   await interaction.editReply({ content: 'No stats found for this user!' });
        //   return false;
        // }
      }
    }

    if (subcommand === 'server') {
      const puzzle = interaction.options.getInteger('puzzle');
      if (!puzzle) {
        await interaction.editReply({ content: 'No puzzle provided!' });
        return false;
      }
      const embed = new EmbedBuilder()
        .setTitle(`Server's ${game.charAt(0).toUpperCase() + game.slice(1)} ${puzzle} stats`);

      if (game === 'wordle') {
        const results = await getServerWordleStats(puzzle);
        if (!results) {
          embed.setTitle(`No results for ${game.charAt(0).toUpperCase() + game.slice(1)} ${puzzle}`);
          embed.setDescription('Be the first to submit by posting them in chat. \n TripBot will react to your message if it\'s a valid submission.');
          embed.setColor('Red');
          await interaction.editReply({ embeds: [embed] });
          return false;
        }

        const numberEmoji = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣'];
        const maxFrequency = Math.max(...Object.values(results.scoreFrequency));
        let frequencyGraph = '';
        for (let score = 1; score <= 6; score += 1) {
          const frequency = results.scoreFrequency[score] || 0;
          // Calculate the bar length as the frequency of the score divided by the maximum frequency, multiplied by 10
          const barLength = frequency > 0 ? Math.round((frequency / maxFrequency) * 15) : 1;
          const bar = '▇'.repeat(barLength);
          // Use the corresponding emoji instead of the number
          const scoreEmoji = numberEmoji[score - 1];
          frequencyGraph += `${scoreEmoji}: ${bar} ${frequency}\n`;
        }
        embed.setColor('Green');
        embed.setDescription(stripIndents`
          **🎮 Games Submitted:** ${results.stats.gamesPlayed}

          **🏆 Win Rate:** ${(results.stats.winRate * 100)}%

          **📊 Guess Distribution:**
          ${frequencyGraph}
          `);
      }

      await interaction.editReply({ embeds: [embed] });
    }
    return true;
  },
};

export default dNYT;
