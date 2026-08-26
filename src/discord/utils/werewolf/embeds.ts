import {
  Colors, EmbedBuilder, Guild, time,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import { werewolf_team } from '@db/tripbot';
import { WerewolfGameWithPlayers } from '../../../global/utils/werewolf/types';

function displayName(guild: Guild, discordId: string): string {
  return guild.members.cache.get(discordId)?.displayName ?? discordId;
}

function sortedNames(guild: Guild, discordIds: string[]): string[] {
  return discordIds
    .map(id => displayName(guild, id))
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
}

export function lobbyEmbed(game: WerewolfGameWithPlayers, guild: Guild, requiredPlayers: number): EmbedBuilder {
  const players = game.werewolf_players;
  const names = sortedNames(guild, players.map(p => p.discord_id));
  const playersList = names.length > 0 ? `:\n* ${names.join('\n* ')}` : '.';

  const status = players.length >= requiredPlayers
    ? 'You can start the game now!'
    : `You need at least ${requiredPlayers} players to start the game.`;

  return new EmbedBuilder()
    .setTitle('Werewolf Lobby')
    .setColor(Colors.Blurple)
    .setDescription(stripIndents`
      Welcome to the werewolf game lobby.

      There are currently ${players.length} players in the game${playersList}

      ${status}
    `);
}

export function howEmbed(): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle('Werewolf')
    .setColor(Colors.Blurple)
    .setDescription(stripIndents`
      The werewolf game is a game of deception and deduction.
      The goal of the game is for the town to kill all the wolves, and for the wolves to kill all the town.
      The game is played in rounds, and each round has a night phase and a day phase.

      During the night phase, the wolves decide who to kill.
      During the day phase, the town discusses and then votes on who to hang.

      The game ends when either all the wolves are dead, or all the town is dead.
    `);
}

export function nightTownEmbed(game: WerewolfGameWithPlayers): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle('It is now nighttime.')
    .setColor(Colors.Blurple)
    .setDescription(stripIndents`
      The town is now sleeping peacefully.

      You can write in your diary, but otherwise you cannot talk.

      Morning will come ${time(game.phase_end_time as Date, 'R')}.
    `);
}

export function nightWolfEmbed(game: WerewolfGameWithPlayers): EmbedBuilder {
  const wolves = game.werewolf_players.filter(p => p.team === 'WOLVES' && p.is_alive);
  const wolfPack = wolves.length > 1 ? 'wolves' : 'wolf';

  return new EmbedBuilder()
    .setTitle('Wolf Den')
    .setColor(Colors.Blurple)
    .setDescription(stripIndents`
      You are the ${wolfPack}.
      You can talk in this channel with other wolves.
      Use the buttons below to decide who to kill.
      Only the player with the most votes will be killed.
      If there is a tie, or there are no votes, no one is killed.

      Morning will come ${time(game.phase_end_time as Date, 'R')}.
    `);
}

export function morningEmbed(
  game: WerewolfGameWithPlayers,
  guild: Guild,
  victimDiscordId: string | null,
  victimDiary: string[],
): EmbedBuilder {
  const victimLine = victimDiscordId
    ? `The town awakens to find that ${displayName(guild, victimDiscordId)} was killed in the night.`
    : 'The town awakens to find that no one was killed in the night.';

  const diaryLine = victimDiscordId && victimDiary.length > 0
    ? stripIndents`

      Their diary contained:
      * ${victimDiary.join('\n* ')}
    `
    : '';

  return new EmbedBuilder()
    .setTitle('Morning')
    .setColor(Colors.Blurple)
    .setDescription(stripIndents`
      ${victimLine}
      ${diaryLine}

      Discuss among the town who you think the wolf is.

      Voting opens ${time(game.phase_end_time as Date, 'R')}.
    `);
}

export function afternoonEmbed(game: WerewolfGameWithPlayers): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle('Afternoon')
    .setColor(Colors.Blurple)
    .setDescription(stripIndents`
      The sun is high - it's time to vote.

      Use the buttons below to vote on who to hang.

      Voting will end ${time(game.phase_end_time as Date, 'R')}.

      If there is no agreement, the player with the most votes will be hung.
      If there is a tie, or there are no votes, no one will be hung.
    `);
}

export function eveningEmbed(
  game: WerewolfGameWithPlayers,
  guild: Guild,
  suspectDiscordId: string | null,
  suspectRole: 'WOLF' | 'VILLAGER' | 'SEER' | 'HUNTER' | null,
  suspectDiary: string[],
): EmbedBuilder {
  const suspectLine = suspectDiscordId
    ? stripIndents`
      The town solemnly takes ${displayName(guild, suspectDiscordId)} to the gallows.

      ${suspectRole === 'WOLF' ? 'They were a wolf!' : 'They were not a wolf.'}
    `
    : 'No agreement was reached - no one is hung today.';

  const diaryLine = suspectDiscordId && suspectDiary.length > 0
    ? stripIndents`

      Their diary contained:
      * ${suspectDiary.join('\n* ')}
    `
    : '';

  return new EmbedBuilder()
    .setTitle('Evening')
    .setColor(Colors.Blurple)
    .setDescription(stripIndents`
      ${suspectLine}
      ${diaryLine}

      Night will come ${time(game.phase_end_time as Date, 'R')}.
    `);
}

export function endEmbed(
  guild: Guild,
  winningTeam: werewolf_team,
  players: WerewolfGameWithPlayers['werewolf_players'],
): EmbedBuilder {
  const winners = sortedNames(guild, players.filter(p => p.team === winningTeam).map(p => p.discord_id));

  return new EmbedBuilder()
    .setTitle('Werewolf - Game Over')
    .setColor(Colors.Blurple)
    .setDescription(stripIndents`
      The game has ended! ${winningTeam === 'WOLVES' ? 'The wolves win!' : 'The town wins!'}

      Winning team:
      * ${winners.join('\n* ')}

      Run \`/werewolf\` again to start a new game.
    `);
}
