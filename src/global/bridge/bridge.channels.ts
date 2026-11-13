/**
 * Pure rules for which Discord channels are bridged to IRC and what the IRC channels are called.
 * Nothing here touches Discord, IRC or the database, so it can be tested directly.
 */
import { BridgeGatewaySeed } from './bridge.gateways';

/** Ergo's default `limits.channellen`; the IRC connection reports the real limit via ISUPPORT. */
export const DEFAULT_IRC_CHANNEL_LENGTH = 64;

export type MappingSource = 'override' | 'auto';

/** A row of the bridge_channels table. */
export interface MappingRow {
  discord_channel_id: string;
  irc_channel: string;
  gateway_name: string;
  matrix_room_id: string | null;
  topic: string | null;
  source: string;
  active: boolean;
  enabled: boolean;
  irc_registered: boolean;
}

export type NewMappingRow = Pick<
MappingRow,
'discord_channel_id' | 'irc_channel' | 'gateway_name' | 'matrix_room_id' | 'topic' | 'irc_registered'
> & { source: MappingSource };

/** A Discord text or announcement channel, reduced to what the rules need. */
export interface CandidateChannel {
  id: string;
  name: string;
  topic: string | null;
  parentId: string | null;
  /** The @everyone role cannot view the channel after applying channel overwrites. */
  isPrivate: boolean;
}

/** Category ID -> prefix of the IRC names derived for its channels. */
export type BridgeCategories = Record<string, string>;

export type Eligibility = 'ok' | 'category' | 'private';

const SEPARATOR = '│';

/**
 * `🍕│Food-Chat` -> `#food-chat`. Returns undefined when nothing usable is left.
 * The name is cut to fit `maxLength` (prefix included) so a long Discord name cannot overflow Ergo's limit.
 */
export function deriveIrcName(
  discordName: string,
  prefix: string,
  maxLength = DEFAULT_IRC_CHANNEL_LENGTH,
): string | undefined {
  const afterSeparator = discordName.includes(SEPARATOR)
    ? discordName.slice(discordName.indexOf(SEPARATOR) + 1)
    : discordName;
  const cleaned = afterSeparator
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '')
    .replace(/-{2,}/g, '-');
  const room = Math.max(maxLength - prefix.length, 0);
  const core = cleaned.slice(0, room).replace(/^[-_]+|[-_]+$/g, '');
  return core.length > 0 ? `${prefix}${core}` : undefined;
}

/** Whether a channel qualifies for automatic bridging. Private channels never do. */
export function classifyChannel(channel: CandidateChannel, categories: BridgeCategories): Eligibility {
  if (!channel.parentId || !(channel.parentId in categories)) return 'category';
  return channel.isPrivate ? 'private' : 'ok';
}

export interface SyncPlan {
  create: NewMappingRow[];
  activate: MappingRow[];
  deactivate: MappingRow[];
  /** Rows whose stored topic differs from the Discord channel's current (non-empty) topic. */
  topics: { irc_channel: string; topic: string }[];
  stats: { bridged: number; skippedPrivate: number; skippedCategory: number; collisions: number; unnamed: number };
  /** One line per change or skipped candidate worth logging. */
  messages: string[];
}

export interface SyncInput {
  rows: MappingRow[];
  channels: CandidateChannel[];
  categories: BridgeCategories;
  maxLength?: number;
}

// Snowflakes sort numerically; compare by length first so the oldest channel wins a name collision
const bySnowflake = (a: CandidateChannel, b: CandidateChannel) => (
  a.id.length - b.id.length || (a.id < b.id ? -1 : Number(a.id > b.id))
);

