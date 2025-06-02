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
}

function createGameEmbed(
  game: TicTacToeGame,
  player1Name: string,
  player2Name: string,
): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle('🎮 Tic-Tac-Toe')
    .setColor(0x0099ff);

  let description = `${player1Name} (❌) vs ${player2Name} (⭕)\n\n`;

  if (game.isGameOver) {
    if (game.winner === 'tie') {
      description += '\n🤝✨ **IT\'S A TIE!** ✨🤝\n';
      embed.setColor(Colors.Yellow);
    } else if (game.winner !== 'tie') {
      const winnerName = game.winner === 'X' ? player1Name : player2Name;
      const winnerSymbol = game.winner === 'X' ? '❌' : '⭕';
      // eslint-disable-next-line max-len
      description += `\n🏆🎉 **${winnerName.toUpperCase()} WINS!** 🎉🏆\n🌟 ${winnerSymbol} CHAMPION ${winnerSymbol} 🌟`;
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

  [0, 3, 6].forEach(i => {
    const row = new ActionRowBuilder<ButtonBuilder>();

    [0, 1, 2].forEach(j => {
      const position = i + j;
      const button = new ButtonBuilder()
        .setCustomId(`ttt_${position}`)
        .setLabel(game.board[position] !== '⬜' ? game.board[position] : '​')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(game.isGameOver || game.board[position] !== '⬜');

      // If the button is empty and game is active, make it primary for better visibility
      if (game.board[position] === '⬜' && !game.isGameOver) {
        button.setStyle(ButtonStyle.Primary);
      }

      row.addComponents(button);
    });

    rows.push(row);
  });

  return rows;
}

function checkWinner(board: string[]): string | null {
  const winPatterns = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6], // Diagonals
  ];

  const winningPattern = winPatterns.find(pattern => {
    const [a, b, c] = pattern;
    return board[a] !== '⬜' && board[a] === board[b] && board[b] === board[c];
  });

  if (winningPattern) {
    const [a] = winningPattern;
    return board[a] === '❌' ? 'X' : 'O';
  }

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
      board: Array(9).fill('⬜'),
      currentPlayer: 'X',
      player1: interaction.user.id,
      player2: opponent.id,
      isGameOver: false,
      winner: null,
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
      game.board[position] = game.currentPlayer === 'X' ? '❌' : '⭕';

      // Check for win or tie
      const winner = checkWinner(game.board);
      if (winner) {
        game.isGameOver = true;
        game.winner = winner;
      } else if (game.board.every(cell => cell !== '⬜')) {
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
