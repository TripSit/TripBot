/* eslint-disable max-len */
import {
  time,
  Colors,
  ActionRowBuilder,
  ButtonBuilder,
  GuildMember,
  TextChannel,
  Role,
  InteractionReplyOptions,
  ChatInputCommandInteraction,
} from 'discord.js';
import {
  ButtonStyle,
} from 'discord-api-types/v10';
// import {ModActionDict} from '../@types/database.d';

import { stripIndents } from 'common-tags';
import { embedTemplate } from '../../discord/utils/embedTemplate';
import {
  getGuild, getUser, guildUpdate, usersUpdate,
} from '../utils/knex';
import { commandContext } from '../../discord/utils/context';

const F = f(__filename);

type GuildActionType = 'BOTKICK' | 'BOTBAN' | 'UNBOTBAN' | 'BOTWARNING' | 'BOTNOTE' | 'BOTINFO';
type UserActionType = 'BOTBAN' | 'UNBOTBAN';

const embedVariables = {
  BOTKICK: {
    embedColor: Colors.Orange,
    embedTitle: 'Left!',
    verb: 'made me leave',
  },
  BOTBAN: {
    embedColor: Colors.Red,
    embedTitle: 'Banned!',
    verb: 'bot banned',
  },
  UNBOTBAN: {
    embedColor: Colors.Green,
    embedTitle: 'Un-banned!',
    verb: 'bot un-banned',
  },
  BOTWARNING: {
    embedColor: Colors.Yellow,
    embedTitle: 'Warned!',
    verb: 'bot warned',
  },
  BOTNOTE: {
    embedColor: Colors.Yellow,
    embedTitle: 'Note!',
    verb: 'bot noted',
  },
  BOTINFO: {
    embedColor: Colors.Green,
    embedTitle: 'Info!',
    verb: 'got info on',
  },
};

const warnButtons = new ActionRowBuilder<ButtonBuilder>().addComponents(
  new ButtonBuilder()
    .setCustomId('acknowledgeButton')
    .setLabel('I understand, it wont happen again!')
    .setStyle(ButtonStyle.Primary),
  new ButtonBuilder()
    .setCustomId('refusalButton')
    .setLabel('Nah, I do what I want!')
    .setStyle(ButtonStyle.Danger),
);

export default botmod;

async function botmodUser(
  interaction:ChatInputCommandInteraction,
  actor: GuildMember,
  command: UserActionType,
  target: string,
  privReason: string | null,
  pubReason: string | null,
):Promise<InteractionReplyOptions> {
  const targetUser = await interaction.client.users.fetch(target);
  const targetUserInfo = await getUser(targetUser.id, null, null);

  if (command === 'BOTBAN' && targetUserInfo.discord_bot_ban) {
    const embed = embedTemplate()
      .setColor(Colors.Green)
      .setTitle('User Already Banned')
      .addFields(
        { name: 'User ID', value: target },
      );
    return { embeds: [embed] };
  }

  if (command === 'UNBOTBAN' && !targetUserInfo.discord_bot_ban) {
    const embed = embedTemplate()
      .setColor(Colors.Green)
      .setTitle('User Not Banned')
      .addFields(
        { name: 'User ID', value: target },
      );
    return { embeds: [embed] };
  }

  // Perform actions
  if (command === 'BOTBAN') {
    targetUserInfo.discord_bot_ban = true;
  } else if (command === 'UNBOTBAN') {
    targetUserInfo.discord_bot_ban = false;
  }

  // log.debug(F, `targetUserInfo: ${JSON.stringify(targetUserInfo, null, 2)}`);

  await usersUpdate(targetUserInfo);

  const noReason = 'No reason provided';
  const modlogEmbed = embedTemplate()
    .setColor(embedVariables[command as keyof typeof embedVariables].embedColor)
    .setTitle(`${actor.displayName} ${embedVariables[command as keyof typeof embedVariables].verb} ${targetUser.tag}`)
    .setDescription(stripIndents`
    **PrivReason:** ${privReason ?? noReason}
    ${pubReason ? `**PubReason:** ${pubReason}` : ''}
    `);

  // Send the message to the mod channel
  const modChan = await global.client.channels.fetch(env.CHANNEL_MODERATORS) as TextChannel;
  // We must send the mention outside of the embed, cuz mentions don't work in embeds
  const tripsitGuild = await global.client.guilds.fetch(env.DISCORD_GUILD_ID);
  const roleModerator = await tripsitGuild.roles.fetch(env.ROLE_MODERATOR) as Role;
  await modChan.send({ content: `Hey ${roleModerator}`, embeds: [modlogEmbed] });
  const modlog = await global.client.channels.fetch(env.CHANNEL_MODLOG) as TextChannel;
  modlog.send({ embeds: [modlogEmbed] });
  // log.debug(F, `sent a message to the moderators room`);

  // Return a message to the user confirming the user was acted on
  // log.debug(F, `${target.displayName} has been ${embedVariables[command as keyof typeof embedVariables].verb}!`);
  const desc = `${targetUser.tag} has been ${embedVariables[command as keyof typeof embedVariables].verb}!`;
  const response = embedTemplate()
    .setColor(Colors.Yellow)
    .setDescription(desc);
  log.info(F, `response: ${JSON.stringify(desc, null, 2)}`);
  return { embeds: [response] };
}

