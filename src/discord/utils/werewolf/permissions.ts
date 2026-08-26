import { Guild, PermissionFlagsBits, TextChannel } from 'discord.js';

const F = f(__filename);

async function getChannel(
  guild: Guild,
  channelId: string | null | undefined,
  label: string,
): Promise<TextChannel | null> {
  if (!channelId) {
    log.warn(F, `No ${label} channel configured for this game - skipping permission update.`);
    return null;
  }
  return await guild.channels.fetch(channelId).catch(() => null) as TextChannel | null;
}

// Silence #town for everyone - called at the start of the night phase.
export async function muteTown(guild: Guild, townChannelId: string): Promise<void> {
  const townChannel = await getChannel(guild, townChannelId, 'town');
  if (!townChannel) return;

  await townChannel.permissionOverwrites.edit(guild.roles.everyone, { SendMessages: false });
}

// Let living players talk in #town again, keeping dead players muted - called at the start of a day phase.
export async function unmuteTown(guild: Guild, townChannelId: string, deadDiscordIds: string[]): Promise<void> {
  const townChannel = await getChannel(guild, townChannelId, 'town');
  if (!townChannel) return;

  await townChannel.permissionOverwrites.edit(guild.roles.everyone, { SendMessages: true });

  await Promise.all(deadDiscordIds.map(discordId => townChannel.permissionOverwrites.edit(
    discordId,
    { SendMessages: false },
  )));
}

// Hide #wolves from everyone except the currently-living wolves - called at the start of each night.
// Takes every wolf who has ever been in the game (not just the living ones) so a wolf who died in a
// previous round has their access explicitly revoked, instead of just never being re-granted.
export async function restrictWolfden(
  guild: Guild,
  wolfdenChannelId: string | null,
  wolves: { discord_id: string; is_alive: boolean }[],
): Promise<void> {
  const wolfdenChannel = await getChannel(guild, wolfdenChannelId, 'wolf den');
  if (!wolfdenChannel) return;

  await wolfdenChannel.permissionOverwrites.edit(guild.roles.everyone, { ViewChannel: false });

  await Promise.all(wolves.map(wolf => wolfdenChannel.permissionOverwrites.edit(wolf.discord_id, {
    ViewChannel: wolf.is_alive,
    SendMessages: wolf.is_alive,
  })));
}

// Reset #town and #wolves permission overwrites back to their defaults - called when a game ends.
export async function resetWerewolfChannels(
  guild: Guild,
  townChannelId: string,
  wolfdenChannelId: string | null,
  playerDiscordIds: string[],
): Promise<void> {
  const townChannel = await getChannel(guild, townChannelId, 'town');
  if (townChannel) {
    await townChannel.permissionOverwrites.edit(guild.roles.everyone, { SendMessages: null });
    await Promise.all(playerDiscordIds.map(
      discordId => townChannel.permissionOverwrites.delete(discordId).catch(() => null),
    ));
  }

  const wolfdenChannel = await getChannel(guild, wolfdenChannelId, 'wolf den');
  if (wolfdenChannel) {
    await wolfdenChannel.permissionOverwrites.edit(guild.roles.everyone, { ViewChannel: null });
    await Promise.all(playerDiscordIds.map(
      discordId => wolfdenChannel.permissionOverwrites.delete(discordId).catch(() => null),
    ));
  }
}

// Checks whether @everyone can currently see the wolf den, computed via permissionsFor() so it
// accounts for category-level overwrites too, not just a direct channel overwrite. Does not account
// for members who bypass channel overwrites entirely (server owner, Administrator permission) -
// Discord itself lets those see every channel regardless of any overwrite.
export async function isWolfdenVisibleToEveryone(guild: Guild, wolfdenChannelId: string | null): Promise<boolean> {
  const wolfdenChannel = await getChannel(guild, wolfdenChannelId, 'wolf den');
  if (!wolfdenChannel) return false;

  return wolfdenChannel.permissionsFor(guild.roles.everyone)?.has(PermissionFlagsBits.ViewChannel) ?? false;
}
