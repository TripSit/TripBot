import {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  EmbedBuilder,
  ButtonInteraction,
  ChatInputCommandInteraction,
  Colors,
} from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';

interface TicTacToeGame {
  board: string[];
  currentPlayer: string;
  player1: string;
  player2: string;
  isGameOver: boolean;
  winner: string | null;
  capturedPieces: { X: number; O: number };
}

function createGameEmbed(
  game: TicTacToeGame,
  player1Name: string,
  player2Name: string,
): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle('🎮 Tactical Tic-Tac-Toe (4x4)')
    .setColor(0x0099ff);

  let description = `${player1Name} (❌) vs ${player2Name} (⭕)\n`;
  description += `**Captures:** ❌${game.capturedPieces.X} | ⭕${game.capturedPieces.O}\n\n`;
  description += '🎯 **Win by capturing pieces:** ❌ needs 3 | ⭕ needs 2\n';
  description += '💡 **Capture:** Surround opponent on opposite sides\n\n';

  if (game.isGameOver) {
    if (game.winner === 'tie') {
      description += '\n🤝✨ **IT\'S A TIE!** ✨🤝\n🎭 What an epic battle! Both players fought valiantly! 🎭';
      embed.setColor(Colors.Yellow);
    } else if (game.winner !== 'tie') {
      const winnerName = game.winner === 'X' ? player1Name : player2Name;
      const winnerSymbol = game.winner === 'X' ? '❌' : '⭕';
      // eslint-disable-next-line max-len
      description += `\n🏆🎉 **${winnerName.toUpperCase()} WINS!** 🎉🏆\n👑 Absolutely magnificent victory! 👑\n🌟 ${winnerSymbol} CHAMPION ${winnerSymbol} 🌟`;
      embed.setColor(Colors.Green);
    }
  } else {
    const currentPlayerName = game.currentPlayer === 'X' ? player1Name : player2Name;
    const currentSymbol = game.currentPlayer === 'X' ? '❌' : '⭕';
    description += `\n${currentSymbol} **${currentPlayerName}'s turn**`;
  }

  embed.setDescription(description);
  return embed;
}

function createGameButtons(game: TicTacToeGame): ActionRowBuilder<ButtonBuilder>[] {
  const rows: ActionRowBuilder<ButtonBuilder>[] = [];

  [0, 4, 8, 12].forEach(i => { // 4x4 grid: rows start at 0, 4, 8, 12
    const row = new ActionRowBuilder<ButtonBuilder>();

    [0, 1, 2, 3].forEach(j => {
      const position = i + j;
      const button = new ButtonBuilder()
        .setCustomId(`ttt_${position}`)
        .setLabel(game.board[position] !== '⬜' ? game.board[position] : '​')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(game.isGameOver || game.board[position] !== '⬜');

      if (game.board[position] === '⬜' && !game.isGameOver) {
        button.setStyle(ButtonStyle.Primary);
      }

      row.addComponents(button);
    });

    rows.push(row);
  });

  return rows;
}

function checkCaptures(board: string[], position: number, playerSymbol: string): number[] {
  const captures: number[] = [];
  const opponentSymbol = playerSymbol === '❌' ? '⭕' : '❌';

  // Check all 8 directions from the newly placed piece
  const directions = [
    [-1, 0], [1, 0], // left, right
    [0, -1], [0, 1], // up, down
    [-1, -1], [1, 1], // diagonal up-left, down-right
    [-1, 1], [1, -1], // diagonal up-right, down-left
  ];

  const row = Math.floor(position / 4);
  const col = position % 4;

  directions.forEach(direction => {
    // Check exactly 2 positions away in this direction
    const pos1Row = row + direction[0];
    const pos1Col = col + direction[1];
    const pos2Row = row + (direction[0] * 2);
    const pos2Col = col + (direction[1] * 2);

    // Make sure both positions are within bounds
    if (pos1Row >= 0 && pos1Row < 4 && pos1Col >= 0 && pos1Col < 4
        && pos2Row >= 0 && pos2Row < 4 && pos2Col >= 0 && pos2Col < 4) {
      const pos1 = pos1Row * 4 + pos1Col;
      const pos2 = pos2Row * 4 + pos2Col;

      // Check if pattern is: Our piece - Opponent piece - Our piece
      if (board[pos1] === opponentSymbol && board[pos2] === playerSymbol) {
        captures.push(pos1);
      }
    }
  });

  return captures;
}

