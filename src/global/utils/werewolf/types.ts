import { werewolf_games, werewolf_players } from '@db/tripbot';

export { werewolf_phase, werewolf_team, werewolf_role } from '@db/tripbot';

export type WerewolfGameWithPlayers = werewolf_games & {
  werewolf_players: werewolf_players[];
};
