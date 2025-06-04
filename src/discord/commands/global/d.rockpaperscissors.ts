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
} from 'discord.js';

interface SlashCommand {
  data: SlashCommandBuilder;
  execute(interaction: ChatInputCommandInteraction): Promise<void>;
}

interface RPSGame {
  players: string[];
  choices: Map<string, string>;
  isActive: boolean;
  gameType: '1v1' | 'multiplayer';
  round: number;
  eliminatedPlayers: string[];
  scores?: { player1: number; player2: number }; // Add this line
}

const rpsChoices = {
  rock: { emoji: '🪨', name: 'Rock', beats: 'scissors' },
  paper: { emoji: '📄', name: 'Paper', beats: 'rock' },
  scissors: { emoji: '✂️', name: 'Scissors', beats: 'paper' },
};

function createQueueEmbed(playersJoined: string[], timeLeft: number): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle('🎮 Rock Paper Scissors - Join the Battle!')
    .setColor(Colors.Green)
    .setDescription(
      `**Players Joined:** ${playersJoined.length}/10\n`
      + `${playersJoined.length > 0 ? playersJoined.map(id => `<@${id}>`).join(', ') : 'No players yet...'}\n\n`
      + `⏰ **Time left to join:** ${timeLeft} seconds\n`
      + '🎯 **Minimum players needed:** 4\n\n'
      + 'Click the button below to join!',
    );
}

function createQueueButtons(disabled = false): ActionRowBuilder<ButtonBuilder>[] {
  const row = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('rps_join_queue')
        .setLabel('Join Game')
        .setEmoji('⚔️')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(disabled),
    );

  return [row];
}

function create1v1GameEmbed(player1: User, player2: User): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle('⚔️ Rock Paper Scissors - 1v1 Battle!')
    .setColor(Colors.Green)
    .setDescription(
      `**${player1.username}** vs **${player2.username}**\n\n`
      + 'Both players, make your choice!\n'
      + '⏰ You have 30 seconds to decide!',
    );
}

function createMultiplayerGameEmbed(players: string[], round: number, eliminated: string[] = []): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle(`🏆 Rock Paper Scissors - Round ${round}`)
    .setColor(Colors.Green)
    .setDescription(
      `**Active Players:** ${players.length}\n`
      + `${players.map(id => `<@${id}>`).join(', ')}\n\n${
        eliminated.length > 0 ? `**Eliminated:** ${eliminated.map(id => `<@${id}>`).join(', ')}\n\n` : ''
      }⏰ **60 seconds** to make your choice!\n`
      + '🎯 Choose wisely - majority wins!',
    );
}

function createChoiceButtons(disabled = false): ActionRowBuilder<ButtonBuilder>[] {
  const row = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('rps_rock')
        .setLabel('Rock')
        .setEmoji('🪨')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(disabled),
      new ButtonBuilder()
        .setCustomId('rps_paper')
        .setLabel('Paper')
        .setEmoji('📄')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(disabled),
      new ButtonBuilder()
        .setCustomId('rps_scissors')
        .setLabel('Scissors')
        .setEmoji('✂️')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(disabled),
    );

  return [row];
}

function determineWinner(choice1: string, choice2: string): 'player1' | 'player2' | 'tie' {
  if (choice1 === choice2) return 'tie';
  if (rpsChoices[choice1 as keyof typeof rpsChoices]?.beats === choice2) return 'player1';
  return 'player2';
}

function determineMultiplayerWinner(choices: Map<string, string>): {
  winner: string | null,
  eliminated: string[],
  remaining: string[],
  results: { choice: string, count: number, players: string[] }[]
} {
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
    if (rpsResult === 'player1') {
      return {
        winner: player1Id,
        eliminated: [player2Id],
        remaining: [player1Id],
        results,
      };
    }
    return {
      winner: player2Id,
      eliminated: [player1Id],
      remaining: [player2Id],
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
  results: { choice: string, count: number, players: string[] }[],
  eliminated: string[],
  remaining: string[],
  winner: string | null,
  round: number,
): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle(`🎲 Round ${round} Results`)
    .setColor(winner ? Colors.Green : Colors.Yellow);

  let description = '**Results:**\n';
  results.forEach(result => {
    const { emoji } = rpsChoices[result.choice as keyof typeof rpsChoices];
    description += `${emoji} **${result.choice.charAt(0).toUpperCase() + result.choice.slice(1)}**: ${result.count} player${result.count !== 1 ? 's' : ''}\n`;
  });

  if (eliminated.length > 0) {
    description += `\n❌ **Eliminated:** ${eliminated.map(id => `<@${id}>`).join(', ')}\n`;
  }

  if (winner) {
    description += `\n🏆 **WINNER:** <@${winner}>\n🎉 Congratulations!`;
  } else if (remaining.length > 1) {
    description += `\n✅ **Advancing to next round:** ${remaining.map(id => `<@${id}>`).join(', ')}`;
  }

  embed.setDescription(description);
  return embed;
}

