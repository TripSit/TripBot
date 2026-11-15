import {
  ButtonInteraction,
  ChatInputCommandInteraction,
  GuildMember,
  MessageContextMenuCommandInteraction,
  User,
  UserContextMenuCommandInteraction,
} from 'discord.js';

const F = f(__filename); // eslint-disable-line @typescript-eslint/no-unused-vars

export async function getDiscordMember(
  interaction:ChatInputCommandInteraction
  | UserContextMenuCommandInteraction
  | MessageContextMenuCommandInteraction
  | ButtonInteraction,
  string:string,
):Promise<GuildMember[]> {
  const members = [] as GuildMember[];
  if (!interaction.guild) return members;
  if (string.startsWith('<@') && string.endsWith('>')) {
    const id = string.replace(/[<@!>]/g, '');
    try {
      members.push(await interaction.guild.members.fetch(id));
    } catch {
      // Member is not in this guild; treat as no match.
    }
  } else if (/^\d+$/.test(string)) {
    try {
      members.push(await interaction.guild.members.fetch(string));
    } catch {
      // Member is not in this guild; treat as no match.
    }
  } else if (string.includes('#')) {
    const memberCollection = await interaction.guild.members.fetch()
      .then(memberList => memberList.filter(mem => mem.user.tag === string));

    // Add all members in that collection to the members list
    memberCollection.forEach(member => {
      members.push(member);
    });
  } else if (string.startsWith('@')) {
    const memberCollection = await interaction.guild.members.fetch({ query: string.slice(1), limit: 10 });
    // Add all members in that collection to the members list
    memberCollection.forEach(member => {
      members.push(member);
    });
  } else {
    const memberCollection = await interaction.guild.members.fetch({ query: string, limit: 10 });
    memberCollection.forEach(member => {
      members.push(member);
    });
  }
  return members;
}

export async function getDiscordUser(
  string:string,
):Promise<User | null> {
  let user = {} as User;

  // Check if the string begins with <@ or ends with >
  if (string.startsWith('<@') && string.endsWith('>')) {
    try {
      user = await discordClient.users.fetch(string.replace(/[<@!>]/g, ''));
    } catch {
      return null;
    }
  } else if (/^\d+$/.test(string)) {
    try {
      user = await discordClient.users.fetch(string);
    } catch {
      return null;
    }
  }

  return user;
}
