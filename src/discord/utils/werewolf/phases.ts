import {
  ActionRowBuilder, ButtonBuilder, Guild, InteractionEditReplyOptions, TextChannel,
} from 'discord.js';
import {
  gameAdvancePhase,
  gameEnd,
  gameGetById,
  gameSetWolfMessageId,
  diaryGet,
  resolveDayHang,
  resolveNightKill,
  checkWinCondition,
  werewolfRequiredPlayers,
} from '../../../global/commands/g.werewolf';
import { WerewolfGameWithPlayers } from '../../../global/utils/werewolf/types';
import { WerewolfButton } from './buttons';
import {
  afternoonEmbed,
  endEmbed,
  eveningEmbed,
  lobbyEmbed,
  morningEmbed,
  nightTownEmbed,
  nightWolfEmbed,
} from './embeds';
import {
  muteTown, restrictWolfden, resetWerewolfChannels, unmuteTown,
} from './permissions';

const F = f(__filename);

// The town channel is wherever /werewolf was actually invoked (game.channel_id), not a fixed env
// constant - a guild could plausibly run the game in more than one channel over time.
async function getTownChannel(guild: Guild, game: WerewolfGameWithPlayers): Promise<TextChannel | null> {
  return await guild.channels.fetch(game.channel_id).catch(() => null) as TextChannel | null;
}

// The wolf den is a fixed, hidden channel per environment, captured on the game row at creation time.
async function getWolfdenChannel(guild: Guild, game: WerewolfGameWithPlayers): Promise<TextChannel | null> {
  if (!game.wolfden_channel_id) {
    log.warn(F, `Werewolf game ${game.id} has no wolfden_channel_id configured - skipping wolf den update.`);
    return null;
  }
  return await guild.channels.fetch(game.wolfden_channel_id).catch(() => null) as TextChannel | null;
}

async function editGameMessage(
  guild: Guild,
  game: WerewolfGameWithPlayers,
  payload: InteractionEditReplyOptions,
): Promise<void> {
  if (!game.message_id) return;
  const townChannel = await getTownChannel(guild, game);
  if (!townChannel) return;
  const message = await townChannel.messages.fetch(game.message_id).catch(() => null);
  if (!message) return;
  await message.edit(payload);
}

export function renderLobby(game: WerewolfGameWithPlayers, guild: Guild): InteractionEditReplyOptions {
  const buttons = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(WerewolfButton.join, WerewolfButton.leave, WerewolfButton.how);

  if (game.werewolf_players.length >= werewolfRequiredPlayers) {
    buttons.addComponents(WerewolfButton.start);
  }

  return {
    embeds: [lobbyEmbed(game, guild, werewolfRequiredPlayers)],
    components: [buttons],
  };
}

// Renders the night phase: mutes #town, restricts #wolves to living wolves, posts the kill-vote message.
// Assumes the game's phase/phase_end_time have already been set to NIGHT by the caller.
export async function renderNightPhase(gameId: string, guild: Guild): Promise<void> {
  const game = await gameGetById(gameId);

  await muteTown(guild, game.channel_id);

  const wolves = game.werewolf_players.filter(p => p.team === 'WOLVES');
  const aliveWolves = wolves.filter(p => p.is_alive);
  await restrictWolfden(guild, game.wolfden_channel_id, wolves);

  await editGameMessage(guild, game, {
    embeds: [nightTownEmbed(game)],
    components: [new ActionRowBuilder<ButtonBuilder>().addComponents(WerewolfButton.diary)],
  });

  const aliveTownsfolk = game.werewolf_players.filter(p => p.team !== 'WOLVES' && p.is_alive);
  const wolfButtons = new ActionRowBuilder<ButtonBuilder>();
  aliveTownsfolk.forEach(player => {
    const member = guild.members.cache.get(player.discord_id);
    wolfButtons.addComponents(WerewolfButton.kill(player.discord_id, member?.displayName ?? player.discord_id));
  });

  const wolfdenChannel = await getWolfdenChannel(guild, game);
  if (!wolfdenChannel) return;

  const wolfMentions = aliveWolves.map(p => `<@${p.discord_id}>`).join(' ');
  const wolfMessage = await wolfdenChannel.send({
    content: wolfMentions,
    embeds: [nightWolfEmbed(game)],
    components: aliveTownsfolk.length > 0 ? [wolfButtons] : [],
  });
  await gameSetWolfMessageId(gameId, wolfMessage.id);
}

