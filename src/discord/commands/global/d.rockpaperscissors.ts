/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable max-len */
/* eslint-disable sonarjs/no-nested-template-literals */
import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  EmbedBuilder,
  ButtonInteraction,
  User,
  Colors,
  MessageFlags,
  InteractionCollector,
} from 'discord.js';

import { embedTemplate } from '../../utils/embedTemplate';
import { SlashCommand } from '../../@types/commandDef';
import {
  GameResult, MultiplayerResult, RoundResult, RPSGame,
} from '../../@types/rockPaperScissorsDef';
import { t, getLocale, getCommandLocalizations } from '../../../i18n/index';

const F = f(__filename);

const rpsChoices = {
  rock: { emoji: '🪨', name: 'Rock', beats: 'scissors' },
  paper: { emoji: '📄', name: 'Paper', beats: 'rock' },
  scissors: { emoji: '✂️', name: 'Scissors', beats: 'paper' },
};

function createQueueEmbed(playersJoined: string[], timeLeft: number, locale: string): EmbedBuilder {
  const playerList = playersJoined.length > 0 ? playersJoined.map(id => `<@${id}>`).join(', ') : t(locale, 'rockpaperscissors.noPlayersYet');
  return embedTemplate()
    .setTitle(t(locale, 'rockpaperscissors.queueTitle'))
    .setColor(Colors.Green)
    .setDescription(
      t(locale, 'rockpaperscissors.queueDescription', {
        playerCount: playersJoined.length,
        playerList,
        timeLeft,
      }),
    );
}

function createQueueButtons(gameId: string, locale: string, disabled = false): ActionRowBuilder<ButtonBuilder>[] {
  const row = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`rps_${gameId}_join_queue`)
        .setLabel(t(locale, 'rockpaperscissors.joinGameButton'))
        .setEmoji('⚔️')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(disabled),
    );

  return [row];
}

function create1v1GameEmbed(player1: User, player2: User, locale: string): EmbedBuilder {
  return embedTemplate()
    .setTitle(t(locale, 'rockpaperscissors.oneOnOneTitle'))
    .setColor(Colors.Green)
    .setDescription(
      t(locale, 'rockpaperscissors.oneOnOneDescription', {
        player1: player1.username,
        player2: player2.username,
      }),
    );
}

function createMultiplayerGameEmbed(players: string[], round: number, locale: string, eliminated: string[] = []): EmbedBuilder {
  const eliminatedSection = eliminated.length > 0 ? t(locale, 'rockpaperscissors.eliminatedLabel', {
    eliminatedPlayers: eliminated.map(id => `<@${id}>`).join(', '),
  }) : '';
  return embedTemplate()
    .setTitle(t(locale, 'rockpaperscissors.multiplayerRoundTitle', { round }))
    .setColor(Colors.Green)
    .setDescription(
      t(locale, 'rockpaperscissors.multiplayerDescription', {
        activeCount: players.length,
        playerList: players.map(id => `<@${id}>`).join(', '),
        eliminatedSection,
      }),
    );
}

function createChoiceButtons(game: RPSGame, locale: string, disabled = false): ActionRowBuilder<ButtonBuilder>[] {
  const row = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`rps_${game.gameId}_rock`)
        .setLabel(t(locale, 'rockpaperscissors.rockButton'))
        .setEmoji('🪨')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(disabled),
      new ButtonBuilder()
        .setCustomId(`rps_${game.gameId}_paper`)
        .setLabel(t(locale, 'rockpaperscissors.paperButton'))
        .setEmoji('📄')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(disabled),
      new ButtonBuilder()
        .setCustomId(`rps_${game.gameId}_scissors`)
        .setLabel(t(locale, 'rockpaperscissors.scissorsButton'))
        .setEmoji('✂️')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(disabled),
    );

  return [row];
}