async function botmodGuild(
  interaction:ChatInputCommandInteraction,
  actor: GuildMember,
  command: GuildActionType,
  target: string,
  privReason: string | null,
  pubReason: string | null,
):Promise<InteractionReplyOptions> {
  const targetGuild = await interaction.client.guilds.fetch(target);
  const targetGuildOwner = await targetGuild.members.fetch(targetGuild.ownerId);
  const targetGuildInfo = await getGuild(targetGuild.id);

  if (command === 'BOTBAN' && targetGuildInfo.is_banned) {
    const embed = embedTemplate()
      .setColor(Colors.Green)
      .setTitle('Guild Already Banned')
      .addFields(
        { name: 'Guild ID', value: target },
      );
    return { embeds: [embed] };
  }

  if (command === 'UNBOTBAN' && !targetGuildInfo.is_banned) {
    const embed = embedTemplate()
      .setColor(Colors.Green)
      .setTitle('Guild Not Banned')
      .addFields(
        { name: 'Guild ID', value: target },
      );
    return { embeds: [embed] };
  }

  // Send a message to the user
  if (command !== 'BOTNOTE' && command !== 'BOTINFO') {
    const warnEmbed = embedTemplate()
      .setColor(embedVariables[command as keyof typeof embedVariables].embedColor)
      .setTitle(embedVariables[command as keyof typeof embedVariables].embedTitle)
      .setDescription(stripIndents`
    Hey ${targetGuildOwner}, your guild has been ${embedVariables[command as keyof typeof embedVariables].verb} by Team TripSit:

    ${pubReason}

    **Do not message a moderator to talk about this!**
    
    ${command !== 'BOTBAN' && command !== 'BOTKICK'
    ? 'You can respond to this bot and it will allow you to talk to the team privately!'
    : 'You can send an email to appeals@tripsit.me to appeal this ban!'}
    Please read the rules and be respectful of them.

    https://tripsit.me/rules
    `);
    if (command === 'BOTWARNING') {
      try {
        await targetGuildOwner.send({ embeds: [warnEmbed], components: [warnButtons] });
      } catch (error) {
        // Ignore
      }
    } else {
      try {
        await targetGuildOwner.send({ embeds: [warnEmbed] });
      } catch (error) {
        // Ignore
      }
    }
  }

  // Perform actions
  if (command === 'BOTBAN') {
    targetGuildInfo.is_banned = true;
    targetGuild.leave();
  } else if (command === 'UNBOTBAN') {
    targetGuildInfo.is_banned = false;
  } else if (command === 'BOTKICK') {
    targetGuild.leave();
  }

  if (command !== 'BOTINFO') {
  // log.debug(F, `actionData: ${JSON.stringify(actionData, null, 2)}`);

    await guildUpdate(targetGuildInfo);
  }

  const noReason = 'No reason provided';
  const modlogEmbed = embedTemplate()
    .setColor(embedVariables[command as keyof typeof embedVariables].embedColor)
    .setTitle(`${actor.displayName} ${embedVariables[command as keyof typeof embedVariables].verb} ${targetGuild.name}`)
    .setDescription(stripIndents`
    **PrivReason:** ${privReason ?? noReason}
    ${pubReason ? `**PubReason:** ${pubReason}` : ''}
    `);

  // Send the message to the mod channel
  if (command !== 'BOTINFO') {
    const modChan = await global.client.channels.fetch(env.CHANNEL_MODERATORS) as TextChannel;
    // We must send the mention outside of the embed, cuz mentions don't work in embeds
    const tripsitGuild = await global.client.guilds.fetch(env.DISCORD_GUILD_ID);
    const roleModerator = await tripsitGuild.roles.fetch(env.ROLE_MODERATOR) as Role;
    await modChan.send({ content: `Hey ${roleModerator}`, embeds: [modlogEmbed] });
    const modlog = await global.client.channels.fetch(env.CHANNEL_MODLOG) as TextChannel;
    modlog.send({ embeds: [modlogEmbed] });
    // log.debug(F, `sent a message to the moderators room`);
  }

  // If this is the info command then return with info
  if (command === 'BOTINFO') {
    modlogEmbed
      .addFields(
        { name: 'Name', value: `${targetGuild.name}`, inline: true },
        { name: 'Acronym', value: `${targetGuild.nameAcronym}`, inline: true },
        { name: 'ID', value: `${targetGuild.id}`, inline: true },
      )
      .addFields(
        { name: 'Created', value: `${time(targetGuild.createdAt, 'R')}`, inline: true },
        { name: 'Joined', value: `${time(targetGuild.joinedAt, 'R')}`, inline: true },
        { name: 'Description', value: `${targetGuild.description}`, inline: true },
      )
      .addFields(
        { name: 'Members', value: `${targetGuild.memberCount}`, inline: true },
        { name: 'Owner ID', value: `${targetGuild.ownerId}`, inline: true },
        { name: 'Owner Name', value: `${targetGuildOwner.user.tag}`, inline: true },
      )
      .addFields(
        { name: 'Banned', value: `${targetGuildInfo.is_banned}`, inline: true },
        { name: 'Large', value: `${targetGuild.large}`, inline: true },
        { name: 'NSFW', value: `${targetGuild.nsfwLevel}`, inline: true },
      )
      .addFields(
        { name: 'Partner', value: `${targetGuild.partnered}`, inline: true },
        { name: 'Locale', value: `${targetGuild.preferredLocale}`, inline: true },
      // { name: 'guild_region', value: `${targetGuild.guild_region}`, inline: true },
      );

    try {
      // log.info(F, `response: ${JSON.stringify(infoString, null, 2)}`);
      return { embeds: [modlogEmbed] };
    } catch (err) {
      log.error(F, `Error: ${err}`);
    }
  }

  // Return a message to the user confirming the user was acted on
  // log.debug(F, `${target.displayName} has been ${embedVariables[command as keyof typeof embedVariables].verb}!`);
  const desc = `${targetGuild.name} has been ${embedVariables[command as keyof typeof embedVariables].verb}!`;
  const response = embedTemplate()
    .setColor(Colors.Yellow)
    .setDescription(desc);
  log.info(F, `response: ${JSON.stringify(desc, null, 2)}`);
  return { embeds: [response] };
}

/**
 * Takes a user and performs a moderation action on them
 * @param {GuildMember} actor
 * @param {string} command
 * @param {GuildMember} target
 * @param {string | null} privReason
 * @param {string | null} pubReason
 * @param {number | null} duration
 */
export async function botmod(
  interaction:ChatInputCommandInteraction,
  group: 'user' | 'guild',
  actor: GuildMember,
  command: UserActionType | GuildActionType,
  target: string,
  privReason: string | null,
  pubReason: string | null,
):Promise<InteractionReplyOptions> {
  log.info(F, await commandContext(interaction));
  let response = {} as InteractionReplyOptions;
  if (group === 'user') {
    response = await botmodUser(interaction, actor, (command as UserActionType), target, privReason, pubReason);
  }
  if (group === 'guild') {
    response = await botmodGuild(interaction, actor, (command as GuildActionType), target, privReason, pubReason);
  }
  return response;
}
