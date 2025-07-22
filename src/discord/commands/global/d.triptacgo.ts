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
import type { TripTacGoGame } from '../../@types/tripTacGoDef';

import { createInitialGame, executeMove } from '../../../global/commands/g.triptacgo';
import { embedTemplate } from '../../utils/embedTemplate';

const F = f(__filename);

function createGameButtons(game: TripTacGoGame): ActionRowBuilder<ButtonBuilder>[] {
  const rows: ActionRowBuilder<ButtonBuilder>[] = [];

  for (const index of [0, 4, 8, 12]) {
    // 4x4 grid: rows start at 0, 4, 8, 12
    const row = new ActionRowBuilder<ButtonBuilder>();

    for (const index_ of [0, 1, 2, 3]) {
      const position = index + index_;
      const button = new ButtonBuilder()
        .setCustomId(`ttg_${game.gameId}_${position}`)
        .setLabel(game.board[position] === '⬜' ? '​' : game.board[position])
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(game.isGameOver || game.board[position] !== '⬜');

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
  game: TripTacGoGame,
  player1Name: string,
  player2Name: string,
): EmbedBuilder {
  const embed = embedTemplate().setTitle('🎮 Trip-Tac-Go (4x4)').setColor(Colors.Green);

  let description = `${player1Name} (❌) vs ${player2Name} (⭕)\n`;
  description += `**Captures:** ❌${game.capturedPieces.X} | ⭕${game.capturedPieces.O}\n\n`;
  description += '🎯 **Win by capturing pieces:** ❌ needs 3 | ⭕ needs 2\n';
  description += '💡 **Capture:** Surround opponent on opposite sides\n\n';

  if (game.isGameOver) {
    if (game.winner === 'tie') {
      description += "\n🤝✨ **IT'S A TIE!** ✨🤝";
      embed.setColor(Colors.Yellow);
    } else if (game.winner !== 'tie') {
      const winnerName = game.winner === 'X' ? player1Name : player2Name;
      const winnerSymbol = game.winner === 'X' ? '❌' : '⭕';

      description += `\n🏆🎉${winnerSymbol} **${winnerName.toUpperCase()} WINS!** ${winnerSymbol}🎉🏆\n`;
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

export const dTripTacGo: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('triptacgo')
    .setDescription('Start a trip-tac-go game')
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
      time: 300_000, // 5 minutes
    });

    if (!collector) {
      await interaction.editReply({
        components: [],
        content: 'This command requires the bot to be added to the server to work properly.',
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
      if (gameIdFromButton !== game.gameId) {
        return false;
      }

      // Update the game reference
      game = JSON.parse(JSON.stringify(moveResult.gameUpdated));
      log.info(F, `[${game.gameId}] AFTER move - Board: ${game.board}`);
      log.info(F, `[${game.gameId}] AFTER move - Current player: ${game.currentPlayer}`);

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
          .setTitle('Trip-Tac-Go - Game Timeout')
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

export default dTripTacGo;
