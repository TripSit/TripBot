/* eslint-disable max-len */
import {
  SlashCommandBuilder,
  GuildMember,
  EmbedBuilder,
} from 'discord.js';
import { parseISO, format } from 'date-fns';
import { stripIndents } from 'common-tags';
import { SlashCommand } from '../../@types/commandDef';
import commandContext from '../../utils/context';
import {
  Wordle, Connections, TheMini,
} from '../../utils/nytUtils';

const F = f(__filename);

function formatTime(seconds: number) { // eslint-disable-line
  let remainingSeconds = seconds % (24 * 60 * 60);
  const days = Math.floor(remainingSeconds / (24 * 60 * 60));
  remainingSeconds %= 24 * 60 * 60;
  const hours = Math.floor(remainingSeconds / (60 * 60));
  remainingSeconds %= 60 * 60;
  const minutes = Math.floor(remainingSeconds / 60);
  remainingSeconds %= 60;

  let timeString = '';
  if (days > 0) timeString += `${days} days, `;
  if (hours > 0) timeString += `${hours} hr, `;
  if (minutes > 0) timeString += `${minutes} min, `;
  if (remainingSeconds > 0) timeString += `${remainingSeconds} sec`;

  // Remove trailing comma and space
  if (timeString.endsWith(', ')) {
    timeString = timeString.slice(0, -2);
  }

  return timeString;
}

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
          { name: 'The Mini', value: 'mini' },
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
          { name: 'The Mini', value: 'mini' },
        ))
      .addStringOption(option => option
        .setName('puzzle')
        .setDescription('Puzzle to get stats for')
        .setRequired(true)
        .setAutocomplete(true))
      .addBooleanOption(option => option
        .setName('ephemeral')
        .setDescription('Set to "True" to show the response only to you')
        .setRequired(false)))
    .addSubcommand(subcommand => subcommand
      .setName('help')
      .setDescription('Help for NYT Games')),

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

    if (subcommand === 'help') {
      const embed = new EmbedBuilder()
        .setAuthor({ name: 'NYT Games Help', iconURL: env.NYT_MAIN_ICON, url: 'https://www.nytimes.com/crosswords' })
        .setColor('Yellow')
        .setDescription(stripIndents`
          **Usage:**
          "NYT Games" are games from the New York Times that TripBot tracks stats for.
          Submit results to the bot by posting them in chat.
          If the result is valid, the bot will react to the message.

          **Supported games:**
          - [Wordle](https://www.nytimes.com/games/wordle/index.html)
          - [Connections](https://www.nytimes.com/puzzles/connections)
          - [The Mini](https://www.nytimes.com/crosswords/game/mini)

          **TripTokens:**
          If your submission is one of the 3 most recent puzzles available, you will tokens for submitting a valid result.
          `);
      await interaction.editReply({ embeds: [embed] });
      return true;
    }

    const game = interaction.options.getString('game');
    if (!game) {
      await interaction.editReply({ content: 'No game provided!' });
      return false;
    }

    if (subcommand === 'user') {
      const target = interaction.options.getMember('target')
        ? interaction.options.getMember('target') as GuildMember
        : interaction.member as GuildMember;

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
        const embed = new EmbedBuilder()
          .setAuthor({ name: `${target.displayName}'s Wordle stats`, iconURL: env.NYT_WORDLE_ICON, url: 'https://www.nytimes.com/games/wordle/index.html' });

        const results = await Wordle.getUserStats(target.user.id);
        if (!results) {
          embed.setColor('Red');
          embed.setTitle(`${target.displayName} has no Wordle stats`);
          embed.setDescription('Encourage them to submit their first result! \n Results are submitted by posting them in chat. \n TripBot will react to the message if it\'s a valid submission.');
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
          **🎮 Games Played:** ${results.stats.gamesPlayed}

          **🏆 Win Rate:** ${(results.stats.winRate * 100)}%

          **📅 Submission Streak:** ${results.stats.submissionStreak}

          **🔥 Win Streak:** ${results.stats.currentStreak}

          **❤️‍🔥 Best Win Streak:** ${results.stats.bestStreak}

          **📊 Guess Distribution:**
          ${frequencyGraph}
          **⭐ Latest Result:** 
          Wordle ${results.stats.lastPlayed.toLocaleString()} ${results.stats.lastScore === 0 ? 'X' : results.stats.lastScore}/6
          ${Array.from(results.stats.lastGrid).reduce((acc, emoji, i) => acc + emoji + (i % 5 === 4 ? '\n' : ''), '')}
          `);
        await interaction.editReply({ embeds: [embed] });
        return true;
      }

      if (game === 'connections') {
        const embed = new EmbedBuilder()
          .setAuthor({ name: `${target.displayName}'s Connections stats`, iconURL: env.NYT_CONNECTIONS_ICON, url: 'https://www.nytimes.com/puzzles/connections' });

        const results = await Connections.getUserStats(target.user.id);
        if (!results) {
          await interaction.editReply({ content: 'No stats found for this user!' });
          return false;
        }

        const numberEmoji = ['0️⃣', '1️⃣', '2️⃣', '3️⃣'];
        const maxFrequency = Math.max(...Object.values(results.scoreFrequency));
        let frequencyGraph = '';
        for (let score = 0; score < 4; score += 1) {
          const frequency = results.scoreFrequency[score] || 0;
          // Calculate the bar length as the frequency of the score divided by the maximum frequency, multiplied by 10
          const barLength = frequency > 0 ? Math.round((frequency / maxFrequency) * 15) : 1;
          const bar = '▇'.repeat(barLength);
          // Use the corresponding emoji instead of the number
          const scoreEmoji = numberEmoji[score];
          frequencyGraph += `${scoreEmoji}: ${bar} ${frequency}\n`;
        }

        embed.setColor('Purple');
        embed.setDescription(stripIndents`
          **🎮 Games Played:** ${results.stats.gamesPlayed}

          **🏆 Win Rate:** ${(results.stats.winRate * 100)}%

          **📅 Submission Streak:** ${results.stats.submissionStreak}

          **🔥 Win Streak:** ${results.stats.currentStreak}
          
          **❤️‍🔥 Best Win Streak:** ${results.stats.bestStreak}

          **📊 Mistakes Distribution:**
          ${frequencyGraph}
          **⭐ Latest Result:**
          Connections
          Puzzle #${results.stats.lastPlayed.toLocaleString()}
          ${Array.from(results.stats.lastGrid).reduce((acc, emoji, i) => acc + emoji + (i % 4 === 3 ? '\n' : ''), '')}
          
          `);
        await interaction.editReply({ embeds: [embed] });
        return true;
      }

      // TODO: Implement mini stats
      if (game === 'mini') {
        const embed = new EmbedBuilder()
          .setAuthor({ name: `${target.displayName}'s The Mini stats`, iconURL: env.NYT_THEMINI_ICON, url: 'https://www.nytimes.com/crosswords/game/mini' });

        const results = await TheMini.getUserStats(target.user.id);
        if (!results) {
          await interaction.editReply({ content: 'No stats found for this user!' });
          return false;
        }

        embed.setColor('Blue');
        embed.setDescription(stripIndents`
          **🎮 Games Played:** ${results.stats.gamesPlayed}

          **📅 Submission Streak:** ${results.stats.submissionStreak}

          **🔥 Win Streak:** ${results.stats.currentStreak}

          **❤️‍🔥 Best Win Streak:** ${results.stats.bestStreak}

          **🏆 Best Time:** ${formatTime(results.stats.bestTime)}

          **⏱️ Average Time:** ${formatTime(results.stats.averageTime)}

          **⭐ Latest Result:**
          ${results.stats.lastPlayed}
          ${formatTime(results.stats.lastScore)}
        `);
        await interaction.editReply({ embeds: [embed] });
        return true;
      }
    }

    if (subcommand === 'server') {
      if (game === 'wordle') {
        const puzzle = parseInt(interaction.options.getString('puzzle') || '', 10);
        if (!puzzle) {
          await interaction.editReply({ content: 'No puzzle provided!' });
          return false;
        }
        const embed = new EmbedBuilder()
          .setAuthor({ name: 'Server\'s Wordle stats', iconURL: env.NYT_WORDLE_ICON, url: 'https://www.nytimes.com/games/wordle/index.html' })
          .setTitle(`Puzzle #${puzzle.toLocaleString()}`);
        // Check if the user is querying for a wordle from the future
        const currentPuzzles = await Wordle.todaysPuzzles();
        const maxPuzzleNumber = Math.max(...currentPuzzles);
        if (puzzle > maxPuzzleNumber) {
          (
            embed.setTitle(`Wordle #${puzzle.toLocaleString()} is not available yet`)
              .setDescription(`The most recent is #${maxPuzzleNumber.toLocaleString()}.`)
              .setColor('Red')
          );
          await interaction.editReply({ embeds: [embed] });
          return false;
        }

        const results = await Wordle.getServerStats(puzzle);
        if (!results) {
          embed.setTitle(`No results for Wordle #${puzzle.toLocaleString()}`);
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
          **🎮 Games Played:** ${results.stats.gamesPlayed}

          **🏆 Win Rate:** ${(results.stats.winRate * 100)}%

          **📊 Guess Distribution:**
          ${frequencyGraph}
          `);
        await interaction.editReply({ embeds: [embed] });
        return true;
      }
      if (game === 'connections') {
        const puzzle = parseInt(interaction.options.getString('puzzle') || '', 10);
        if (!puzzle) {
          await interaction.editReply({ content: 'No puzzle provided!' });
          return false;
        }
        const embed = new EmbedBuilder()
          .setAuthor({ name: 'Server\'s Connections stats', iconURL: env.NYT_CONNECTIONS_ICON, url: 'https://www.nytimes.com/puzzles/connections' })
          .setTitle(`Puzzle #${puzzle.toLocaleString()}`);
        // Check if the user is querying for a wordle from the future

        const currentPuzzles = await Connections.todaysPuzzles();
        const maxPuzzleNumber = Math.max(...currentPuzzles);
        if (puzzle > maxPuzzleNumber) {
          (
            embed.setTitle(`Connections #${puzzle.toLocaleString()} is not available yet`)
              .setDescription(`The most recent is #${maxPuzzleNumber.toLocaleString()}.`)
              .setColor('Red')
          );
          await interaction.editReply({ embeds: [embed] });
          return false;
        }

        const results = await Connections.getServerStats(puzzle);
        if (!results) {
          embed.setTitle(`No results for Connections #${puzzle.toLocaleString()}`);
          embed.setDescription('Be the first to submit by posting them in chat. \n TripBot will react to your message if it\'s a valid submission.');
          embed.setColor('Red');
          await interaction.editReply({ embeds: [embed] });
          return false;
        }

        const numberEmoji = ['0️⃣', '1️⃣', '2️⃣', '3️⃣'];
        const maxFrequency = Math.max(...Object.values(results.scoreFrequency));
        let frequencyGraph = '';
        for (let score = 0; score < 4; score += 1) {
          const frequency = results.scoreFrequency[score] || 0;
          // Calculate the bar length as the frequency of the score divided by the maximum frequency, multiplied by 10
          const barLength = frequency > 0 ? Math.round((frequency / maxFrequency) * 15) : 1;
          const bar = '▇'.repeat(barLength);
          // Use the corresponding emoji instead of the number
          const scoreEmoji = numberEmoji[score];
          frequencyGraph += `${scoreEmoji}: ${bar} ${frequency}\n`;
        }

        embed.setColor('Purple');
        embed.setDescription(stripIndents`
          **🎮 Games Played:** ${results.stats.gamesPlayed}

          **🏆 Win Rate:** ${(results.stats.winRate * 100)}%

          **📊 Mistakes Distribution:**
          ${frequencyGraph}
        `);
        await interaction.editReply({ embeds: [embed] });
        return true;
      }
      if (game === 'mini') {
        const puzzle = (interaction.options.getString('puzzle') || '');
        log.debug(F, `Puzzle: ${puzzle}`);
        if (!puzzle) {
          await interaction.editReply({ content: 'No puzzle provided!' });
          return false;
        }
        const embed = new EmbedBuilder()

          .setAuthor({ name: 'Server\'s The Mini stats', iconURL: env.NYT_THEMINI_ICON, url: 'https://www.nytimes.com/crosswords/game/mini' })
          .setTitle(`${format(parseISO(puzzle), 'MMMM do yyyy')}`);

        const results = await TheMini.getServerStats(puzzle);
        if (!results) {
          await interaction.editReply({ content: 'No stats found for this server!' });
          return false;
        }
        embed.setColor('Blue');
        embed.setDescription(stripIndents`
          **🎮 Games Played:** ${results.stats.gamesPlayed}

          **🏆 Best Time:** ${formatTime(results.stats.bestTime)}

          **⏱️ Average Time:** ${formatTime(results.stats.averageTime)}
        `);
        await interaction.editReply({ embeds: [embed] });
        return true;
      }
    }

    return false;
  },
};

export default dNYT;