function createPlayerStatusList(game: RPSGame, interaction: ChatInputCommandInteraction, locale: string, opponent?: User): string {
  if (game.gameType === '1v1' && opponent) {
    const player1Status = game.choices.has(interaction.user.id) ? '✅' : '⏳';
    const player2Status = game.choices.has(opponent.id) ? '✅' : '⏳';

    const player1StatusText = player1Status === '✅' ? t(locale, 'rockpaperscissors.playerStatusReady') : t(locale, 'rockpaperscissors.playerStatusChoosing');
    const player2StatusText = player2Status === '✅' ? t(locale, 'rockpaperscissors.playerStatusReady') : t(locale, 'rockpaperscissors.playerStatusChoosing');

    return `${player1Status} ${interaction.user.username}: ${player1StatusText}\n`
           + `${player2Status} ${opponent.username}: ${player2StatusText}`;
  }
  // Multiplayer
  return game.players.map(playerId => {
    const status = game.choices.has(playerId) ? '✅' : '⏳';
    const statusText = status === '✅' ? t(locale, 'rockpaperscissors.playerStatusReady') : t(locale, 'rockpaperscissors.playerStatusChoosing');
    return `${status} <@${playerId}>: ${statusText}`;
  }).join('\n');
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

function determineMultiplayerWinner(choices: Map<string, string>): MultiplayerResult {
  // Count choices
  const choiceCounts = { rock: 0, paper: 0, scissors: 0 };
  const choicePlayers = { rock: [] as string[], paper: [] as string[], scissors: [] as string[] };

  choices.forEach((choice, playerId) => {
    choiceCounts[choice as keyof typeof choiceCounts] += 1;
    choicePlayers[choice as keyof typeof choicePlayers].push(playerId);
  });

  const results = Object.entries(choiceCounts).map(([choice, count]) => ({
    choice,
    count,
    players: choicePlayers[choice as keyof typeof choicePlayers],
  })).filter(r => r.count > 0);

  // If only one choice was made, no elimination
  const activeChoices = results.filter(r => r.count > 0);
  if (activeChoices.length === 1) {
    return {
      winner: null,
      eliminated: [],
      remaining: Array.from(choices.keys()),
      results,
    };
  }

  // Special case: only 2 players left (should be standard RPS)
  if (Array.from(choices.keys()).length === 2) {
    const [player1Id, player2Id] = Array.from(choices.keys());
    const choice1 = choices.get(player1Id)!;
    const choice2 = choices.get(player2Id)!;

    if (choice1 === choice2) {
    // Tie - no elimination
      return {
        winner: null,
        eliminated: [],
        remaining: [player1Id, player2Id],
        results,
      };
    }

    // Determine winner using standard RPS
    const rpsResult = determineWinner(choice1, choice2);
    const winnerId = rpsResult === 'player1' ? player1Id : player2Id;
    const loserId = rpsResult === 'player1' ? player2Id : player1Id;

    return {
      winner: winnerId,
      eliminated: [loserId],
      remaining: [winnerId],
      results,
    };
  }

  // Multiplayer logic: find the choice that gets eliminated
  let eliminatedChoice: string | null = null;

  // Check all possible RPS matchups among active choices
  const activeChoiceNames = activeChoices.map(c => c.choice);

  if (activeChoiceNames.includes('rock') && activeChoiceNames.includes('scissors')) {
    // Rock beats scissors
    if (!activeChoiceNames.includes('paper')) {
      // Only rock vs scissors
      eliminatedChoice = 'scissors';
    } else {
      // Rock, paper, scissors all present - paper wins, rock gets eliminated
      eliminatedChoice = 'rock';
    }
  } else if (activeChoiceNames.includes('paper') && activeChoiceNames.includes('rock')) {
    // Paper beats rock (no scissors present)
    eliminatedChoice = 'rock';
  } else if (activeChoiceNames.includes('scissors') && activeChoiceNames.includes('paper')) {
    // Scissors beats paper (no rock present)
    eliminatedChoice = 'paper';
  }

  let eliminated: string[] = [];

  if (eliminatedChoice) {
    // Eliminate players who chose the losing choice
    const eliminatedResult = results.find(r => r.choice === eliminatedChoice);
    if (eliminatedResult) {
      eliminated = eliminatedResult.players;
    }
  }

  const remaining = Array.from(choices.keys()).filter(id => !eliminated.includes(id));

  // Check if we have a single winner
  const winner = remaining.length === 1 ? remaining[0] : null;

  return {
    winner, eliminated, remaining, results,
  };
}

function createResultsEmbed(
  results: RoundResult[],
  eliminated: string[],
  remaining: string[],
  winner: string | null,
  round: number,
  locale: string,
): EmbedBuilder {
  const embed = embedTemplate()
    .setTitle(t(locale, 'rockpaperscissors.roundResultsTitle', { round }))
    .setColor(winner ? Colors.Green : Colors.Yellow);

  let description = `${t(locale, 'rockpaperscissors.resultsHeader')}\n`;
  results.forEach(result => {
    const { emoji } = rpsChoices[result.choice as keyof typeof rpsChoices];
    const choiceLabel = result.choice.charAt(0).toUpperCase() + result.choice.slice(1);
    const plural = result.count !== 1 ? 's' : '';
    description += `${t(locale, 'rockpaperscissors.resultFormat', {
      emoji,
      choice: choiceLabel,
      count: result.count,
      plural,
    })}\n`;
  });

  if (eliminated.length > 0) {
    description += t(locale, 'rockpaperscissors.resultEliminated', {
      eliminatedPlayers: eliminated.map(id => `<@${id}>`).join(', '),
    });
  }

  if (winner) {
    description += t(locale, 'rockpaperscissors.resultWinner', {
      winner: `<@${winner}>`,
    });
  } else if (remaining.length > 1) {
    description += t(locale, 'rockpaperscissors.resultAdvancing', {
      advancingPlayers: remaining.map(id => `<@${id}>`).join(', '),
    });
  }

  embed.setDescription(description);
  return embed;
}

async function startMultiplayerRound(interaction: ChatInputCommandInteraction, game: RPSGame, locale: string): Promise<void> {
  const gameObj = game;
  gameObj.choices = new Map();

  const roundEmbed = createMultiplayerGameEmbed(gameObj.players, gameObj.round, locale, gameObj.eliminatedPlayers);
  const choiceButtons = createChoiceButtons(gameObj, locale, false);

  await interaction.editReply({
    embeds: [roundEmbed],
    components: choiceButtons,
  });

  const filter = (i: ButtonInteraction): boolean => gameObj.players.includes(i.user.id) && i.customId.startsWith('rps_');

  const roundCollector = interaction.channel?.createMessageComponentCollector({
    componentType: ComponentType.Button,
    filter,
    time: 60000,
  });

  if (!roundCollector) return;

  roundCollector.on('collect', async (i: ButtonInteraction) => {
    const choice = i.customId.split('_').pop(); // Gets the last part after splitting
    const gameIdFromButton = i.customId.split('_')[1]; // Gets the gameId part

    if (gameIdFromButton !== game.gameId) {
      return;
    }
    // Extra safety check to prevent eliminated players from participating in case of race conditions
    if (!game.players.includes(i.user.id)) {
      await i.deferUpdate();
      return;
    }

    if (game.choices.has(i.user.id)) {
      await i.deferUpdate();
      return;
    }

    game.choices.set(i.user.id, choice as string);
    await i.deferUpdate();

    // Update embed with current status
    if (game.choices.size < game.players.length) {
      try {
        const statusList = createPlayerStatusList(game, interaction, locale);
        const updatedEmbed = createMultiplayerGameEmbed(game.players, game.round, locale, game.eliminatedPlayers)
          .setDescription(
            t(locale, 'rockpaperscissors.multiplayerDescription', {
              activeCount: game.players.length,
              playerList: statusList,
              eliminatedSection: '',
            }),
          );

        await interaction.editReply({
          embeds: [updatedEmbed],
          components: createChoiceButtons(gameObj, locale, false),
        });
      } catch (error) {
        // Message was likely deleted, stop the collector
        roundCollector.stop();
      }
    }

    if (game.choices.size === game.players.length) {
      roundCollector.stop();
    }
  });

  roundCollector.on('end', async () => {
    // Handle players who didn't choose (eliminate them)
    const didNotChoose = gameObj.players.filter(id => !gameObj.choices.has(id));
    didNotChoose.forEach(id => {
      gameObj.eliminatedPlayers.push(id);
      gameObj.players = gameObj.players.filter(p => p !== id);
    });

    if (gameObj.players.length <= 1) {
      roundCollector.removeAllListeners();
      const winner = gameObj.players[0] || null;
      const finalEmbed = embedTemplate()
        .setTitle(t(locale, 'rockpaperscissors.gameOverTitle'))
        .setDescription(
          winner ? t(locale, 'rockpaperscissors.gameOverWinner', { winner: `<@${winner}>` }) : t(locale, 'rockpaperscissors.gameOverNoWinner'),
        )
        .setColor(winner ? Colors.Green : Colors.Yellow);

      await interaction.editReply({
        embeds: [finalEmbed],
        components: [],
      });
      return;
    }

    const result = determineMultiplayerWinner(gameObj.choices);

    // Update game state
    result.eliminated.forEach(id => {
      gameObj.eliminatedPlayers.push(id);
    });
    gameObj.players = result.remaining;

    const resultsEmbed = createResultsEmbed(
      result.results,
      result.eliminated,
      result.remaining,
      result.winner,
      gameObj.round,
      locale,
    );

    try {
      await interaction.editReply({
        embeds: [resultsEmbed],
        components: [],
      });
    } catch (error) {
      // Message was likely deleted, game is over
      return;
    }

    if (result.winner) {
      // Game over

    } else if (gameObj.players.length > 1) {
      // Continue to next round
      gameObj.round += 1;
      setTimeout(async () => {
        try {
          await startMultiplayerRound(interaction, gameObj, locale);
        } catch (error) {
          // Message was likely deleted, game is over
        }
      }, 3000);
    }
  });
}

async function handle1v1GameEnd(
  interaction: ChatInputCommandInteraction,
  opponent: User,
  game: RPSGame,
  locale: string,
): Promise<boolean> {
  const gameObj = game;
  gameObj.isActive = false;

  // Ensure scores are initialized (TypeScript safety)
  if (!gameObj.scores) {
    gameObj.scores = { player1: 0, player2: 0 };
  }

  const player1Choice = gameObj.choices.get(interaction.user.id);
  const player2Choice = gameObj.choices.get(opponent.id);

  if (!player1Choice || !player2Choice) {
    await interaction.editReply({
      content: t(locale, 'rockpaperscissors.choicePersistError'),
      embeds: [],
      components: [],
    });
    return true;
  }

  const result = determineWinner(player1Choice, player2Choice);

  // Update scores based on round result
  if (result === 'player1') {
    gameObj.scores.player1 += 1;
  } else if (result === 'player2') {
    gameObj.scores.player2 += 1;
  }
  // Ties don't change scores

  let resultMessage: string;
  if (result === 'tie') {
    resultMessage = t(locale, 'rockpaperscissors.roundTied');
  } else if (result === 'player1') {
    resultMessage = t(locale, 'rockpaperscissors.roundWinner', { winner: interaction.user.username });
  } else {
    resultMessage = t(locale, 'rockpaperscissors.roundWinner', { winner: opponent.username });
  }

  const player1ChoiceData = rpsChoices[player1Choice as keyof typeof rpsChoices];
  const player2ChoiceData = rpsChoices[player2Choice as keyof typeof rpsChoices];

  const player1Info = t(locale, 'rockpaperscissors.choiceDisplay', {
    player: interaction.user.username,
    emoji: player1ChoiceData.emoji,
    choice: player1ChoiceData.name,
  });
  const player2Info = t(locale, 'rockpaperscissors.choiceDisplay', {
    player: opponent.username,
    emoji: player2ChoiceData.emoji,
    choice: player2ChoiceData.name,
  });

  // Show round results immediately
  const resultEmbed = embedTemplate()
    .setTitle(t(locale, 'rockpaperscissors.roundResultsTitle', { round: game.round }))
    .setColor(result === 'tie' ? Colors.Yellow : Colors.Green)
    .setDescription(`${player1Info}\n${player2Info}\n\n${resultMessage}`);

  await interaction.editReply({
    embeds: [resultEmbed],
    components: [], // No buttons during results display
  });

  // Check if game is over (best of 3)
  const gameOver = gameObj.scores.player1 >= 2 || gameObj.scores.player2 >= 2;

  if (gameOver) {
    // Wait 2 seconds, then show final results
    setTimeout(async () => {
      try {
        const finalWinner = gameObj.scores!.player1 >= 2 ? interaction.user.username : opponent.username;
        const finalEmbed = embedTemplate()
          .setTitle(t(locale, 'rockpaperscissors.matchCompleteTitle'))
          .setColor(Colors.Green)
          .setDescription(
            t(locale, 'rockpaperscissors.matchCompleteScore', {
              player1: interaction.user.username,
              score1: gameObj.scores!.player1,
              player2: opponent.username,
              score2: gameObj.scores!.player2,
              winner: finalWinner,
            }),
          );

        await interaction.editReply({
          embeds: [finalEmbed],
          components: [],
        });
      } catch (error) {
        // Message was likely deleted, game is over
      }
    }, 2000);
  } else {
    // Wait 3 seconds, then start next round
    gameObj.round += 1;
    gameObj.choices.clear();
    gameObj.isActive = true;
    gameObj.roundProcessed = false; // Reset for next round

    setTimeout(async () => {
      try {
        const nextRoundEmbed = embedTemplate()
          .setTitle(t(locale, 'rockpaperscissors.nextRoundTitle', { round: gameObj.round }))
          .setColor(Colors.Green)
          .setDescription(
            t(locale, 'rockpaperscissors.nextRoundDescription', {
              player1: interaction.user.username,
              player2: opponent.username,
              score1: gameObj.scores!.player1,
              score2: gameObj.scores!.player2,
            }),
          );

        await interaction.editReply({
          embeds: [nextRoundEmbed],
          components: createChoiceButtons(gameObj, locale, false),
        });
      } catch (error) {
        // Message was likely deleted, game is over
        gameObj.isActive = false;
      }
    }, 3000);
  }

  return gameOver;
}

async function handle1v1Game(interaction: ChatInputCommandInteraction, opponent: User, locale: string): Promise<void> {
  if (opponent.id === interaction.user.id) {
    await interaction.reply({
      content: t(locale, 'rockpaperscissors.cannotPlayYourself'),
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  if (opponent.bot) {
    await interaction.reply({
      content: t(locale, 'rockpaperscissors.cannotPlayBot'),
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const player1Id = interaction.user.id;
  const player2Id = opponent.id;

  const game: RPSGame = {
    gameId: `${player1Id}-${player2Id}-${Date.now()}`,
    players: [player1Id, player2Id],
    choices: new Map(),
    isActive: true,
    gameType: '1v1',
    round: 1,
    eliminatedPlayers: [],
    scores: { player1: 0, player2: 0 }, // Always initialize fresh scores
    roundProcessed: false, // Prevents duplicate scoring
  };

  const embed = create1v1GameEmbed(interaction.user, opponent, locale);
  const buttons = createChoiceButtons(game, locale, false);

  await interaction.reply({
    embeds: [embed],
    components: buttons,
  });

  const filter = (i: ButtonInteraction): boolean => i.user.id === interaction.user.id || i.user.id === opponent.id;

  let collector: InteractionCollector<ButtonInteraction> | undefined;
  try {
    collector = interaction.channel?.createMessageComponentCollector({
      componentType: ComponentType.Button,
      filter,
      time: 120000,
    });

    if (!collector) {
      throw new Error('Collector creation failed');
    }
  } catch (error) {
    await interaction.editReply({
      content: t(locale, 'rockpaperscissors.collectorCreationFailed'),
      embeds: [],
      components: [],
    });
    return;
  }

  collector.on('collect', async (i: ButtonInteraction) => {
    if (!game.isActive) return;

    const choice = i.customId.split('_').pop(); // Gets the last part after splitting (e.g., 'rock')
    const gameIdFromButton = i.customId.split('_')[1]; // Gets the gameId part

    if (gameIdFromButton !== game.gameId) {
      return; // Wrong game instance, ignore this button click
    }

    const isNewChoice = !game.choices.has(i.user.id);

    game.choices.set(i.user.id, choice as string);
    await i.deferUpdate();

    // Only update embed for new choices (not changes)
    if (isNewChoice && game.choices.size < 2) {
      try {
        const updatedEmbed = embedTemplate()
          .setTitle(t(locale, 'rockpaperscissors.nextRoundTitle', { round: game.round }))
          .setColor(Colors.Orange)
          .setDescription(
            t(locale, 'rockpaperscissors.oneOnOneDescription', {
              player1: interaction.user.username,
              player2: opponent.username,
            }),
          );

        await interaction.editReply({
          embeds: [updatedEmbed],
          components: createChoiceButtons(game, locale, false),
        });
      } catch (error) {
        // Message was likely deleted, stop the collector
        game.isActive = false;
        if (collector) {
          collector.stop();
        }
      }
    }

    if (game.choices.size === 2 && !game.roundProcessed) {
      game.roundProcessed = true;
      const gameEnded = await handle1v1GameEnd(interaction, opponent, game, locale);
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
          .setTitle(t(locale, 'rockpaperscissors.timeoutTitle'))
          .setDescription(t(locale, 'rockpaperscissors.timeoutDescription'))
          .setColor(Colors.Red);

        await interaction.editReply({
          embeds: [timeoutEmbed],
          components: [],
        });
      } catch (error) {
        log.error(F, `Could not send timeout message: ${error}`);
      }
    }
  });
}

async function handleMultiplayerQueue(interaction: ChatInputCommandInteraction, locale: string): Promise<void> {
  const playersJoined: string[] = [];
  let timeLeft = 45;

  const gameId = `${interaction.user.id}-${Date.now()}`;

  const queueEmbed = createQueueEmbed(playersJoined, timeLeft, locale);
  const queueButtons = createQueueButtons(gameId, locale, false);

  await interaction.reply({
    embeds: [queueEmbed],
    components: queueButtons,
  });

  const filter = (i: ButtonInteraction): boolean => i.customId === `rps_${gameId}_join_queue`;

  const queueCollector = interaction.channel?.createMessageComponentCollector({
    componentType: ComponentType.Button,
    filter,
    time: 45000,
  });

  if (!queueCollector) {
    await interaction.editReply({
      content: t(locale, 'rockpaperscissors.collectorError'),
      embeds: [],
      components: [],
    });
    return;
  }

  const timerInterval = setInterval(async () => {
    timeLeft -= 5;
    if (timeLeft > 0) {
      try {
        const updatedEmbed = createQueueEmbed(playersJoined, timeLeft, locale);
        await interaction.editReply({
          embeds: [updatedEmbed],
          components: queueButtons,
        });
      } catch (error) {
        // Message was likely deleted, stop the timer and collector
        clearInterval(timerInterval);
        if (queueCollector) {
          queueCollector.stop();
        }
      }
    }
  }, 5000);

  queueCollector.on('collect', async (i: ButtonInteraction) => {
    if (playersJoined.includes(i.user.id)) {
      await i.reply({
        content: t(locale, 'rockpaperscissors.alreadyInQueue'),
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (playersJoined.length >= 10) {
      await i.reply({
        content: t(locale, 'rockpaperscissors.queueFull'),
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    playersJoined.push(i.user.id);
    await i.reply({
      content: t(locale, 'rockpaperscissors.joinedQueue'),
      flags: MessageFlags.Ephemeral,
    });

    const updatedEmbed = createQueueEmbed(playersJoined, timeLeft, locale);
    await interaction.editReply({
      embeds: [updatedEmbed],
      components: queueButtons,
    });
  });

  queueCollector.on('end', async () => {
    clearInterval(timerInterval);

    if (playersJoined.length < 2) {
      queueCollector.removeAllListeners();
      const plural = playersJoined.length !== 1 ? 's' : '';
      const failEmbed = embedTemplate()
        .setTitle(t(locale, 'rockpaperscissors.notEnoughPlayersTitle'))
        .setDescription(t(locale, 'rockpaperscissors.notEnoughPlayersDescription', {
          playerCount: playersJoined.length,
          plural,
        }))
        .setColor(Colors.Red);

      try {
        await interaction.editReply({
          embeds: [failEmbed],
          components: [],
        });
      } catch (error) {
        // Message was likely deleted, game is over
      }
      return;
    }

    const multiGame: RPSGame = {
      gameId,
      players: [...playersJoined],
      choices: new Map(),
      isActive: true,
      gameType: 'multiplayer',
      round: 1,
      eliminatedPlayers: [],
    };

    await startMultiplayerRound(interaction, multiGame, locale);
  });
}

export const dRockPaperScissors: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('rockpaperscissors')
    .setNameLocalizations(getCommandLocalizations('rockpaperscissors.commandName'))
    .setDescription('Start a Rock-Paper-Scissors game')
    .setDescriptionLocalizations(getCommandLocalizations('rockpaperscissors.commandDescription'))
    .setContexts([0, 1, 2])
    .setIntegrationTypes([0, 1])
    .addUserOption(option => option
      .setName('opponent')
      .setDescription('The user you want to play against (leave empty for multiplayer queue)')
      .setRequired(false)) as SlashCommandBuilder,

  async execute(interaction: ChatInputCommandInteraction) {
    const locale = await getLocale(interaction, 'rockpaperscissors');
    const opponent = interaction.options.getUser('opponent');

    if (opponent) {
      await handle1v1Game(interaction, opponent, locale);
      return true;
    }
    // Multiplayer queue - requires server AND bot membership
    if (!interaction.guild) {
      await interaction.reply({
        content: t(locale, 'rockpaperscissors.multiplayerOnlyDescription'),
        flags: MessageFlags.Ephemeral,
      });
      return false;
    }
    await handleMultiplayerQueue(interaction, locale);
    return true;
  },
};

export default dRockPaperScissors;
