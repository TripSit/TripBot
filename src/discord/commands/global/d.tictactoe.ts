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
  MessageFlags,
} from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
import { createInitialGame, executeMove } from '../../../global/commands/g.tictactoe';
import { TicTacToeGame } from '../../@types/ticTacToeDef';

// const F = f(__filename);

function createGameEmbed(
  game: TicTacToeGame,
  player1Name: string,
  player2Name: string,
): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle('🎮 Tic-Tac-Toe')
    .setColor(Colors.Green);

  let description = `${player1Name} (❌) vs ${player2Name} (⭕)\n\n`;

  if (game.isGameOver) {
    if (game.winner === 'tie') {
      description += '\n🤝✨ **IT\'S A TIE!** ✨🤝\n';
      embed.setColor(Colors.Yellow);
    } else if (game.winner !== 'tie') {
      const winnerName = game.winner === 'X' ? player1Name : player2Name;
      const winnerSymbol = game.winner === 'X' ? '❌' : '⭕';
      // eslint-disable-next-line max-len
      description += `\n🏆🎉${winnerSymbol} **${winnerName.toUpperCase()} WINS!** ${winnerSymbol}🎉🏆`;
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
        .setCustomId(`ttt_${game.gameId}_${position}`)
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
        flags: MessageFlags.Ephemeral,
      });
      return false;
    }

    if (opponent.id === interaction.user.id) {
      await interaction.reply({
        content: 'You cannot play against yourself!',
        flags: MessageFlags.Ephemeral,
      });
      return false;
    }

    if (opponent.bot) {
      await interaction.reply({
        content: 'You cannot play against a bot!',
        flags: MessageFlags.Ephemeral,
      });
      return false;
    }

    let game = createInitialGame(interaction.user.id, opponent.id);
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
      time: 300000,
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
      const [, gameIdFromButton, positionStr] = i.customId.split('_');
      const position = parseInt(positionStr, 10);
      const moveResult = executeMove(game, position, i.user.id);

      // Verify this button belongs to this game
      if (gameIdFromButton !== game.gameId) {
        return false;
      }

      if (!moveResult.success) {
        await i.reply({
          content: moveResult.errorMessage,
          flags: MessageFlags.Ephemeral,
        });
        return false;
      }

      // Update the game reference
      game = JSON.parse(JSON.stringify(moveResult.gameUpdated));

      // Update Discord UI
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
        collector.removeAllListeners();
        const timeoutEmbed = new EmbedBuilder()
          .setTitle('Tic-Tac-Toe - Game Timeout')
          .setDescription('The game has ended due to inactivity.')
          .setColor(Colors.Red);

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
