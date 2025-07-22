import type { ButtonInteraction, ChatInputCommandInteraction } from 'discord.js';

import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Colors,
  ComponentType,
  EmbedBuilder,
  MessageFlags,
  SlashCommandBuilder,
} from 'discord.js';

import type { SlashCommand } from '../../@types/commandDef';
import type { TicTacToeGame } from '../../@types/ticTacToeDef';

import { createInitialGame, executeMove } from '../../../global/commands/g.tictactoe';

const F = f(__filename);

function createGameButtons(game: TicTacToeGame): ActionRowBuilder<ButtonBuilder>[] {
  const rows: ActionRowBuilder<ButtonBuilder>[] = [];

  for (const index of [0, 3, 6]) {
    const row = new ActionRowBuilder<ButtonBuilder>();

    for (const index_ of [0, 1, 2]) {
      const position = index + index_;
      const button = new ButtonBuilder()
        .setCustomId(`ttt_${game.gameId}_${position}`)
        .setLabel(game.board[position] === '⬜' ? '​' : game.board[position])
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(game.isGameOver || game.board[position] !== '⬜');

      // If the button is empty and game is active, make it primary for better visibility
      if (game.board[position] === '⬜' && !game.isGameOver) {
        button.setStyle(ButtonStyle.Primary);
      }

      row.addComponents(button);
    }

    rows.push(row);
  }

  return rows;
}

function createGameEmbed(
  game: TicTacToeGame,
  player1Name: string,
  player2Name: string,
): EmbedBuilder {
  const embed = new EmbedBuilder().setTitle('🎮 Tic-Tac-Toe').setColor(Colors.Green);

  let description = `${player1Name} (❌) vs ${player2Name} (⭕)\n\n`;

  if (game.isGameOver) {
    if (game.winner === 'tie') {
      description += "\n🤝✨ **IT'S A TIE!** ✨🤝\n";
      embed.setColor(Colors.Yellow);
    } else if (game.winner !== 'tie') {
      const winnerName = game.winner === 'X' ? player1Name : player2Name;
      const winnerSymbol = game.winner === 'X' ? '❌' : '⭕';

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

export const dTicTacToe: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('tictactoe')
    .setDescription('Start a tic-tac-toe game')
    .setContexts([0, 1, 2])
    .setIntegrationTypes([0, 1])
    .addUserOption((option) =>
      option
        .setName('opponent')
        .setDescription('The user you want to play against')
        .setRequired(true),
    ) as SlashCommandBuilder,

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
      components: buttons,
      embeds: [embed],
    });

    const filter = (index: ButtonInteraction): boolean =>
      index.user.id === interaction.user.id || index.user.id === opponent.id;

    const collector = interaction.channel?.createMessageComponentCollector({
      componentType: ComponentType.Button,
      filter,
      time: 300_000,
    });

    if (!collector) {
      await interaction.editReply({
        components: [],
        content: 'Error: Could not create game collector.',
        embeds: [],
      });
      return false;
    }

    collector.on('collect', async (index: ButtonInteraction) => {
      const [, gameIdFromButton, positionString] = index.customId.split('_');
      const position = Number.parseInt(positionString, 10);
      const moveResult = executeMove(game, position, index.user.id);
      log.info(F, `[${game.gameId}] Move result: ${moveResult}`);

      log.info(F, `[${game.gameId}] Button clicked by ${index.user.username} (${index.user.id})`);
      log.info(F, `[${game.gameId}] CustomId: ${index.customId}`);

      log.info(
        F,
        `[${game.gameId}] Current turn: ${game.currentPlayer}, Player1: ${game.player1}, Player2: ${game.player2}`,
      );

      // Verify this button belongs to this game
      if (gameIdFromButton !== game.gameId) {
        return false;
      }

      if (!moveResult.success) {
        await index.reply({
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

      await index.update({
        components: newButtons,
        embeds: [newEmbed],
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
          components: [],
          embeds: [timeoutEmbed],
        });
      }
    });
    return true;
  },
};

export default dTicTacToe;
