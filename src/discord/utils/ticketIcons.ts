import { Client, RateLimitError } from 'discord.js';

const F = f(__filename);

const openIcon = '🟡 ▲';

export const ticketIcons = {
  new: openIcon,
  inProgress: '🔵 ●',
  resolved: '🔵 ✓', // The team says they're good; waiting on the user to close it
  closed: '⚫ ✔\uFE0E',
  reopened: openIcon,
} as const;

export type TicketIconStatus = keyof typeof ticketIcons;

export function retagTicketChannelName(name: string, status: TicketIconStatus): string {
  const separator = name.indexOf('│');
  return `${ticketIcons[status]}│${separator === -1 ? name : name.slice(separator + 1)}`;
}

const wantedNames = new Map<string, string>();
const busyChannels = new Set<string>();

export function isQueuedTicketRename(channelId: string): boolean {
  return busyChannels.has(channelId);
}

async function applyWantedName(client: Client, channelId: string): Promise<void> {
  const name = wantedNames.get(channelId);
  try {
    const channel = await client.channels.fetch(channelId, { force: true });
    if (name && channel && !channel.isDMBased() && channel.name !== name) {
      if (channel.isThread() && channel.archived) {
        await channel.edit({ name, archived: false });
        await channel.setArchived(true);
      } else {
        await channel.setName(name);
      }
    }
  } catch (err) {
    if (err instanceof RateLimitError) {
      const wait = err.sublimitTimeout || err.retryAfter;
      log.debug(F, `Renaming ${channelId} to ${name} in ${Math.ceil(wait / 1000)}s, Discord says so`);
      setTimeout(() => { applyWantedName(client, channelId); }, wait);
      return;
    }
    log.debug(F, `Couldn't rename ${channelId} to ${name}: ${err}`);
  }

  if (wantedNames.get(channelId) !== name) {
    // Someone changed their mind mid-rename
    await applyWantedName(client, channelId);
    return;
  }
  wantedNames.delete(channelId);
  busyChannels.delete(channelId);
}

export async function setTicketChannelName(channel: { id: string; client: Client }, name: string): Promise<void> {
  wantedNames.set(channel.id, name);

  if (busyChannels.has(channel.id)) {
    return;
  }

  busyChannels.add(channel.id);
  await applyWantedName(channel.client, channel.id);
}