function checkWinner(board: string[], captures: { X: number; O: number }): string | null {
  // Check capture win conditions (X needs 3, O needs 2)
  if (captures.X >= 3) return 'X';
  if (captures.O >= 2) return 'O';

  return null;
}

export const dTicTacToe: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('tictactoe')
    .setDescription('Start a tic-tac-toe game')
    .setContexts([0, 1, 2])
    .setIntegrationTypes([0, 1])
    .addUserOption(option => option
      .setName('opponent')
      .setDescription('The user you want to play against')
      .setRequired(true)) as SlashCommandBuilder,

  async execute(interaction: ChatInputCommandInteraction) {
    const opponent = interaction.options.getUser('opponent', true);

    if (!opponent) {
      await interaction.reply({
        content: 'Please specify a valid opponent!',
        ephemeral: true,
      });
      return false;
    }

    if (opponent.id === interaction.user.id) {
      await interaction.reply({
        content: 'You cannot play against yourself!',
        ephemeral: true,
      });
      return false;
    }

    if (opponent.bot) {
      await interaction.reply({
        content: 'You cannot play against a bot!',
        ephemeral: true,
      });
      return false;
    }

    const game: TicTacToeGame = {
      board: Array(16).fill('⬜'), // 4x4 = 16 squares
      currentPlayer: 'X',
      player1: interaction.user.id,
      player2: opponent.id,
      isGameOver: false,
      winner: null,
      capturedPieces: { X: 0, O: 0 },
    };

    const embed = createGameEmbed(game, interaction.user.username, opponent.username);
    const buttons = createGameButtons(game);

    await interaction.reply({
      embeds: [embed],
      components: buttons,
    });

    const filter = (i: ButtonInteraction): boolean => i.user.id === interaction.user.id || i.user.id === opponent.id;

    const collector = interaction.channel?.createMessageComponentCollector({
      componentType: ComponentType.Button,
      filter,
      time: 300000, // 5 minutes
    });

    if (!collector) {
      await interaction.editReply({
        content: 'Error: Could not create game collector.',
        embeds: [],
        components: [],
      });
      return false;
    }

    collector.on('collect', async (i: ButtonInteraction) => {
      if (game.isGameOver) {
        await i.reply({
          content: 'This game has already ended!',
          ephemeral: true,
        });
        return false;
      }

      const currentPlayerId = game.currentPlayer === 'X' ? game.player1 : game.player2;

      if (i.user.id !== currentPlayerId) {
        await i.reply({
          content: 'It\'s not your turn!',
          ephemeral: true,
        });
        return false;
      }

      const position = parseInt(i.customId.split('_')[1], 10);

      if (game.board[position] !== '⬜') {
        await i.reply({
          content: 'That position is already taken!',
          ephemeral: true,
        });
        return false;
      }

      // Make the move
      const symbol = game.currentPlayer === 'X' ? '❌' : '⭕';
      game.board[position] = symbol;

      // Check for captures
      const captures = checkCaptures(game.board, position, symbol);
      captures.forEach(capturePos => {
        game.board[capturePos] = '⬜';
        game.capturedPieces[game.currentPlayer as 'X' | 'O'] += 1;
      });

      // Check for win conditions
      const winner = checkWinner(game.board, game.capturedPieces);
      if (winner) {
        game.isGameOver = true;
        game.winner = winner;
      } else if (game.board.every(cell => cell !== '⬜')) {
        // Board is full but no winner
        game.isGameOver = true;
        game.winner = 'tie';
      } else {
        // Switch players
        game.currentPlayer = game.currentPlayer === 'X' ? 'O' : 'X';
      }

      const newEmbed = createGameEmbed(game, interaction.user.username, opponent.username);
      const newButtons = createGameButtons(game);

      await i.update({
        embeds: [newEmbed],
        components: newButtons,
      });

      if (game.isGameOver) {
        collector.stop();
      }
      return true;
    });

    collector.on('end', async () => {
      if (!game.isGameOver) {
        const timeoutEmbed = new EmbedBuilder()
          .setTitle('Tic-Tac-Toe - Game Timeout')
          .setDescription('The game has ended due to inactivity.')
          .setColor(0xff0000);

        await interaction.editReply({
          embeds: [timeoutEmbed],
          components: [],
        });
      }
    });
    return true;
  },
};

export default dTicTacToe;