async function startMultiplayerRound(interaction: ChatInputCommandInteraction, game: RPSGame): Promise<void> {
  const gameObj = game;
  gameObj.choices.clear();

  const roundEmbed = createMultiplayerGameEmbed(gameObj.players, gameObj.round, gameObj.eliminatedPlayers);
  const choiceButtons = createChoiceButtons();

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
    if (gameObj.choices.has(i.user.id)) {
      await i.reply({
        content: 'You have already made your choice!',
        ephemeral: true,
      });
      return;
    }

    const choice = i.customId.replace('rps_', '');
    gameObj.choices.set(i.user.id, choice);

    const choiceData = rpsChoices[choice as keyof typeof rpsChoices];
    const choiceEmoji = choiceData.emoji;
    const choiceName = choiceData.name;

    await i.reply({
      content: `You chose ${choiceEmoji} ${choiceName}!`,
      ephemeral: true,
    });

    if (gameObj.choices.size === gameObj.players.length) {
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
      const winner = gameObj.players[0] || null;
      const finalEmbed = new EmbedBuilder()
        .setTitle('🏆 Game Over!')
        .setDescription(
          winner ? `**WINNER:** <@${winner}>\n🎉 Congratulations!` : 'No winner - all players eliminated!',
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
    );

    await interaction.editReply({
      embeds: [resultsEmbed],
      components: [],
    });

    if (result.winner) {
      // Game over

    } else if (gameObj.players.length > 1) {
      // Continue to next round
      gameObj.round += 1;
      setTimeout(() => {
        startMultiplayerRound(interaction, gameObj);
      }, 3000);
    }
  });
}

async function handle1v1GameEnd(
  interaction: ChatInputCommandInteraction,
  opponent: User,
  game: RPSGame,
): Promise<boolean> {
  const gameObj = game;
  gameObj.isActive = false;

  const player1Choice = gameObj.choices.get(interaction.user.id);
  const player2Choice = gameObj.choices.get(opponent.id);

  if (!player1Choice || !player2Choice) {
    await interaction.editReply({
      content: 'Error: Could not retrieve player choices.',
      embeds: [],
      components: [],
    });
    return true;
  }

  const result = determineWinner(player1Choice, player2Choice);

  // Add score tracking
  if (!gameObj.scores) {
    gameObj.scores = { player1: 0, player2: 0 };
  }

  // Update scores based on round result
  if (result === 'player1') {
    gameObj.scores.player1 += 1;
  } else if (result === 'player2') {
    gameObj.scores.player2 += 1;
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
  const resultEmbed = new EmbedBuilder()
    .setTitle('⚔️ Round Results!')
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
      const finalWinner = gameObj.scores!.player1 >= 2 ? interaction.user.username : opponent.username;
      const finalEmbed = new EmbedBuilder()
        .setTitle('🏆 Match Complete!')
        .setColor(Colors.Green)
        .setDescription(
          `**Final Score:** ${interaction.user.username} ${gameObj.scores!.player1} - ${gameObj.scores!.player2} ${opponent.username}\n\n`
          + `🎉 **GAME OVER! ${finalWinner} wins the match!** 🎉`,
        );

      await interaction.editReply({
        embeds: [finalEmbed],
        components: [],
      });
    }, 2000);
  } else {
    // Wait 3 seconds, then start next round
    gameObj.round += 1;
    gameObj.choices.clear();
    gameObj.isActive = true;

    setTimeout(async () => {
      const nextRoundEmbed = new EmbedBuilder()
        .setTitle(`⚔️ Round ${gameObj.round}/3`)
        .setColor(Colors.Green)
        .setDescription(
          `**${interaction.user.username}** vs **${opponent.username}**\n\n`
          + `**Current Score:** ${interaction.user.username} ${gameObj.scores!.player1} - ${gameObj.scores!.player2} ${opponent.username}\n\n`
          + 'Both players, make your choice!\n⏰ You have 30 seconds to decide!',
        );

      await interaction.editReply({
        embeds: [nextRoundEmbed],
        components: createChoiceButtons(),
      });
    }, 3000);
  }

  return gameOver;
}

