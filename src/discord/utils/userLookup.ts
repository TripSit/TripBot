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
):Promise<GuildMember[]> {
  const members = [] as GuildMember[];
  if (!interaction.guild) return members;
  log.info(F, `string: ${string}`);

  if (string.startsWith('<@') && string.endsWith('>')) {
    // log.debug(F, `${string} is a mention!`);
    const id = string.replace(/[<@!>]/g, '');
    members.push(await interaction.guild.members.fetch(id));
  } else if (string.match(/^\d+$/)) {
    // log.debug(F, `${string} is an ID!`);
    members.push(await interaction.guild.members.fetch(string));
  } else if (string.includes('#')) {
    // log.debug(F, `${string} is a tag!`);
    const memberCollection = await interaction.guild.members.fetch({ query: string.split('#')[0], limit: 10 });
    // Add all members in that collection to the members list
    memberCollection.forEach(member => {
      members.push(member);
    });
  } else if (string.startsWith('@')) {
    // log.debug(F, `${string} is a string mention!`);
    const memberCollection = await interaction.guild.members.fetch({ query: string.slice(1), limit: 10 });
    // Add all members in that collection to the members list
    memberCollection.forEach(member => {
      members.push(member);
    });
  } else {
    // log.debug(F, `${string} is a username!`);
    const memberCollection = await interaction.guild.members.fetch({ query: string, limit: 10 });
    memberCollection.forEach(member => {
      members.push(member);
    });
  }

  log.info(F, `members: ${members.length} #1 = ${members[0]?.nickname}`);
  return members;
}

export async function getDiscordUser(
  interaction:ChatInputCommandInteraction,
  string:string,
):Promise<User> {
  let user = {} as User;

  // log.debug(F, `string: ${string}`);

  // Check if the string begins with <@ or ends with >
  if (string.startsWith('<@') && string.endsWith('>')) {
    // log.debug(F, `${string} is a mention!`);
    user = await client.users.fetch(string.replace(/[<@!>]/g, ''));
  } else if (BigInt(string)) {
    // log.debug(F, `${string} is an ID!`);
    user = await client.users.fetch(string);
  }

  // log.debug(F, `getDiscordUser: ${user.tag} (${user.id})`);
  return user;
}
