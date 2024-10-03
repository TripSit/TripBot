import {
  Message, TextChannel,
} from 'discord.js';

export default helperActivityUpdate;

// const F = f(__filename);

/**
 * helperActivityUpdate
 * @param {Message} message The message that was sent
 * @return {Promise<void>}
* */
export async function helperActivityUpdate(message: Message): Promise<void> {
  if (!message.guild) return; // If not in a guild then ignore all messages
  if (message.guild.id !== env.DISCORD_GUILD_ID) return; // If not in tripsit ignore all messages

  // Determine if the message was sent in a TextChannel
  if (!(message.channel instanceof TextChannel)) return;

  if (message.channel.parentId !== env.CATEGORY_HARMREDUCTIONCENTRE) return;

  const guildData = await db.discord_guilds.upsert({
    where: {
      id: message.guild?.id,
    },
    create: {
      id: message.guild?.id,
    },
    update: {},
  });

  if (!guildData.role_helper) return;

  const role = await message.guild?.roles.fetch(guildData.role_helper);

  if (!message.member || !role || !message.member.roles.cache.has(role.id)) return;

  await db.users.upsert({
    where: {
      discord_id: message.author.id,
    },
    create: {
      discord_id: message.author.id,
    },
    update: {
      last_helper_activity: new Date(),
    },
  });
}
