import {
  ButtonInteraction,
  ChatInputCommandInteraction,
  GuildMember,
  User,
  UserContextMenuCommandInteraction,
} from 'discord.js';

const F = f(__filename); // eslint-disable-line @typescript-eslint/no-unused-vars

export async function getDiscordMember(
  interaction:ChatInputCommandInteraction | UserContextMenuCommandInteraction | ButtonInteraction,
  string:string,
):Promise<GuildMember[]> {
  const members = [] as GuildMember[];
  if (!interaction.guild) return members;
  if (string.startsWith('<@') && string.endsWith('>')) {
    // log.debug(F, `${string} is a mention!`);
    const id = string.replace(/[<@!>]/g, '');
    try {
      members.push(await interaction.guild.members.fetch(id));
    } catch (error) {
      // log.debug(F, `Error fetching member with ID ${string}, they may have left the guild!`);
    }
  } else if (string.match(/^\d+$/)) {
    // log.debug(F, `${string} is an ID!`);
    try {
      members.push(await interaction.guild.members.fetch(string));
    } catch (error) {
      // log.debug(F, `Error fetching member with ID ${string}, they may have left the guild!`);
    }
  } else if (string.includes('#')) {
    // log.debug(F, `${string} is a tag!`);
    // const memberCollection = await interaction.guild.members.fetch({ query: string, limit: 10 });
    const memberCollection = await interaction.guild.members.fetch()
      .then(memberList => memberList.filter(mem => mem.user.tag === string));

    // log.debug(F, `memberCollection: ${memberCollection.size} #1 = ${memberCollection.first()?.displayName}`);

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

  // log.info(F, `members: ${members.length} #1 = ${members[0]?.displayName}`);

  // if (members.length > 1) {
  //   const embed = embedTemplate()
  //     .setColor(Colors.Red)
  //     .setTitle('Found more than one user with with that value!')
  //     .setDescription(stripIndents`
  //       "${string}" returned ${members.length} results!

  //       Be more specific:
  //       > **Mention:** @Moonbear
  //       > **Tag:** moonbear#1234
  //       > **ID:** 9876581237
  //       > **Nickname:** MoonBear`);
  //   await interaction.reply({
  //     embeds: [embed],
  //     ephemeral: true,
  //   });
  //   return null;
  // }

  // if (members.length === 0) {
  //   return null;
  // }

  return members;
}

export async function getDiscordUser(
  string:string,
):Promise<User | null> {
  let user = {} as User;

  // Check if the string begins with <@ or ends with >
  if (string.startsWith('<@') && string.endsWith('>')) {
    // log.debug(F, `${string} is a mention!`);
    try {
      user = await discordClient.users.fetch(string.replace(/[<@!>]/g, ''));
    } catch (error) {
      // log.debug(F, `Error fetching user with ID ${string}, they may have left the guild!`);
      return null;
    }
  } else if (string.match(/^\d+$/)) {
    // log.debug(F, `${string} is an ID!`);
    try {
      user = await discordClient.users.fetch(string);
    } catch (error) {
      // log.debug(F, `Error fetching user with ID ${string}, they may have left the guild!`);
      return null;
    }
  }

  // log.debug(F, `getDiscordUser: ${user.tag} (${user.id})`);
  return user;
}