async function handle1v1Game(interaction: ChatInputCommandInteraction, opponent: User): Promise<void> {
  if (opponent.id === interaction.user.id) {
    await interaction.reply({
      content: 'You cannot play against yourself!',
      ephemeral: true,
    });
    return;
  }

  if (opponent.bot) {
    await interaction.reply({
      content: 'You cannot play against a bot!',
      ephemeral: true,
    });
    return;
  }

  const game: RPSGame = {
    players: [interaction.user.id, opponent.id],
    choices: new Map(),
    isActive: true,
    gameType: '1v1',
    round: 1,
    eliminatedPlayers: [],
    scores: { player1: 0, player2: 0 }, // Add this line
  };

  const embed = create1v1GameEmbed(interaction.user, opponent);
  const buttons = createChoiceButtons();

  await interaction.reply({
    embeds: [embed],
    components: buttons,
  });

  const filter = (i: ButtonInteraction): boolean => i.user.id === interaction.user.id || i.user.id === opponent.id;

  const collector = interaction.channel?.createMessageComponentCollector({
    componentType: ComponentType.Button,
    filter,
    time: 120000,
  });

  if (!collector) {
    await interaction.editReply({
      content: 'Error: Could not create game collector.',
      embeds: [],
      components: [],
    });
    return;
  }

  collector.on('collect', async (i: ButtonInteraction) => {
    if (!game.isActive) return;

    const choice = i.customId.replace('rps_', '');
    game.choices.set(i.user.id, choice);

    const choiceData = rpsChoices[choice as keyof typeof rpsChoices];
    await i.reply({
      content: `You chose ${choiceData.emoji} ${choiceData.name}!`,
      ephemeral: true,
    });

    if (game.choices.size === 2) {
      const gameEnded = await handle1v1GameEnd(interaction, opponent, game);
      if (gameEnded) {
        collector.stop();
      }
    }
  });
}

async function handleMultiplayerQueue(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.guild) {
    await interaction.reply({
      content: 'This command can only be used in a server.',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const playersJoined: string[] = [];
  let timeLeft = 45;

  const queueEmbed = createQueueEmbed(playersJoined, timeLeft);
  const queueButtons = createQueueButtons();

  await interaction.reply({
    embeds: [queueEmbed],
    components: queueButtons,
  });

  const filter = (i: ButtonInteraction): boolean => i.customId === 'rps_join_queue';

  const queueCollector = interaction.channel?.createMessageComponentCollector({
    componentType: ComponentType.Button,
    filter,
    time: 45000,
  });

  if (!queueCollector) {
    await interaction.editReply({
      content: 'Error: Could not create queue collector.',
      embeds: [],
      components: [],
    });
    return;
  }

  const timerInterval = setInterval(async () => {
    timeLeft -= 5;
    if (timeLeft > 0) {
      const updatedEmbed = createQueueEmbed(playersJoined, timeLeft);
      await interaction.editReply({
        embeds: [updatedEmbed],
        components: queueButtons,
      });
    }
  }, 5000);

  queueCollector.on('collect', async (i: ButtonInteraction) => {
    if (playersJoined.includes(i.user.id)) {
      await i.reply({
        content: 'You are already in the queue!',
        ephemeral: true,
      });
      return;
    }

    if (playersJoined.length >= 10) {
      await i.reply({
        content: 'The queue is full!',
        ephemeral: true,
      });
      return;
    }

    playersJoined.push(i.user.id);
    await i.reply({
      content: 'You joined the battle queue! ⚔️',
      ephemeral: true,
    });

    const updatedEmbed = createQueueEmbed(playersJoined, timeLeft);
    await interaction.editReply({
      embeds: [updatedEmbed],
      components: queueButtons,
    });
  });

  queueCollector.on('end', async () => {
    clearInterval(timerInterval);

    if (playersJoined.length < 4) {
      const playerText = playersJoined.length !== 1 ? 's' : '';
      const failEmbed = new EmbedBuilder()
        .setTitle('❌ Not Enough Players')
        .setDescription(`Only ${playersJoined.length} player${playerText} joined. Minimum 4 players needed.`)
        .setColor(0xff0000);

      await interaction.editReply({
        embeds: [failEmbed],
        components: [],
      });
      return;
    }

    const multiGame: RPSGame = {
      players: [...playersJoined],
      choices: new Map(),
      isActive: true,
      gameType: 'multiplayer',
      round: 1,
      eliminatedPlayers: [],
    };

    await startMultiplayerRound(interaction, multiGame);
  });
}

export const dRockPaperScissors: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('rockpaperscissors')
    .setDescription('Start a Rock-Paper-Scissors game')
    .setContexts([0, 1, 2])
    .setIntegrationTypes([0, 1])
    .addUserOption(option => option
      .setName('opponent')
      .setDescription('The user you want to play against (leave empty for multiplayer queue)')
      .setRequired(false)) as SlashCommandBuilder,

  async execute(interaction: ChatInputCommandInteraction) {
    const opponent = interaction.options.getUser('opponent');

    if (opponent) {
      await handle1v1Game(interaction, opponent);
    } else {
      await handleMultiplayerQueue(interaction);
    }
  },
};

export default dRockPaperScissors;
