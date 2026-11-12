import { bridgeGatewaySeeds } from './bridge.gateways';
import {
  CandidateChannel, MappingRow, planSeed, planSync, SyncPlan,
} from './bridge.channels';
import { BridgeGateway } from './bridge.types';

const F = f(__filename);

/** What changed when the in-memory mapping was refreshed. */
export interface MappingChange {
  /** IRC channels (lowercase) that gained a mapping, or became active again. */
  added: string[];
  removed: string[];
  /** Still-bridged IRC channels whose topic changed. */
  topics: string[];
}

type MappingListener = (change: MappingChange) => void;

let rows: MappingRow[] = [];
const listeners = new Set<MappingListener>();
let ircChannelLength: number | undefined;

/** The IRC server's channel length limit, once the connection reports it. */
export function setIrcChannelLength(length: number | undefined): void {
  ircChannelLength = length;
}

export function getIrcChannelLength(): number | undefined {
  return ircChannelLength;
}

const activeIrcChannels = (list: MappingRow[]) => new Set(
  list.filter(row => row.active && row.enabled).map(row => row.irc_channel.toLowerCase()),
);

/** Replaces the cached mapping and tells listeners (the IRC connection) what to join or part. */
export function setMappings(next: MappingRow[]): void {
  const before = activeIrcChannels(rows);
  const oldTopics = new Map(rows.map(row => [row.irc_channel.toLowerCase(), row.topic]));
  rows = next;
  const after = activeIrcChannels(rows);
  const change: MappingChange = {
    added: [...after].filter(channel => !before.has(channel)),
    removed: [...before].filter(channel => !after.has(channel)),
    topics: next
      .filter(row => row.active && row.enabled && row.topic && oldTopics.has(row.irc_channel.toLowerCase())
        && oldTopics.get(row.irc_channel.toLowerCase()) !== row.topic)
      .map(row => row.irc_channel.toLowerCase()),
  };
  listeners.forEach(listener => listener(change));
}

export function onMappingChange(listener: MappingListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getMappingRows(): readonly MappingRow[] {
  return rows;
}

/** The active mappings as gateways, the shape the relay code works with. */
export function getGateways(): BridgeGateway[] {
  return rows
    .filter(row => row.active && row.enabled)
    .map(row => ({
      name: row.gateway_name,
      discord: row.discord_channel_id,
      irc: row.irc_channel,
      matrix: row.matrix_room_id ?? undefined,
    }))
    .sort((a, b) => (a.irc as string).localeCompare(b.irc as string));
}

export async function loadMappings(): Promise<void> {
  setMappings(await db.bridge_channels.findMany() as MappingRow[]);
}

const seedChannelId = (key: string): string | undefined => {
  const id = (env as Record<string, unknown>)[key];
  return typeof id === 'string' && id.length > 0 ? id : undefined;
};

/** Seeds that name no Discord channel in this environment, so they are not bridged here. */
export function unresolvedSeeds(): string[] {
  return bridgeGatewaySeeds
    .filter(seed => !seedChannelId(seed.discord))
    .map(seed => `${seed.name} (${seed.irc}, env ${seed.discord})`);
}

/** Adds the hand-written gateways to the table, then loads it. Safe to run on every start. */
export async function initBridgeMappings(): Promise<void> {
  const plan = planSeed(
    await db.bridge_channels.findMany(),
    bridgeGatewaySeeds,
    seedChannelId,
  );
  plan.messages.forEach(message => log.warn(F, message));
  if (plan.create.length > 0) {
    await db.bridge_channels.createMany({ data: plan.create, skipDuplicates: true });
    log.info(F, `Seeded ${plan.create.length} bridge channel override(s)`);
  }
  await Promise.all(plan.matrix.map(({ irc_channel, matrix_room_id }) => db.bridge_channels.update({
    where: { irc_channel },
    data: { matrix_room_id },
  })));
  await loadMappings();
}

/** Writes a sync plan to the table and refreshes the cache. */
export async function applySyncPlan(plan: SyncPlan): Promise<void> {
  const ids = (list: MappingRow[]) => list.map(row => row.irc_channel);
  await db.$transaction([
    ...(plan.create.length > 0 ? [db.bridge_channels.createMany({ data: plan.create, skipDuplicates: true })] : []),
    ...(plan.activate.length > 0 ? [db.bridge_channels.updateMany({
      where: { irc_channel: { in: ids(plan.activate) } },
      data: { active: true },
    })] : []),
    ...(plan.deactivate.length > 0 ? [db.bridge_channels.updateMany({
      where: { irc_channel: { in: ids(plan.deactivate) } },
      data: { active: false },
    })] : []),
    ...plan.topics.map(({ irc_channel, topic }) => db.bridge_channels.updateMany({
      where: { irc_channel },
      data: { topic },
    })),
  ]);
  await loadMappings();
}

export async function markIrcRegistered(ircChannel: string): Promise<void> {
  await db.bridge_channels.updateMany({
    where: { irc_channel: ircChannel.toLowerCase() },
    data: { irc_registered: true },
  });
  setMappings(rows.map(row => (
    row.irc_channel === ircChannel.toLowerCase() ? { ...row, irc_registered: true } : row
  )));
}

export function logSyncSummary(plan: SyncPlan, dryRun: boolean): void {
  const { stats } = plan;
  const unnamed = stats.unnamed > 0 ? `, ${stats.unnamed} without a usable name` : '';
  log.info(F, `Bridge sync${dryRun ? ' (dry run)' : ''}: ${stats.bridged} bridged, ${stats.skippedPrivate} `
    + `skipped private, ${stats.skippedCategory} skipped category, ${stats.collisions} collisions${unnamed}`);
}

/** Plans (and, unless dry-running, applies) a sync of the guild's channels. Returns the plan. */
export async function syncChannels(
  channels: CandidateChannel[],
  options: { dryRun?: boolean } = {},
): Promise<SyncPlan> {
  const plan = planSync({
    rows: await db.bridge_channels.findMany() as MappingRow[],
    channels,
    categories: env.BRIDGE_CATEGORIES,
    maxLength: ircChannelLength,
  });
  plan.messages.forEach(message => log.info(F, `Bridge sync: ${message}`));
  const changed = plan.create.length + plan.activate.length + plan.deactivate.length + plan.topics.length > 0;
  if (changed && !options.dryRun) await applySyncPlan(plan);
  else if (!changed) await loadMappings();
  return plan;
}