/** Works out what the mapping table should look like for the guild's current text channels. */
export function planSync({
  rows, channels, categories, maxLength = DEFAULT_IRC_CHANNEL_LENGTH,
}: SyncInput): SyncPlan {
  const byId = new Map(channels.map(channel => [channel.id, channel]));
  const plan: SyncPlan = {
    create: [],
    activate: [],
    deactivate: [],
    topics: [],
    stats: {
      bridged: 0, skippedPrivate: 0, skippedCategory: 0, collisions: 0, unnamed: 0,
    },
    messages: [],
  };

  const shouldBeActive = (row: MappingRow): { active: boolean; reason: string } => {
    if (!row.enabled) return { active: false, reason: 'disabled' };
    const channel = byId.get(row.discord_channel_id);
    if (!channel) return { active: false, reason: 'channel is gone' };
    if (row.source === 'override') return { active: true, reason: 'override' };
    const eligibility = classifyChannel(channel, categories);
    return { active: eligibility === 'ok', reason: eligibility === 'ok' ? 'eligible' : `now ${eligibility}` };
  };

  rows.forEach(row => {
    const { active, reason } = shouldBeActive(row);
    const discordTopic = byId.get(row.discord_channel_id)?.topic;
    if (active && discordTopic && discordTopic !== row.topic) plan.topics.push({ irc_channel: row.irc_channel, topic: discordTopic });
    if (active === row.active) return;
    if (active) {
      plan.activate.push(row);
      plan.messages.push(`Bridging ${row.irc_channel} to Discord channel ${row.discord_channel_id} again`);
    } else {
      plan.deactivate.push(row);
      plan.messages.push(`Unbridging ${row.irc_channel} (Discord channel ${row.discord_channel_id}: ${reason})`);
    }
  });

  const taken = new Set(rows.map(row => row.irc_channel.toLowerCase()));
  const known = new Set(rows.map(row => row.discord_channel_id));

  [...channels].sort(bySnowflake).forEach(channel => {
    if (known.has(channel.id)) return; // Existing rows keep their IRC name whatever the channel is renamed to
    const eligibility = classifyChannel(channel, categories);
    if (eligibility === 'category') {
      plan.stats.skippedCategory += 1;
      return;
    }
    if (eligibility === 'private') {
      plan.stats.skippedPrivate += 1;
      return;
    }
    const prefix = categories[channel.parentId as string];
    const ircChannel = deriveIrcName(channel.name, prefix, maxLength);
    if (!ircChannel) {
      plan.stats.unnamed += 1;
      plan.messages.push(`Skipping Discord channel ${channel.id} (${channel.name}): no usable IRC name`);
      return;
    }
    if (taken.has(ircChannel)) {
      plan.stats.collisions += 1;
      plan.messages.push(`Skipping Discord channel ${channel.id} (${channel.name}): ${ircChannel} is already mapped`);
      return;
    }
    taken.add(ircChannel);
    plan.create.push({
      discord_channel_id: channel.id,
      irc_channel: ircChannel,
      gateway_name: ircChannel.replace(/^#+(dev-)?/, ''),
      matrix_room_id: null,
      topic: channel.topic,
      irc_registered: false,
      source: 'auto',
    });
    plan.messages.push(`Bridging new Discord channel ${channel.id} (${channel.name}) as ${ircChannel}`);
  });

  plan.stats.bridged = rows.filter(row => shouldBeActive(row).active).length + plan.create.length;
  return plan;
}

export interface SeedPlan {
  create: NewMappingRow[];
  /** Existing rows that gain a Matrix room from the seed. */
  matrix: { irc_channel: string; matrix_room_id: string }[];
  messages: string[];
}

/**
 * Merges the hand-written gateways into the table. Seeds only add: an IRC name that is already mapped keeps its
 * row (so edits made in the database survive a restart), apart from filling in a missing Matrix room.
 */
export function planSeed(
  rows: Pick<MappingRow, 'discord_channel_id' | 'irc_channel' | 'matrix_room_id'>[],
  seeds: BridgeGatewaySeed[],
  resolveDiscordId: (key: string) => string | undefined,
): SeedPlan {
  const plan: SeedPlan = { create: [], matrix: [], messages: [] };
  const existing = new Map(rows.map(row => [row.irc_channel.toLowerCase(), row]));

  seeds.forEach(seed => {
    const discordId = resolveDiscordId(seed.discord);
    if (!discordId) return; // Not bridged in this environment
    const ircChannel = seed.irc.toLowerCase();
    const row = existing.get(ircChannel);
    if (!row) {
      existing.set(ircChannel, {
        discord_channel_id: discordId, irc_channel: ircChannel, matrix_room_id: seed.matrix ?? null,
      });
      plan.create.push({
        discord_channel_id: discordId,
        irc_channel: ircChannel,
        gateway_name: seed.name,
        matrix_room_id: seed.matrix ?? null,
        topic: null,
        irc_registered: true, // These channels already exist on the network
        source: 'override',
      });
      return;
    }
    if (row.discord_channel_id !== discordId) {
      plan.messages.push(`Seed ${seed.name}: ${ircChannel} is mapped to another Discord channel, leaving it`);
    } else if (!row.matrix_room_id && seed.matrix) {
      plan.matrix.push({ irc_channel: ircChannel, matrix_room_id: seed.matrix });
    }
  });
  return plan;
}

/**
 * One line per Discord text channel saying whether it is bridged and to what, for the startup log.
 * Matrix rooms are listed as mapped only: nothing relays to Matrix yet.
 */
export function describeChannels(
  rows: MappingRow[],
  channels: CandidateChannel[],
  categories: BridgeCategories,
): string[] {
  const lines = channels.map(channel => {
    const mapped = rows.filter(row => row.discord_channel_id === channel.id);
    const active = mapped.filter(row => row.active && row.enabled);
    if (active.length > 0) {
      const irc = active.map(row => row.irc_channel).join(', ');
      const matrix = active.map(row => row.matrix_room_id).filter(Boolean).join(', ');
      const { source } = active[0];
      return `bridged: ${channel.name} (${channel.id}) <-> IRC ${irc} | Matrix ${matrix || 'none'} | ${source}`;
    }
    if (mapped.length > 0) {
      return `not bridged: ${channel.name} (${channel.id}), mapped to ${mapped.map(row => row.irc_channel).join(', ')} `
        + 'but inactive or disabled';
    }
    const eligibility = classifyChannel(channel, categories);
    const reason = eligibility === 'ok' ? 'no usable or unique IRC name' : eligibility;
    return `not bridged: ${channel.name} (${channel.id}), ${reason}`;
  });
  return lines.sort();
}
