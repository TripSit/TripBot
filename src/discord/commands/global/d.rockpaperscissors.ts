/* eslint-disable @typescript-eslint/no-non-null-assertion */

import type {
  ButtonInteraction,
  ChatInputCommandInteraction,
  EmbedBuilder,
  InteractionCollector,
  User,
} from 'discord.js';

import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Colors,
  ComponentType,
  MessageFlags,
  SlashCommandBuilder,
} from 'discord.js';

import type { SlashCommand } from '../../@types/commandDef';
import type {
  GameResult,
  MultiplayerResult,
  RoundResult,
  RPSGame,
} from '../../@types/rockPaperScissorsDef';

import { embedTemplate } from '../../utils/embedTemplate';

const F = f(__filename);

const rpsChoices = {
  paper: { beats: 'rock', emoji: '📄', name: 'Paper' },
  rock: { beats: 'scissors', emoji: '🪨', name: 'Rock' },
  scissors: { beats: 'paper', emoji: '✂️', name: 'Scissors' },
};

function create1v1GameEmbed(player1: User, player2: User): EmbedBuilder {
  return embedTemplate()
    .setTitle('⚔️ Rock Paper Scissors - 1v1 Battle!')
    .setColor(Colors.Green)
    .setDescription(
      `**${player1.username}** vs **${player2.username}**\n\n` +
        'Both players, make your choice!\n' +
        '⏰ You have 2 minutes for the entire match!',
    );
}

function createChoiceButtons(game: RPSGame, disabled = false): ActionRowBuilder<ButtonBuilder>[] {
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`rps_${game.gameId}_rock`)
      .setLabel('Rock')
      .setEmoji('🪨')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(disabled),
    new ButtonBuilder()
      .setCustomId(`rps_${game.gameId}_paper`)
      .setLabel('Paper')
      .setEmoji('📄')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(disabled),
    new ButtonBuilder()
      .setCustomId(`rps_${game.gameId}_scissors`)
      .setLabel('Scissors')
      .setEmoji('✂️')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(disabled),
  );

  return [row];
}

function createMultiplayerGameEmbed(
  players: string[],
  round: number,
  eliminated: string[] = [],
): EmbedBuilder {
  return embedTemplate()
    .setTitle(`🏆 Rock Paper Scissors - Round ${round}`)
    .setColor(Colors.Green)
    .setDescription(
      `**Active Players:** ${players.length}\n` +
        `${players.map((id) => `<@${id}>`).join(', ')}\n\n${
          eliminated.length > 0
            ? `**Eliminated:** ${eliminated.map((id) => `<@${id}>`).join(', ')}\n\n`
            : ''
        }⏰ **60 seconds** to make your choice!\n` +
        '🎯 Rock beats Scissors, Paper beats Rock, Scissors beats Paper!',
    );
}

function createPlayerStatusList(
  game: RPSGame,
  interaction: ChatInputCommandInteraction,
  opponent?: User,
): string {
  if (game.gameType === '1v1' && opponent) {
    const player1Status = game.choices.has(interaction.user.id) ? '✅' : '⏳';
    const player2Status = game.choices.has(opponent.id) ? '✅' : '⏳';

    return (
      `${player1Status} ${interaction.user.username}: ${player1Status === '✅' ? 'Ready' : 'Choosing...'}\n` +
      `${player2Status} ${opponent.username}: ${player2Status === '✅' ? 'Ready' : 'Choosing...'}`
    );
  }
  // Multiplayer
  return game.players
    .map((playerId) => {
      const status = game.choices.has(playerId) ? '✅' : '⏳';
      const statusText = status === '✅' ? 'Ready' : 'Choosing...';
      return `${status} <@${playerId}>: ${statusText}`;
    })
    .join('\n');
}

function createQueueButtons(gameId: string, disabled = false): ActionRowBuilder<ButtonBuilder>[] {
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`rps_${gameId}_join_queue`)
      .setLabel('Join Game')
      .setEmoji('⚔️')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(disabled),
  );

  return [row];
}

