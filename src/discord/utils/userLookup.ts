import {
  ChatInputCommandInteraction,
  GuildMember,
  User,
} from 'discord.js';

const F = f(__filename); // eslint-disable-line @typescript-eslint/no-unused-vars

export default getDiscordMember;

export async function getDiscordMember(
  interaction:ChatInputCommandInteraction,
  string:string,
):Promise<GuildMember> {
  let member = {} as GuildMember;
  if (!interaction.guild) return member;
  log.info(F, `string: ${string}`);

  if (string.startsWith('<@') && string.endsWith('>')) {
    // log.debug(F, `${string} is a mention!`);
    const id = string.replace(/[<@!>]/g, '');
    member = await interaction.guild.members.fetch(id);
  } else if (string.match(/^\d+$/)) {
    // Use regex to see if the string is all numbers
    // log.debug(F, `${string} is an ID!`);
    member = await interaction.guild.members.fetch(string);
  } else if (string.includes('#')) {
    // log.debug(F, `${string} is a tag!`);
    const username = string.split('#')[0];
    const searchCollection = await interaction.guild.members.fetch({ query: username, limit: 1 });
    if (searchCollection.first() !== undefined) {
      member = searchCollection.first() as GuildMember;
    }
  } else {
    // log.debug(F, `${string} is a username(?)!`);
    const searchCollection = await interaction.guild.members.fetch({ query: string, limit: 1 });
    if (searchCollection.first() !== undefined) {
      member = searchCollection.first() as GuildMember;
    }
  }

  log.info(F, `getDiscordUser: ${member.user.tag} (${member.id})`);
  return member;
}

export async function getDiscordUser(
  interaction:ChatInputCommandInteraction,
  string:string,
):Promise<User> {
  let user = {} as User;

  log.debug(F, `string: ${string}`);

  // Check if the string begins with <@ or ends with >
  if (string.startsWith('<@') && string.endsWith('>')) {
    log.debug(F, `${string} is a mention!`);
    user = await client.users.fetch(string.replace(/[<@!>]/g, ''));
  } else if (BigInt(string)) {
    log.debug(F, `${string} is an ID!`);
    user = await client.users.fetch(string);
  }

  log.debug(F, `getDiscordUser: ${user.tag} (${user.id})`);
  return user;
}
