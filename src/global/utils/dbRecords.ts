import { discord_guilds, personas, users } from '@db/tripbot';

/** Returns the TripBot user row for a Discord ID, creating an empty one if it doesn't exist. */
export async function getOrCreateUser(discordId: string): Promise<users> {
  return db.users.upsert({
    where: { discord_id: discordId },
    create: { discord_id: discordId },
    update: {},
  });
}

/** Returns the guild row for a Discord guild ID, creating an empty one if it doesn't exist. */
export async function getOrCreateGuild(guildId: string): Promise<discord_guilds> {
  return db.discord_guilds.upsert({
    where: { id: guildId },
    create: { id: guildId },
    update: {},
  });
}

/** Returns the persona row for a TripBot user ID (users.id, not the Discord ID), creating one if needed. */
export async function getOrCreatePersona(userId: string): Promise<personas> {
  return db.personas.upsert({
    where: { user_id: userId },
    create: { user_id: userId },
    update: {},
  });
}
