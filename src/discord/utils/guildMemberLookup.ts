import { stripIndents } from 'common-tags';
import {
  ChatInputCommandInteraction,
  Colors,
  GuildMember,
  User,
} from 'discord.js';
import { embedTemplate } from './embedTemplate';

const F = f(__filename); // eslint-disable-line @typescript-eslint/no-unused-vars

export default getDiscordMember;

export async function getDiscordMember(
  interaction:ChatInputCommandInteraction,
  string:string,
):Promise<GuildMember | null> {
  const members = [] as GuildMember[];
  if (!interaction.guild) return null;
  // log.info(F, `string: ${string}`);

  if (string.startsWith('<@') && string.endsWith('>')) {
    log.debug(F, `${string} is a mention!`);
    const id = string.replace(/[<@!>]/g, '');
    try {
      members.push(await interaction.guild.members.fetch(id));
    } catch (error) {
      log.debug(F, `Error fetching member with ID ${string}, they may have left the guild!`);
    }
  } else if (string.match(/^\d+$/)) {
    log.debug(F, `${string} is an ID!`);
    try {
      members.push(await interaction.guild.members.fetch(string));
    } catch (error) {
      log.debug(F, `Error fetching member with ID ${string}, they may have left the guild!`);
    }
  } else if (string.includes('#')) {
    log.debug(F, `${string} is a tag!`);
    // const memberCollection = await interaction.guild.members.fetch({ query: string, limit: 10 });
    const memberCollection = await interaction.guild.members.fetch().then(memberList => memberList.filter(mem => mem.user.tag === string));

    // log.debug(F, `memberCollection: ${memberCollection.size} #1 = ${memberCollection.first()?.displayName}`);

    // Add all members in that collection to the members list
    memberCollection.forEach(member => {
      members.push(member);
    });
  } else if (string.startsWith('@')) {
    log.debug(F, `${string} is a string mention!`);
    const memberCollection = await interaction.guild.members.fetch({ query: string.slice(1), limit: 10 });
    // Add all members in that collection to the members list
    memberCollection.forEach(member => {
      members.push(member);
    });
  } else {
    log.debug(F, `${string} is a username!`);
    const memberCollection = await interaction.guild.members.fetch({ query: string, limit: 10 });
    memberCollection.forEach(member => {
      members.push(member);
    });
  }

  // log.info(F, `members: ${members.length} #1 = ${members[0]?.displayName}`);

  if (members.length > 1) {
    const embed = embedTemplate()
      .setColor(Colors.Red)
      .setTitle('Found more than one user with with that value!')
      .setDescription(stripIndents`
        "${string}" returned ${members.length} results!

        Be more specific:
        > **Mention:** @Moonbear
        > **Tag:** moonbear#1234
        > **ID:** 9876581237
        > **Nickname:** MoonBear`);
    await interaction.reply({ embeds: [embed] });
    return null;
  }

  if (members.length === 0) {
    const embed = embedTemplate()
      .setColor(Colors.Red)
      .setTitle('Could not find that user!')
      .setDescription(stripIndents`
        "${string}" returned no results!

        Try again with:
        > **Mention:** @Moonbear
        > **Tag:** moonbear#1234
        > **ID:** 9876581237
        > **Nickname:** MoonBear`);
    await interaction.reply({ embeds: [embed] });
    return null;
  }

  return members[0];
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
