import {
  ButtonInteraction, InteractionEditReplyOptions, MessageFlags, ModalSubmitInteraction,
  SlashCommandBuilder, StringSelectMenuInteraction,
} from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
import commandContext from '../../utils/context';
import {
  castVote,
  checkWinCondition,
  diaryAdd,
  gameCreate,
  gameGet,
  gameGetById,
  gameSetMessageId,
  gameStart,
  playerJoin,
  playerLeave,
  protectTarget,
  resolveHunterRevenge,
  seerPeek,
  werewolfRequiredPlayers,
} from '../../../global/commands/g.werewolf';
import {
  advanceToEnd,
  diaryModal,
  howEmbed,
  isWolfdenVisibleToEveryone,
  peekSelectMenu,
  protectSelectMenu,
  renderLobby,
  renderNightPhase,
  WerewolfModalId,
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

export async function werewolfPeek(interaction: ButtonInteraction): Promise<void> {
  log.debug(F, 'werewolfPeek');
  if (!interaction.guild) return;
  const { guild } = interaction;

  const game = await gameGet(guild.id);
  if (!game || game.phase !== 'NIGHT') {
    await interaction.reply({ content: 'Peeking is only available at night.', flags: MessageFlags.Ephemeral });
    return;
  }

  const seer = game.werewolf_players.find(p => p.discord_id === interaction.user.id);
  if (!seer || seer.role !== 'SEER' || !seer.is_alive) {
    await interaction.reply({ content: 'Only the living Seer can do that.', flags: MessageFlags.Ephemeral });
    return;
  }

  const targets = game.werewolf_players
    .filter(p => p.is_alive && p.discord_id !== interaction.user.id)
    .map(p => ({ discordId: p.discord_id, label: guild.members.cache.get(p.discord_id)?.displayName ?? p.discord_id }));

  if (targets.length === 0) {
    await interaction.reply({ content: 'There is no one left to peek at.', flags: MessageFlags.Ephemeral });
    return;
  }

  await interaction.reply({
    content: 'Who would you like to peek at?',
    components: [peekSelectMenu(interaction.user.id, targets)],
    flags: MessageFlags.Ephemeral,
  });
}

export async function werewolfPeekSelect(interaction: StringSelectMenuInteraction): Promise<void> {
  log.debug(F, 'werewolfPeekSelect');
  if (!interaction.guild) return;

  const game = await gameGet(interaction.guild.id);
  if (!game || game.phase !== 'NIGHT') {
    await interaction.update({ content: 'Peeking is no longer available.', components: [] });
    return;
  }

  const targetId = interaction.values[0];
  const team = await seerPeek(game.id, game.day, interaction.user.id, targetId);
  const targetName = interaction.guild.members.cache.get(targetId)?.displayName ?? targetId;

  await interaction.update({
    content: `🔮 ${targetName} is on the **${team === 'WOLVES' ? 'Wolves' : 'Town'}** team.`,
    components: [],
  });
}

export async function werewolfProtect(interaction: ButtonInteraction): Promise<void> {
  log.debug(F, 'werewolfProtect');
  if (!interaction.guild) return;
  const { guild } = interaction;

  const game = await gameGet(guild.id);
  if (!game || game.phase !== 'NIGHT') {
    await interaction.reply({ content: 'Protecting is only available at night.', flags: MessageFlags.Ephemeral });
    return;
  }

  const doctor = game.werewolf_players.find(p => p.discord_id === interaction.user.id);
  if (!doctor || doctor.role !== 'DOCTOR' || !doctor.is_alive) {
    await interaction.reply({ content: 'Only the living Doctor can do that.', flags: MessageFlags.Ephemeral });
    return;
  }

  const targets = game.werewolf_players
    .filter(p => p.is_alive)
    .map(p => ({ discordId: p.discord_id, label: guild.members.cache.get(p.discord_id)?.displayName ?? p.discord_id }));

  await interaction.reply({
    content: 'Who would you like to protect tonight?',
    components: [protectSelectMenu(interaction.user.id, targets)],
    flags: MessageFlags.Ephemeral,
  });
}

export async function werewolfProtectSelect(interaction: StringSelectMenuInteraction): Promise<void> {
  log.debug(F, 'werewolfProtectSelect');
  if (!interaction.guild) return;

  const game = await gameGet(interaction.guild.id);
  if (!game || game.phase !== 'NIGHT') {
    await interaction.update({ content: 'Protecting is no longer available.', components: [] });
    return;
  }

  const targetId = interaction.values[0];
  await protectTarget(game.id, game.day, interaction.user.id, targetId);
  const targetName = interaction.guild.members.cache.get(targetId)?.displayName ?? targetId;

  await interaction.update({
    content: `💉 You will protect ${targetName} tonight.`,
    components: [],
  });
}

export async function werewolfRevenge(interaction: ButtonInteraction): Promise<void> {
  log.debug(F, 'werewolfRevenge');
  if (!interaction.guild) return;
  const { guild } = interaction;
  const [, hunterDiscordId, targetId] = interaction.customId.split('~');

  if (interaction.user.id !== hunterDiscordId) {
    await interaction.reply({ content: 'Only the Hunter who died can use this.', flags: MessageFlags.Ephemeral });
    return;
  }

  const game = await gameGet(guild.id);
  if (!game) {
    await interaction.reply({ content: 'This game has already ended.', flags: MessageFlags.Ephemeral });
    return;
  }

  await interaction.deferUpdate();

  const resolved = await resolveHunterRevenge(game.id, game.day, hunterDiscordId, targetId);
  if (!resolved) {
    await interaction.followUp({
      content: "That revenge kill couldn't be resolved - it may already have been used.",
      flags: MessageFlags.Ephemeral,
    }).catch(() => null);
    return;
  }

  const targetName = guild.members.cache.get(targetId)?.displayName ?? targetId;
  await interaction.editReply({
    content: `🏹 With their dying breath, the Hunter took ${targetName} down with them!`,
    embeds: [],
    components: [],
  });

  const winningTeam = await checkWinCondition(game.id);
  if (winningTeam) {
    const updatedGame = await gameGetById(game.id);
    await advanceToEnd(updatedGame, guild, winningTeam);
  }
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

    const wolfdenExposed = await isWolfdenVisibleToEveryone(interaction.guild, game.wolfden_channel_id);
    if (wolfdenExposed) {
      await interaction.followUp({
        content: '⚠️ The wolf den channel currently appears visible to @everyone - non-wolves may be '
          + 'able to see it. Check the bot\'s permission overwrites on that channel. (Note: this check '
          + "can't detect the server owner or Administrator-permission members, who can always see "
          + 'every channel regardless of overwrites.)',
        flags: MessageFlags.Ephemeral,
      }).catch(() => null);
    }

    return true;
  },
};

export default werewolf;
