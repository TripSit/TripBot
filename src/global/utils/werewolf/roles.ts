import { werewolf_role, werewolf_team } from '@db/tripbot';

export type WerewolfRoleDef = {
  role: werewolf_role;
  team: werewolf_team;
  label: string;
  description: string;
  // Gate against total player count - this role isn't assigned below this many players.
  minPlayers: number;
  // How many players should get this role for a given total player count.
  count: (playerCount: number) => number;
  // Reserved for a future pass (Seer peek / Hunter revenge). Not consumed by any code yet.
  nightAction?: {
    priority: number;
    label: string;
  };
};

/**
 * Adding a new role is a single entry here - assignRoles() in g.werewolf.ts never needs to change.
 * VILLAGER is the fallback role: every player not claimed by an earlier entry becomes a Villager.
 */
export const werewolfRoleRegistry: WerewolfRoleDef[] = [
  {
    role: 'WOLF',
    team: 'WOLVES',
    label: 'Wolf',
    description: 'Each night, vote with the other wolves to kill a villager.',
    // Lowered outside production so a single dev (with one alt account) can reach a testable
    // 1-wolf/1-villager game instead of needing 4 real players. This also gates werewolfRequiredPlayers
    // in g.werewolf.ts, since it's derived from this value.
    minPlayers: env.NODE_ENV === 'production' ? 4 : 2,
    count: playerCount => (playerCount > 6 ? 2 : 1),
  },
  {
    role: 'SEER',
    team: 'TOWN',
    label: 'Seer',
    description: 'Each night, peek at one player to learn if they are a wolf.',
    minPlayers: 6,
    count: playerCount => (playerCount >= 6 ? 1 : 0),
    nightAction: { priority: 10, label: 'Peek' },
  },
  {
    role: 'DOCTOR',
    team: 'TOWN',
    label: 'Doctor',
    description: 'Each night, protect one player from the wolves\' kill.',
    minPlayers: 7,
    count: playerCount => (playerCount >= 7 ? 1 : 0),
    nightAction: { priority: 5, label: 'Protect' },
  },
  {
    role: 'HUNTER',
    team: 'TOWN',
    label: 'Hunter',
    description: 'If you are killed or hung, immediately take one other player with you.',
    minPlayers: 8,
    count: playerCount => (playerCount >= 8 ? 1 : 0),
    nightAction: { priority: 20, label: 'Revenge' },
  },
  {
    role: 'VILLAGER',
    team: 'TOWN',
    label: 'Villager',
    description: 'Vote during the day to hang whoever you think is a wolf.',
    minPlayers: 0,
    count: () => 0, // fallback role - assignRoles() fills remaining players with this, count() unused
  },
];

export const werewolfRoleDef = (role: werewolf_role): WerewolfRoleDef => {
  const def = werewolfRoleRegistry.find(entry => entry.role === role);
  if (!def) throw new Error(`Unknown werewolf role: ${role}`);
  return def;
};

export default werewolfRoleRegistry;
