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
import { TripTacGoGame } from '../../@types/tripTacGoDef';
import { createInitialGame, executeMove } from '../../../global/commands/g.triptacgo';
import { embedTemplate } from '../../utils/embedTemplate';
import { t, getLocale, getCommandLocalizations } from '../../../i18n/index';

const F = f(__filename);

function createGameEmbed(
  game: TripTacGoGame,
  player1Name: string,
  player2Name: string,
  locale: string,
): EmbedBuilder {
  const embed = embedTemplate()
    .setTitle(t(locale, 'triptacgo', 'gameTitle'))
    .setColor(Colors.Green);

  let description = `${t(locale, 'triptacgo', 'gameVsFormat', { player1: player1Name, player2: player2Name })}\n`;
  description += `${t(locale, 'triptacgo', 'capturesFormat', { capturesX: game.capturedPieces.X, capturesO: game.capturedPieces.O })}\n\n`;
  description += `${t(locale, 'triptacgo', 'winConditions')}\n`;
  description += `${t(locale, 'triptacgo', 'captureRule')}\n\n`;

  if (game.isGameOver) {
    if (game.winner === 'tie') {
      description += `\n${t(locale, 'triptacgo', 'tieMessage')}`;
      embed.setColor(Colors.Yellow);
    } else if (game.winner !== 'tie') {
      const winnerName = game.winner === 'X' ? player1Name : player2Name;
      const winnerSymbol = game.winner === 'X' ? '❌' : '⭕';
      description += `\n${t(locale, 'triptacgo', 'winMessage', { winner: winnerName.toUpperCase(), symbol: winnerSymbol })}\n`;
      embed.setColor(Colors.Green);
    }
  } else {
    const currentPlayerName = game.currentPlayer === 'X' ? player1Name : player2Name;
    const currentSymbol = game.currentPlayer === 'X' ? '❌' : '⭕';
    description += `\n${t(locale, 'triptacgo', 'turnIndicator', { playerName: currentPlayerName, symbol: currentSymbol })}`;
  }

  embed.setDescription(description);
  return embed;
}

function createGameButtons(game: TripTacGoGame): ActionRowBuilder<ButtonBuilder>[] {
  const rows: ActionRowBuilder<ButtonBuilder>[] = [];

  [0, 4, 8, 12].forEach(i => { // 4x4 grid: rows start at 0, 4, 8, 12
    const row = new ActionRowBuilder<ButtonBuilder>();

    [0, 1, 2, 3].forEach(j => {
      const position = i + j;
      const button = new ButtonBuilder()
        .setCustomId(`ttg_${game.gameId}_${position}`)
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

export const dTripTacGo: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('triptacgo')
    .setNameLocalizations(getCommandLocalizations('triptacgo', 'commandName'))
    .setDescription('Start a trip-tac-go game')
    .setDescriptionLocalizations(getCommandLocalizations('triptacgo', 'commandDescription'))
    .setContexts([0, 1, 2])
    .setIntegrationTypes([0, 1])
    .addUserOption(option => option
      .setName('opponent')
      .setDescription('The user you want to play against')
      .setRequired(true)) as SlashCommandBuilder,

  async execute(interaction: ChatInputCommandInteraction) {
    const locale = await getLocale(interaction, 'triptacgo');
    const opponent = interaction.options.getUser('opponent', true);

    if (!opponent) {
      await interaction.reply({
        content: t(locale, 'triptacgo', 'invalidOpponent'),
        flags: MessageFlags.Ephemeral,
      });
      return false;
    }

    if (opponent.id === interaction.user.id) {
      await interaction.reply({
        content: t(locale, 'triptacgo', 'cannotPlaySelf'),
        flags: MessageFlags.Ephemeral,
      });
      return false;
    }

    if (opponent.bot) {
      await interaction.reply({
        content: t(locale, 'triptacgo', 'cannotPlayBot'),
        flags: MessageFlags.Ephemeral,
      });
      return false;
    }

    let game = createInitialGame(interaction.user.id, opponent.id);

    const embed = createGameEmbed(game, interaction.user.username, opponent.username, locale);
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
        content: t(locale, 'triptacgo', 'noChannelError'),
        embeds: [],
        components: [],
      });
      return false;
    }

    collector.on('collect', async (i: ButtonInteraction) => {
      const [, gameIdFromButton, positionStr] = i.customId.split('_');
      const position = parseInt(positionStr, 10);
      const moveResult = executeMove(game, position, i.user.id);
      log.info(F, `[${game.gameId}] Move result: ${moveResult}`);

      log.info(F, `[${game.gameId}] Button clicked by ${i.user.username} (${i.user.id})`);
      log.info(F, `[${game.gameId}] CustomId: ${i.customId}`);
      // eslint-disable-next-line max-len
      log.info(F, `[${game.gameId}] Current turn: ${game.currentPlayer}, Player1: ${game.player1}, Player2: ${game.player2}`);
      if (gameIdFromButton !== game.gameId) {
        return false;
      }

      // Update the game reference
      game = JSON.parse(JSON.stringify(moveResult.gameUpdated));
      log.info(F, `[${game.gameId}] AFTER move - Board: ${game.board}`);
      log.info(F, `[${game.gameId}] AFTER move - Current player: ${game.currentPlayer}`);

      // Update Discord UI
      const newEmbed = createGameEmbed(game, interaction.user.username, opponent.username, locale);
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
          .setTitle(t(locale, 'triptacgo', 'timeoutTitle'))
          .setDescription(t(locale, 'triptacgo', 'timeoutDescription'))
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

export default dTripTacGo;
