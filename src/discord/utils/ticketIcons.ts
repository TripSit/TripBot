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

export const modTicketIcons = {
  new: openIcon,
  inProgress: ticketIcons.inProgress,
  closedByUser: '⚫ ✦',
  closedByMod: '⚫ ✓',
} as const;

export type ModTicketIconStatus = keyof typeof modTicketIcons;

function retag(name: string, icon: string): string {
  const separator = name.indexOf('│');
  return `${icon}│${separator === -1 ? name : name.slice(separator + 1)}`;
}

export function retagTicketChannelName(name: string, status: TicketIconStatus): string {
  return retag(name, ticketIcons[status]);
}

export function retagModTicketChannelName(name: string, status: ModTicketIconStatus): string {
  return retag(name, modTicketIcons[status]);
}

type RenameTarget = { id: string; client: Client };

function createRenameQueue(label: string) {
  const wantedNames = new Map<string, string>();
  const busyChannels = new Set<string>();

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
        log.debug(F, `Renaming ${label} ${channelId} to ${name} in ${Math.ceil(wait / 1000)}s, Discord says so`);
        setTimeout(() => { applyWantedName(client, channelId); }, wait);
        return;
      }
      log.debug(F, `Couldn't rename ${label} ${channelId} to ${name}: ${err}`);
    }

    if (wantedNames.get(channelId) !== name) {
      // Someone changed their mind mid-rename
      await applyWantedName(client, channelId);
      return;
    }
    wantedNames.delete(channelId);
    busyChannels.delete(channelId);
  }

  return {
    isQueued: (channelId: string): boolean => busyChannels.has(channelId),
    async setName(channel: RenameTarget, name: string): Promise<void> {
      wantedNames.set(channel.id, name);

      if (busyChannels.has(channel.id)) {
        return;
      }

      busyChannels.add(channel.id);
      await applyWantedName(channel.client, channel.id);
    },
  };
}

const tripsitTicketRenames = createRenameQueue('tripsit ticket');
const modTicketRenames = createRenameQueue('mod ticket');

export function isQueuedTicketRename(channelId: string): boolean {
  return tripsitTicketRenames.isQueued(channelId) || modTicketRenames.isQueued(channelId);
}

export async function setTicketChannelName(channel: RenameTarget, name: string): Promise<void> {
  await tripsitTicketRenames.setName(channel, name);
}

export async function setModTicketChannelName(channel: RenameTarget, name: string): Promise<void> {
  await modTicketRenames.setName(channel, name);
}
