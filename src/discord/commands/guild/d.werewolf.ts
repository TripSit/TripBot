import {
  ButtonInteraction, InteractionEditReplyOptions, MessageFlags, ModalSubmitInteraction, SlashCommandBuilder,
} from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
import commandContext from '../../utils/context';
import {
  castVote,
  diaryAdd,
  gameCreate,
  gameGet,
  gameGetById,
  gameSetMessageId,
  gameStart,
  playerJoin,
  playerLeave,
  werewolfRequiredPlayers,
} from '../../../global/commands/g.werewolf';
import {
  howEmbed, renderLobby, renderNightPhase, diaryModal, WerewolfModalId,
} from '../../utils/werewolf';

const F = f(__filename);

export async function werewolfJoin(interaction: ButtonInteraction): Promise<InteractionEditReplyOptions> {
  log.debug(F, 'werewolfJoin');
  if (!interaction.guild) return { content: 'This can only be used in a server.' };

  const game = await gameGet(interaction.guild.id);
  if (!game || game.phase !== 'LOBBY') return { content: 'There is no open lobby to join right now.' };

  await playerJoin(game.id, interaction.user.id);
  const updated = await gameGetById(game.id);
  return renderLobby(updated, interaction.guild);
}

export async function werewolfLeave(interaction: ButtonInteraction): Promise<InteractionEditReplyOptions> {
  log.debug(F, 'werewolfLeave');
  if (!interaction.guild) return { content: 'This can only be used in a server.' };

  const game = await gameGet(interaction.guild.id);
  if (!game || game.phase !== 'LOBBY') return { content: 'There is no open lobby to leave right now.' };

  await playerLeave(game.id, interaction.user.id);
  const updated = await gameGetById(game.id);
  return renderLobby(updated, interaction.guild);
}

export async function werewolfHow(interaction: ButtonInteraction): Promise<void> {
  log.debug(F, 'werewolfHow');
  await interaction.reply({ embeds: [howEmbed()], flags: MessageFlags.Ephemeral });
}

export async function werewolfStart(interaction: ButtonInteraction): Promise<void> {
  log.debug(F, 'werewolfStart');
  await interaction.deferUpdate();
  if (!interaction.guild) return;

  const game = await gameGet(interaction.guild.id);
  if (!game || game.phase !== 'LOBBY') return;
  if (game.werewolf_players.length < werewolfRequiredPlayers) return;

  await gameStart(game.id);
  try {
    await renderNightPhase(game.id, interaction.guild);
  } catch (err) {
    log.error(F, `Failed to render the night phase for werewolf game ${game.id}: ${err}`);
    await interaction.followUp({
      content: 'Something went wrong starting the game - check the bot has permission to manage '
        + 'the town and wolf den channels. The game will keep trying to advance on its own, but a '
        + 'moderator may need to fix permissions before it can render correctly.',
      flags: MessageFlags.Ephemeral,
    }).catch(() => null);
  }
}

export async function werewolfKill(interaction: ButtonInteraction): Promise<void> {
  log.debug(F, 'werewolfKill');
  if (!interaction.guild) return;
  const targetId = interaction.customId.split('~')[1];

  const game = await gameGet(interaction.guild.id);
  if (!game || game.phase !== 'NIGHT') {
    await interaction.reply({ content: 'Voting is not currently open.', flags: MessageFlags.Ephemeral });
    return;
  }

  const voter = game.werewolf_players.find(p => p.discord_id === interaction.user.id);
  if (!voter || voter.team !== 'WOLVES' || !voter.is_alive) {
    await interaction.reply({ content: 'Only living wolves can vote to kill.', flags: MessageFlags.Ephemeral });
    return;
  }

  await castVote(game.id, game.day, 'NIGHT', interaction.user.id, targetId);
  await interaction.reply({ content: 'Your vote has been recorded.', flags: MessageFlags.Ephemeral });
}

export async function werewolfHang(interaction: ButtonInteraction): Promise<void> {
  log.debug(F, 'werewolfHang');
  if (!interaction.guild) return;
  const targetId = interaction.customId.split('~')[1];

  const game = await gameGet(interaction.guild.id);
  if (!game || game.phase !== 'AFTERNOON') {
    await interaction.reply({ content: 'Voting is not currently open.', flags: MessageFlags.Ephemeral });
    return;
  }

  const voter = game.werewolf_players.find(p => p.discord_id === interaction.user.id);
  if (!voter || !voter.is_alive) {
    await interaction.reply({ content: 'Only living players can vote.', flags: MessageFlags.Ephemeral });
    return;
  }

  await castVote(game.id, game.day, 'AFTERNOON', interaction.user.id, targetId);
  await interaction.reply({ content: 'Your vote has been recorded.', flags: MessageFlags.Ephemeral });
}

export async function werewolfDiary(interaction: ButtonInteraction): Promise<void> {
  log.debug(F, 'werewolfDiary');
  if (!interaction.guild) return;

  const game = await gameGet(interaction.guild.id);
  if (!game || game.phase !== 'NIGHT') {
    await interaction.reply({ content: 'The diary is only available at night.', flags: MessageFlags.Ephemeral });
    return;
  }

  await interaction.showModal(diaryModal(game.day, interaction.id));

  const filter = (i: ModalSubmitInteraction) => i.customId === `${WerewolfModalId.DIARY}~${interaction.id}`;
  interaction.awaitModalSubmit({ filter, time: 5 * 60 * 1000 })
    .then(async i => {
      try {
        const entry = i.fields.getTextInputValue(WerewolfModalId.DIARY_ENTRY);
        await diaryAdd(game.id, interaction.user.id, game.day, entry);
        await i.reply({
          content: 'You have written in your diary - others will be able to read it if something happens to you.',
          flags: MessageFlags.Ephemeral,
        });
      } catch (err) {
        log.error(F, `Failed to save werewolf diary entry for game ${game.id}: ${err}`);
        await i.reply({
          content: 'Something went wrong saving your diary entry - please try again.',
          flags: MessageFlags.Ephemeral,
        }).catch(() => null);
      }
    })
    .catch(() => null); // benign: the modal was never submitted within the timeout window
}

export const werewolf: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('werewolf')
    .setDescription('Werewolf game!'),
  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    await interaction.deferReply();
    if (!interaction.guild || !interaction.channel) {
      await interaction.editReply({ content: 'This command must be used in a server text channel.' });
      return false;
    }

    let game = await gameGet(interaction.guild.id);
    if (!game) {
      const created = await gameCreate(interaction.guild.id, interaction.channel.id);
      if (!created) {
        await interaction.editReply({ content: 'A game is already in progress in this server!' });
        return false;
      }
      game = await gameGet(interaction.guild.id);
    }

    if (!game || game.phase !== 'LOBBY') {
      await interaction.editReply({ content: 'A game is already in progress!' });
      return false;
    }

    await interaction.editReply(renderLobby(game, interaction.guild));
    const reply = await interaction.fetchReply();
    await gameSetMessageId(game.id, reply.id);
    return true;
  },
};

export default werewolf;
