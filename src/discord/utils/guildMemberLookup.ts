import type {
  ButtonInteraction,
  ChatInputCommandInteraction,
  GuildMember,
  MessageContextMenuCommandInteraction,
  User,
  UserContextMenuCommandInteraction,
} from 'discord.js';

const F = f(__filename); // eslint-disable-line @typescript-eslint/no-unused-vars

export async function getDiscordMember(
  interaction:
    | ButtonInteraction
    | ChatInputCommandInteraction
    | MessageContextMenuCommandInteraction
    | UserContextMenuCommandInteraction,
  string: string,
): Promise<GuildMember[]> {
  const members = [] as GuildMember[];
  if (!interaction.guild) {
    return members;
  }
  if (string.startsWith('<@') && string.endsWith('>')) {
    // log.debug(F, `${string} is a mention!`);
    const id = string.replaceAll(/[<@!>]/g, '');
    try {
      members.push(await interaction.guild.members.fetch(id));
    } catch {
      // log.debug(F, `Error fetching member with ID ${string}, they may have left the guild!`);
    }
  } else if (/^\d+$/.test(string)) {
    // log.debug(F, `${string} is an ID!`);
    try {
      members.push(await interaction.guild.members.fetch(string));
    } catch {
      // log.debug(F, `Error fetching member with ID ${string}, they may have left the guild!`);
    }
  } else if (string.includes('#')) {
    // log.debug(F, `${string} is a tag!`);
    // const memberCollection = await interaction.guild.members.fetch({ query: string, limit: 10 });
    const memberCollection = await interaction.guild.members
      .fetch()
      .then((memberList) => memberList.filter((mem) => mem.user.tag === string));

    // log.debug(F, `memberCollection: ${memberCollection.size} #1 = ${memberCollection.first()?.displayName}`);

    // Add all members in that collection to the members list
    for (const member of memberCollection) {
      members.push(member);
    }
  } else if (string.startsWith('@')) {
    // log.debug(F, `${string} is a string mention!`);
    const memberCollection = await interaction.guild.members.fetch({
      limit: 10,
      query: string.slice(1),
    });
    // Add all members in that collection to the members list
    for (const member of memberCollection) {
      members.push(member);
    }
  } else {
    // log.debug(F, `${string} is a username!`);
    const memberCollection = await interaction.guild.members.fetch({ limit: 10, query: string });
    for (const member of memberCollection) {
      members.push(member);
    }
  }
  return members;
}

export async function getDiscordUser(string: string): Promise<null | User> {
  let user = {} as User;

  // Check if the string begins with <@ or ends with >
  if (string.startsWith('<@') && string.endsWith('>')) {
    // log.debug(F, `${string} is a mention!`);
    try {
      user = await discordClient.users.fetch(string.replaceAll(/[<@!>]/g, ''));
    } catch {
      // log.debug(F, `Error fetching user with ID ${string}, they may have left the guild!`);
      return null;
    }
  } else if (/^\d+$/.test(string)) {
    // log.debug(F, `${string} is an ID!`);
    try {
      user = await discordClient.users.fetch(string);
    } catch {
      // log.debug(F, `Error fetching user with ID ${string}, they may have left the guild!`);
      return null;
    }
  }

  // log.debug(F, `getDiscordUser: ${user.tag} (${user.id})`);
  return user;
}