function createQueueEmbed(playersJoined: string[], timeLeft: number): EmbedBuilder {
  return embedTemplate()
    .setTitle('🎮 Rock Paper Scissors - Join the Battle!')
    .setColor(Colors.Green)
    .setDescription(
      `**Players Joined:** ${playersJoined.length}/10\n` +
        `${playersJoined.length > 0 ? playersJoined.map((id) => `<@${id}>`).join(', ') : 'No players yet...'}\n\n` +
        `⏰ **Time left to join:** ${timeLeft} seconds\n` +
        '🎯 **Need at least 2 players to start**\n\n' +
        'Click the button below to join!',
    );
}

function createResultsEmbed(
  results: RoundResult[],
  eliminated: string[],
  remaining: string[],
  winner: null | string,
  round: number,
): EmbedBuilder {
  const embed = embedTemplate()
    .setTitle(`🎲 Round ${round} Results`)
    .setColor(winner ? Colors.Green : Colors.Yellow);

  let description = '**Results:**\n';
  for (const result of results) {
    const { emoji } = rpsChoices[result.choice as keyof typeof rpsChoices];
    description += `${emoji} **${result.choice.charAt(0).toUpperCase() + result.choice.slice(1)}**: ${result.count} player${result.count === 1 ? '' : 's'}\n`;
  }

  if (eliminated.length > 0) {
    description += `\n❌ **Eliminated:** ${eliminated.map((id) => `<@${id}>`).join(', ')}\n`;
  }

  if (winner) {
    description += `\n🏆 **WINNER:** <@${winner}>\n🎉 Congratulations!`;
  } else if (remaining.length > 1) {
    description += `\n✅ **Advancing to next round:** ${remaining.map((id) => `<@${id}>`).join(', ')}`;
  }

  embed.setDescription(description);
  return embed;
}

function determineMultiplayerWinner(choices: Map<string, string>): MultiplayerResult {
  // Count choices
  const choiceCounts = { paper: 0, rock: 0, scissors: 0 };
  const choicePlayers = { paper: [] as string[], rock: [] as string[], scissors: [] as string[] };

  for (const [playerId, choice] of choices.entries()) {
    choiceCounts[choice as keyof typeof choiceCounts] += 1;
    choicePlayers[choice as keyof typeof choicePlayers].push(playerId);
  }

  const results = Object.entries(choiceCounts)
    .map(([choice, count]) => ({
      choice,
      count,
      players: choicePlayers[choice as keyof typeof choicePlayers],
    }))
    .filter((r) => r.count > 0);

  // If only one choice was made, no elimination
  const activeChoices = results.filter((r) => r.count > 0);
  if (activeChoices.length === 1) {
    return {
      eliminated: [],
      remaining: [...choices.keys()],
      results,
      winner: null,
    };
  }

  // Special case: only 2 players left (should be standard RPS)
  if ([...choices.keys()].length === 2) {
    const [player1Id, player2Id] = [...choices.keys()];
    const choice1 = choices.get(player1Id)!;
    const choice2 = choices.get(player2Id)!;

    if (choice1 === choice2) {
      // Tie - no elimination
      return {
        eliminated: [],
        remaining: [player1Id, player2Id],
        results,
        winner: null,
      };
    }

    // Determine winner using standard RPS
    const rpsResult = determineWinner(choice1, choice2);
    const winnerId = rpsResult === 'player1' ? player1Id : player2Id;
    const loserId = rpsResult === 'player1' ? player2Id : player1Id;

    return {
      eliminated: [loserId],
      remaining: [winnerId],
      results,
      winner: winnerId,
    };
  }

  // Multiplayer logic: find the choice that gets eliminated
  let eliminatedChoice: null | string = null;

  // Check all possible RPS matchups among active choices
  const activeChoiceNames = new Set(activeChoices.map((c) => c.choice));

  if (activeChoiceNames.has('rock') && activeChoiceNames.has('scissors')) {
    // Rock beats scissors
    if (activeChoiceNames.has('paper')) {
      // Rock, paper, scissors all present - paper wins, rock gets eliminated
      eliminatedChoice = 'rock';
    } else {
      // Only rock vs scissors
      eliminatedChoice = 'scissors';
    }
  } else if (activeChoiceNames.has('paper') && activeChoiceNames.has('rock')) {
    // Paper beats rock (no scissors present)
    eliminatedChoice = 'rock';
  } else if (activeChoiceNames.has('scissors') && activeChoiceNames.has('paper')) {
    // Scissors beats paper (no rock present)
    eliminatedChoice = 'paper';
  }

  let eliminated: string[] = [];

  if (eliminatedChoice) {
    // Eliminate players who chose the losing choice
    const eliminatedResult = results.find((r) => r.choice === eliminatedChoice);
    if (eliminatedResult) {
      eliminated = eliminatedResult.players;
    }
  }

  const remaining = [...choices.keys()].filter((id) => !eliminated.includes(id));

  // Check if we have a single winner
  const winner = remaining.length === 1 ? remaining[0] : null;

  return {
    eliminated,
    remaining,
    results,
    winner,
  };
}

