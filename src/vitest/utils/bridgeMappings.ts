import type { MappingRow } from '../../global/bridge/bridge.channels';

export const LOUNGE_ID = 'discord-lounge';
export const MOVIES_ID = 'discord-movies';

export function mappingRow(overrides: Partial<MappingRow> = {}): MappingRow {
  return {
    discord_channel_id: LOUNGE_ID,
    irc_channel: '#lounge',
    gateway_name: 'Lounge',
    matrix_room_id: null,
    topic: null,
    source: 'override',
    active: true,
    enabled: true,
    irc_registered: true,
    ...overrides,
  };
}

/** A small stand-in for the table: Movies and TV-Movies share a Discord channel. */
export const bridgeRows = (): MappingRow[] => [
  mappingRow({ matrix_room_id: '!lounge:tripsit.me' }),
  mappingRow({ discord_channel_id: MOVIES_ID, irc_channel: '#movies', gateway_name: 'Movies' }),
  mappingRow({
    discord_channel_id: MOVIES_ID,
    irc_channel: '#tv-movies',
    gateway_name: 'TV-Movies',
    matrix_room_id: '!gQijCMLYtqXWKYNyXs:tripsit.me',
  }),
  mappingRow({ discord_channel_id: 'discord-sandbox', irc_channel: '###dev-sandbox', gateway_name: 'Sandbox' }),
];