async function advanceToEnd(
  game: WerewolfGameWithPlayers,
  guild: Guild,
  winningTeam: 'TOWN' | 'WOLVES',
): Promise<void> {
  await editGameMessage(guild, game, {
    embeds: [endEmbed(guild, winningTeam, game.werewolf_players)],
    components: [],
  });

  await resetWerewolfChannels(
    guild,
    game.channel_id,
    game.wolfden_channel_id,
    game.werewolf_players.map(p => p.discord_id),
  );
  await gameEnd(game.id);
}

async function advanceToMorning(game: WerewolfGameWithPlayers, guild: Guild): Promise<void> {
  const victimId = await resolveNightKill(game.id, game.day);
  const victimDiary = victimId ? await diaryGet(game.id, victimId, game.day) : [];
  const winningTeam = await checkWinCondition(game.id);

  await gameAdvancePhase(game.id, 'MORNING', { winningTeam: winningTeam ?? undefined });
  const updatedGame = await gameGetById(game.id);

  const deadIds = updatedGame.werewolf_players.filter(p => !p.is_alive).map(p => p.discord_id);
  await unmuteTown(guild, updatedGame.channel_id, deadIds);

  await editGameMessage(guild, updatedGame, {
    embeds: [morningEmbed(updatedGame, guild, victimId, victimDiary)],
    components: [new ActionRowBuilder<ButtonBuilder>().addComponents(WerewolfButton.diary)],
  });

  if (updatedGame.wolf_message_id) {
    const wolfdenChannel = await getWolfdenChannel(guild, updatedGame);
    const wolfMessage = await wolfdenChannel?.messages.fetch(updatedGame.wolf_message_id).catch(() => null);
    await wolfMessage?.edit({ content: '', components: [] });
  }
}

async function advanceToAfternoon(game: WerewolfGameWithPlayers, guild: Guild): Promise<void> {
  // The night kill may have already decided the game (e.g. the last townsfolk was killed) - skip
  // straight to the end screen instead of opening a pointless hang vote with no one left to matter.
  if (game.winning_team) {
    await advanceToEnd(game, guild, game.winning_team);
    return;
  }

  await gameAdvancePhase(game.id, 'AFTERNOON');
  const updatedGame = await gameGetById(game.id);

  const alivePlayers = updatedGame.werewolf_players.filter(p => p.is_alive);
  const hangButtons = new ActionRowBuilder<ButtonBuilder>();
  alivePlayers.forEach(player => {
    const member = guild.members.cache.get(player.discord_id);
    hangButtons.addComponents(WerewolfButton.hang(player.discord_id, member?.displayName ?? player.discord_id));
  });

  await editGameMessage(guild, updatedGame, {
    embeds: [afternoonEmbed(updatedGame)],
    components: alivePlayers.length > 0 ? [hangButtons] : [],
  });
}

async function advanceToEvening(game: WerewolfGameWithPlayers, guild: Guild): Promise<void> {
  const suspectId = await resolveDayHang(game.id, game.day);
  const suspectDiary = suspectId ? await diaryGet(game.id, suspectId, game.day) : [];
  const winningTeam = await checkWinCondition(game.id);

  await gameAdvancePhase(game.id, 'EVENING', { winningTeam: winningTeam ?? undefined });
  const updatedGame = await gameGetById(game.id);

  const suspectPlayer = suspectId ? updatedGame.werewolf_players.find(p => p.discord_id === suspectId) ?? null : null;

  await editGameMessage(guild, updatedGame, {
    embeds: [eveningEmbed(updatedGame, guild, suspectId, suspectPlayer?.role ?? null, suspectDiary)],
    components: [],
  });
}

async function advanceFromEvening(game: WerewolfGameWithPlayers, guild: Guild): Promise<void> {
  if (game.winning_team) {
    await advanceToEnd(game, guild, game.winning_team);
    return;
  }

  await gameAdvancePhase(game.id, 'NIGHT', { incrementDay: true });
  await renderNightPhase(game.id, guild);
}

// Single dispatcher the timer poller uses to advance a game whose phase_end_time has passed.
export async function werewolfAdvancePhase(game: WerewolfGameWithPlayers, guild: Guild): Promise<void> {
  log.debug(F, `Advancing werewolf game ${game.id} (guild ${game.guild_id}) out of ${game.phase}`);

  switch (game.phase) {
    case 'NIGHT':
      await advanceToMorning(game, guild);
      break;
    case 'MORNING':
      await advanceToAfternoon(game, guild);
      break;
    case 'AFTERNOON':
      await advanceToEvening(game, guild);
      break;
    case 'EVENING':
      await advanceFromEvening(game, guild);
      break;
    default:
      break;
  }
}