function determineWinner(choice1: string, choice2: string): GameResult {
  if (choice1 === choice2) {
    return 'tie';
  }
  log.info(F, `Player 1 choice: ${choice1}`);
  const player1Choice = rpsChoices[choice1 as keyof typeof rpsChoices];

  if (player1Choice.beats === choice2) {
    return 'player1';
  }

  return 'player2';
}

async function handle1v1Game(
  interaction: ChatInputCommandInteraction,
  opponent: User,
): Promise<void> {
  if (opponent.id === interaction.user.id) {
    await interaction.reply({
      content: 'You cannot play against yourself!',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  if (opponent.bot) {
    await interaction.reply({
      content: 'You cannot play against a bot!',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const player1Id = interaction.user.id;
  const player2Id = opponent.id;

  const game: RPSGame = {
    choices: new Map(),
    eliminatedPlayers: [],
    gameId: `${player1Id}-${player2Id}-${Date.now()}`,
    gameType: '1v1',
    isActive: true,
    players: [player1Id, player2Id],
    round: 1,
    scores: { player1: 0, player2: 0 }, // Always initialize fresh scores
  };

  const embed = create1v1GameEmbed(interaction.user, opponent);
  const buttons = createChoiceButtons(game);

  await interaction.reply({
    components: buttons,
    embeds: [embed],
  });

  const filter = (index: ButtonInteraction): boolean =>
    index.user.id === interaction.user.id || index.user.id === opponent.id;

  let collector: InteractionCollector<ButtonInteraction> | undefined;
  try {
    collector = interaction.channel?.createMessageComponentCollector({
      componentType: ComponentType.Button,
      filter,
      time: 120_000,
    });

    if (!collector) {
      throw new Error('Collector creation failed');
    }
  } catch {
    await interaction.editReply({
      components: [],
      content: 'This command requires the bot to be added to the server to work properly.',
      embeds: [],
    });
    return;
  }

  collector.on('collect', async (index: ButtonInteraction) => {
    if (!game.isActive) {
      return;
    }

    const choice = index.customId.split('_').pop(); // Gets the last part after splitting (e.g., 'rock')
    const gameIdFromButton = index.customId.split('_')[1]; // Gets the gameId part

    if (gameIdFromButton !== game.gameId) {
      return; // Wrong game instance, ignore this button click
    }

    const isNewChoice = !game.choices.has(index.user.id);

    game.choices.set(index.user.id, choice!);
    await index.deferUpdate();

    // Only update embed for new choices (not changes)
    if (isNewChoice && game.choices.size < 2) {
      const statusList = createPlayerStatusList(game, interaction, opponent);
      const updatedEmbed = embedTemplate()
        .setTitle(`⚔️ Round ${game.round}`)
        .setColor(Colors.Orange)
        .setDescription(
          `**${interaction.user.username}** vs **${opponent.username}**\n\n` +
            `${statusList}\n\n` +
            'Both players, make your choice!\n⏰ You have 2 minutes for the entire match!',
        );

      await interaction.editReply({
        components: createChoiceButtons(game),
        embeds: [updatedEmbed],
      });
    }

    if (game.choices.size === 2) {
      const gameEnded = await handle1v1GameEnd(interaction, opponent, game);
      if (gameEnded && collector) {
        collector.stop();
      }
    }
  });

  collector.on('end', async () => {
    if (game.isActive) {
      try {
        if (collector) {
          collector.removeAllListeners();
        }

        const timeoutEmbed = embedTemplate()
          .setTitle('⏰ Game Timeout')
          .setDescription('The game has has timed out after 2 minutes.')
          .setColor(Colors.Red);

        await interaction.editReply({
          components: [],
          embeds: [timeoutEmbed],
        });
      } catch (error) {
        log.error(F, `Could not send timeout message: ${error}`);
      }
    }
  });
}

async function handle1v1GameEnd(
  interaction: ChatInputCommandInteraction,
  opponent: User,
  game: RPSGame,
): Promise<boolean> {
  const gameObject = game;
  gameObject.isActive = false;

  // Ensure scores are initialized (TypeScript safety)
  if (!gameObject.scores) {
    gameObject.scores = { player1: 0, player2: 0 };
  }

  const player1Choice = gameObject.choices.get(interaction.user.id);
  const player2Choice = gameObject.choices.get(opponent.id);

  if (!player1Choice || !player2Choice) {
    await interaction.editReply({
      components: [],
      content: 'Error: Could not retrieve player choices.',
      embeds: [],
    });
    return true;
  }

  const result = determineWinner(player1Choice, player2Choice);

  // Update scores based on round result
  if (result === 'player1') {
    gameObject.scores.player1 += 1;
  } else if (result === 'player2') {
    gameObject.scores.player2 += 1;
  }
  // Ties don't change scores

  let resultMessage: string;
  if (result === 'tie') {
    resultMessage = '🤝 **Round tied!**';
  } else if (result === 'player1') {
    resultMessage = `🏆 **${interaction.user.username} wins the round!**`;
  } else {
    resultMessage = `🏆 **${opponent.username} wins the round!**`;
  }

  const player1ChoiceData = rpsChoices[player1Choice as keyof typeof rpsChoices];
  const player2ChoiceData = rpsChoices[player2Choice as keyof typeof rpsChoices];

  const player1Info = `**${interaction.user.username}:** ${player1ChoiceData.emoji} ${player1ChoiceData.name}`;
  const player2Info = `**${opponent.username}:** ${player2ChoiceData.emoji} ${player2ChoiceData.name}`;

  // Show round results immediately
  const resultEmbed = embedTemplate()
    .setTitle('⚔️ Round Results!')
    .setColor(result === 'tie' ? Colors.Yellow : Colors.Green)
    .setDescription(`${player1Info}\n${player2Info}\n\n${resultMessage}`);

  await interaction.editReply({
    components: [], // No buttons during results display
    embeds: [resultEmbed],
  });

  // Check if game is over (best of 3)
  const gameOver = gameObject.scores.player1 >= 2 || gameObject.scores.player2 >= 2;

  if (gameOver) {
    // Wait 2 seconds, then show final results
    setTimeout(async () => {
      const finalWinner =
        gameObject.scores!.player1 >= 2 ? interaction.user.username : opponent.username;
      const finalEmbed = embedTemplate()
        .setTitle('🏆 Match Complete!')
        .setColor(Colors.Green)
        .setDescription(
          `**Final Score:**\n${interaction.user.username}: ${gameObject.scores!.player1} | ${opponent.username}: ${gameObject.scores!.player2}\n\n` +
            `🎉 **GAME OVER! ${finalWinner} wins the match!** 🎉`,
        );

      await interaction.editReply({
        components: [],
        embeds: [finalEmbed],
      });
    }, 2000);
  } else {
    // Wait 3 seconds, then start next round
    gameObject.round += 1;
    gameObject.choices.clear();
    gameObject.isActive = true;

    setTimeout(async () => {
      const nextRoundEmbed = embedTemplate()
        .setTitle(`⚔️ Round ${gameObject.round}`)
        .setColor(Colors.Green)
        .setDescription(
          `**${interaction.user.username}** vs **${opponent.username}**\n\n` +
            `**Current Score:**\n${interaction.user.username}: ${gameObject.scores!.player1} | ${opponent.username}: ${gameObject.scores!.player2}\n\n` +
            'Both players, make your choice!\n⏰ You have 2 minutes for the entire match!',
        );

      await interaction.editReply({
        components: createChoiceButtons(gameObject),
        embeds: [nextRoundEmbed],
      });
    }, 3000);
  }

  return gameOver;
}

async function handleMultiplayerQueue(interaction: ChatInputCommandInteraction): Promise<void> {
  const playersJoined: string[] = [];
  let timeLeft = 45;

  const gameId = `${interaction.user.id}-${Date.now()}`;

  const queueEmbed = createQueueEmbed(playersJoined, timeLeft);
  const queueButtons = createQueueButtons(gameId);

  await interaction.reply({
    components: queueButtons,
    embeds: [queueEmbed],
  });

  const filter = (index: ButtonInteraction): boolean =>
    index.customId === `rps_${gameId}_join_queue`;

  const queueCollector = interaction.channel?.createMessageComponentCollector({
    componentType: ComponentType.Button,
    filter,
    time: 45_000,
  });

  if (!queueCollector) {
    await interaction.editReply({
      components: [],
      content: 'Error: Could not create queue collector.',
      embeds: [],
    });
    return;
  }

  const timerInterval = setInterval(async () => {
    timeLeft -= 5;
    if (timeLeft > 0) {
      const updatedEmbed = createQueueEmbed(playersJoined, timeLeft);
      await interaction.editReply({
        components: queueButtons,
        embeds: [updatedEmbed],
      });
    }
  }, 5000);

  queueCollector.on('collect', async (index: ButtonInteraction) => {
    if (playersJoined.includes(index.user.id)) {
      await index.reply({
        content: 'You are already in the queue!',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (playersJoined.length >= 10) {
      await index.reply({
        content: 'The queue is full!',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    playersJoined.push(index.user.id);
    await index.reply({
      content: 'You joined the battle queue! ⚔️',
      flags: MessageFlags.Ephemeral,
    });

    const updatedEmbed = createQueueEmbed(playersJoined, timeLeft);
    await interaction.editReply({
      components: queueButtons,
      embeds: [updatedEmbed],
    });
  });

  queueCollector.on('end', async () => {
    clearInterval(timerInterval);

    if (playersJoined.length < 2) {
      queueCollector.removeAllListeners();
      const playerText = playersJoined.length === 1 ? '' : 's';
      const failEmbed = embedTemplate()
        .setTitle('❌ Not Enough Players')
        .setDescription(
          `Only ${playersJoined.length} player${playerText} joined. Minimum 2 players needed.`,
        )
        .setColor(Colors.Red);

      await interaction.editReply({
        components: [],
        embeds: [failEmbed],
      });
      return;
    }

    const multiGame: RPSGame = {
      choices: new Map(),
      eliminatedPlayers: [],
      gameId,
      gameType: 'multiplayer',
      isActive: true,
      players: [...playersJoined],
      round: 1,
    };

    await startMultiplayerRound(interaction, multiGame);
  });
}

async function startMultiplayerRound(
  interaction: ChatInputCommandInteraction,
  game: RPSGame,
): Promise<void> {
  const gameObject = game;
  gameObject.choices = new Map();

  const roundEmbed = createMultiplayerGameEmbed(
    gameObject.players,
    gameObject.round,
    gameObject.eliminatedPlayers,
  );
  const choiceButtons = createChoiceButtons(gameObject);

  await interaction.editReply({
    components: choiceButtons,
    embeds: [roundEmbed],
  });

  const filter = (index: ButtonInteraction): boolean =>
    gameObject.players.includes(index.user.id) && index.customId.startsWith('rps_');

  const roundCollector = interaction.channel?.createMessageComponentCollector({
    componentType: ComponentType.Button,
    filter,
    time: 60_000,
  });

  if (!roundCollector) {
    return;
  }

  roundCollector.on('collect', async (index: ButtonInteraction) => {
    const choice = index.customId.split('_').pop(); // Gets the last part after splitting
    const gameIdFromButton = index.customId.split('_')[1]; // Gets the gameId part

    if (gameIdFromButton !== game.gameId) {
      return;
    }
    // Extra safety check to prevent eliminated players from participating in case of race conditions
    if (!game.players.includes(index.user.id)) {
      await index.deferUpdate();
      return;
    }

    if (game.choices.has(index.user.id)) {
      await index.deferUpdate();
      return;
    }

    game.choices.set(index.user.id, choice!);
    await index.deferUpdate();

    // Update embed with current status
    if (game.choices.size < game.players.length) {
      const statusList = createPlayerStatusList(game, interaction);
      const updatedEmbed = createMultiplayerGameEmbed(
        game.players,
        game.round,
        game.eliminatedPlayers,
      ).setDescription(
        `**Active Players:** ${game.players.length}\n\n` +
          `${statusList}\n\n` +
          '⏰ **60 seconds** to make your choice!\n🎯 Choose wisely - majority wins!',
      );

      await interaction.editReply({
        components: createChoiceButtons(gameObject),
        embeds: [updatedEmbed],
      });
    }

    if (game.choices.size === game.players.length) {
      roundCollector.stop();
    }
  });

  roundCollector.on('end', async () => {
    // Handle players who didn't choose (eliminate them)
    const didNotChoose = gameObject.players.filter((id) => !gameObject.choices.has(id));
    for (const id of didNotChoose) {
      gameObject.eliminatedPlayers.push(id);
      gameObject.players = gameObject.players.filter((p) => p !== id);
    }

    if (gameObject.players.length <= 1) {
      roundCollector.removeAllListeners();
      const winner = gameObject.players[0] || null;
      const finalEmbed = embedTemplate()
        .setTitle('🏆 Game Over!')
        .setDescription(
          winner
            ? `**WINNER:** <@${winner}>\n🎉 Congratulations!`
            : 'No winner - all players eliminated!',
        )
        .setColor(winner ? Colors.Green : Colors.Yellow);

      await interaction.editReply({
        components: [],
        embeds: [finalEmbed],
      });
      return;
    }

    const result = determineMultiplayerWinner(gameObject.choices);

    // Update game state
    for (const id of result.eliminated) {
      gameObject.eliminatedPlayers.push(id);
    }
    gameObject.players = result.remaining;

    const resultsEmbed = createResultsEmbed(
      result.results,
      result.eliminated,
      result.remaining,
      result.winner,
      gameObject.round,
    );

    await interaction.editReply({
      components: [],
      embeds: [resultsEmbed],
    });

    if (result.winner) {
      // Game over
    } else if (gameObject.players.length > 1) {
      // Continue to next round
      gameObject.round += 1;
      setTimeout(() => {
        startMultiplayerRound(interaction, gameObject);
      }, 3000);
    }
  });
}

export const dRockPaperScissors: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('rockpaperscissors')
    .setDescription('Start a Rock-Paper-Scissors game')
    .setContexts([0, 1, 2])
    .setIntegrationTypes([0, 1])
    .addUserOption((option) =>
      option
        .setName('opponent')
        .setDescription('The user you want to play against (leave empty for multiplayer queue)')
        .setRequired(false),
    ) as SlashCommandBuilder,

  async execute(interaction: ChatInputCommandInteraction) {
    const opponent = interaction.options.getUser('opponent');

    if (opponent) {
      await handle1v1Game(interaction, opponent);
      return true;
    }
    // Multiplayer queue - requires server AND bot membership
    if (!interaction.guild) {
      await interaction.reply({
        content:
          '2-10 player RPS can only be played in a server. If you want to play 1v1, please specify an opponent.',
        flags: MessageFlags.Ephemeral,
      });
      return false;
    }
    await handleMultiplayerQueue(interaction);
    return true;
  },
};

export default dRockPaperScissors;
