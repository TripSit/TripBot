import {
  ChannelType, Client, Guild, GuildBasedChannel, PermissionFlagsBits,
} from 'discord.js';
import { CandidateChannel, describeChannels, MappingRow } from '../../global/bridge/bridge.channels';
import {
  getMappingRows, logSyncSummary, syncChannels, unresolvedSeeds,
} from '../../global/bridge/bridge.mappings';

const F = f(__filename);

type BridgeableChannel = Extract<GuildBasedChannel, { type: ChannelType.GuildText | ChannelType.GuildAnnouncement }>;

function isBridgeable(channel: GuildBasedChannel): channel is BridgeableChannel {
  return channel.type === ChannelType.GuildText || channel.type === ChannelType.GuildAnnouncement;
}

/** A channel is private when its @everyone overwrite (whose ID is the guild's) denies ViewChannel. */
export function isPrivateChannel(channel: BridgeableChannel): boolean {
  return channel.permissionOverwrites.cache.get(channel.guild.id)?.deny.has(PermissionFlagsBits.ViewChannel) ?? false;
}

export function candidateChannels(guild: Guild): CandidateChannel[] {
  return guild.channels.cache
    .filter(isBridgeable)
    .map(channel => ({
      id: channel.id,
      name: channel.name,
      topic: channel.topic,
      parentId: channel.parentId,
      isPrivate: isPrivateChannel(channel),
    }));
}

// Syncs run one at a time so a burst of channel events cannot interleave their writes
let queue: Promise<void> = Promise.resolve();
let first = true;

/** Compares the guild's cached channels with the bridge mapping and applies the difference. */
export function syncBridgeChannels(client: Client): Promise<void> {
  queue = queue.then(async () => {
    const guild = client.guilds.cache.get(env.DISCORD_GUILD_ID as string);
    if (!guild) {
      log.warn(F, 'Bridge sync skipped: the main guild is not cached');
      return;
    }
    const channels = candidateChannels(guild);
    const plan = await syncChannels(channels, { dryRun: env.BRIDGE_SYNC_DRY_RUN });
    if (first) {
      first = false;
      logSyncSummary(plan, env.BRIDGE_SYNC_DRY_RUN);
      // A dry run wrote nothing, so add what it would have created
      const rows = [...getMappingRows(), ...(env.BRIDGE_SYNC_DRY_RUN ? plan.create.map(row => ({
        ...row, active: true, enabled: true,
      } as MappingRow)) : [])];
      describeChannels(rows, channels, env.BRIDGE_CATEGORIES).forEach(line => log.info(F, `Bridge report: ${line}`));
      unresolvedSeeds().forEach(seed => log.info(F, `Bridge report: seed not bridged in this environment: ${seed}`));
    }
  }).catch(err => { log.error(F, `Bridge channel sync failed: ${err}`); });
  return queue;
}

export function registerBridgeSync(client: Client): void {
  const inMainGuild = (channel: { guildId?: string }) => channel.guildId === env.DISCORD_GUILD_ID;
  client.once('clientReady', () => { syncBridgeChannels(client); });
  client.on('channelCreate', channel => { if (inMainGuild(channel)) syncBridgeChannels(client); });
  client.on('channelUpdate', (_old, channel) => {
    if ('guildId' in channel && inMainGuild(channel)) syncBridgeChannels(client);
  });
  client.on('channelDelete', channel => {
    if ('guildId' in channel && inMainGuild(channel)) syncBridgeChannels(client);
  });
}
