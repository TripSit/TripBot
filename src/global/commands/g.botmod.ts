import type {
  ChatInputCommandInteraction,
  GuildMember,
  InteractionReplyOptions,
  TextChannel,
} from 'discord.js';

import { stripIndents } from 'common-tags';
import { ButtonStyle } from 'discord-api-types/v10';
import { ActionRowBuilder, ButtonBuilder, Colors, Role, time } from 'discord.js';

import commandContext from '../../discord/utils/context';
import { embedTemplate } from '../../discord/utils/embedTemplate';

const F = f(__filename);

type GuildActionType = 'BOTBAN' | 'BOTINFO' | 'BOTKICK' | 'BOTNOTE' | 'BOTWARNING' | 'UNBOTBAN';
type UserActionType = 'BOTBAN' | 'UNBOTBAN';

const embedVariables = {
  BOTBAN: {
    embedColor: Colors.Red,
    embedTitle: 'Banned!',
    verb: 'bot banned',
  },
  BOTINFO: {
    embedColor: Colors.Green,
    embedTitle: 'Info!',
    verb: 'got info on',
  },
  BOTKICK: {
    embedColor: Colors.Orange,
    embedTitle: 'Left!',
    verb: 'made me leave',
  },
  BOTNOTE: {
    embedColor: Colors.Yellow,
    embedTitle: 'Note!',
    verb: 'bot noted',
  },
  BOTWARNING: {
    embedColor: Colors.Yellow,
    embedTitle: 'Warned!',
    verb: 'bot warned',
  },
  UNBOTBAN: {
    embedColor: Colors.Green,
    embedTitle: 'Un-banned!',
    verb: 'bot un-banned',
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
  interaction: ChatInputCommandInteraction,
  group: 'guild' | 'user',
  actor: GuildMember,
  command: GuildActionType | UserActionType,
  target: string,
  privReason: null | string,
  pubReason: null | string,
): Promise<InteractionReplyOptions> {
  log.info(F, await commandContext(interaction));
  let response = {} as InteractionReplyOptions;
  if (group === 'user') {
    response = await botmodUser(
      interaction,
      actor,
      command as UserActionType,
      target,
      privReason,
      pubReason,
    );
  }
  if (group === 'guild') {
    response = await botmodGuild(
      interaction,
      actor,
      command as GuildActionType,
      target,
      privReason,
      pubReason,
    );
  }
  return response;
}

async function botmodGuild(
  interaction: ChatInputCommandInteraction,
  actor: GuildMember,
  command: GuildActionType,
  target: string,
  privReason: null | string,
  pubReason: null | string,
): Promise<InteractionReplyOptions> {
  const targetGuild = await interaction.client.guilds.fetch(target);
  const targetGuildOwner = await targetGuild.members.fetch(targetGuild.ownerId);
  const guildData = await db.discord_guilds.upsert({
    create: {
      id: targetGuild.id,
    },
    update: {},
    where: {
      id: targetGuild.id,
    },
  });

  if (command === 'BOTBAN' && guildData.is_banned) {
    const embed = embedTemplate()
      .setColor(Colors.Green)
      .setTitle('Guild Already Banned')
      .addFields({ name: 'Guild ID', value: target });
    return { embeds: [embed] };
  }

  if (command === 'UNBOTBAN' && !guildData.is_banned) {
    const embed = embedTemplate()
      .setColor(Colors.Green)
      .setTitle('Guild Not Banned')
      .addFields({ name: 'Guild ID', value: target });
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
    
    ${
      command !== 'BOTBAN' && command !== 'BOTKICK'
        ? 'You can respond to this bot and it will allow you to talk to the team privately!'
        : 'You can send an email to appeals@tripsit.me to appeal this ban!'
    }
    Please read the rules and be respectful of them.

    https://tripsit.me/rules
    `);
    if (command === 'BOTWARNING') {
      try {
        await targetGuildOwner.send({ components: [warnButtons], embeds: [warnEmbed] });
      } catch {
        // Ignore
      }
    } else {
      try {
        await targetGuildOwner.send({ embeds: [warnEmbed] });
      } catch {
        // Ignore
      }
    }
  }

  // Perform actions
  switch (command) {
    case 'BOTBAN': {
      guildData.is_banned = true;
      targetGuild.leave();

      break;
    }
    case 'BOTKICK': {
      targetGuild.leave();

      break;
    }
    case 'UNBOTBAN': {
      guildData.is_banned = false;

      break;
    }
    // No default
  }

  if (command !== 'BOTINFO') {
    // log.debug(F, `actionData: ${JSON.stringify(actionData, null, 2)}`);

    await db.discord_guilds.update({
      data: {
        is_banned: guildData.is_banned,
      },
      where: {
        id: targetGuild.id,
      },
    });
  }

  const noReason = 'No reason provided';
  const modlogEmbed = embedTemplate()
    .setColor(embedVariables[command as keyof typeof embedVariables].embedColor)
    .setTitle(
      `${actor.displayName} ${embedVariables[command as keyof typeof embedVariables].verb} ${targetGuild.name}`,
    ).setDescription(stripIndents`
    **PrivReason:** ${privReason ?? noReason}
    ${pubReason ? `**PubReason:** ${pubReason}` : ''}
    `);

  // Send the message to the mod channel
  if (command !== 'BOTINFO') {
    const moduleChan = (await globalThis.discordClient.channels.fetch(
      env.CHANNEL_MODERATORS,
    )) as TextChannel;
    // We must send the mention outside of the embed, cuz mentions don't work in embeds
    const tripsitGuild = await globalThis.discordClient.guilds.fetch(env.DISCORD_GUILD_ID);
    const roleModerator = (await tripsitGuild.roles.fetch(env.ROLE_MODERATOR))!;
    await moduleChan.send({ content: `Hey ${roleModerator}`, embeds: [modlogEmbed] });
    const modlog = (await globalThis.discordClient.channels.fetch(
      env.CHANNEL_MODLOG,
    )) as TextChannel;
    modlog.send({ embeds: [modlogEmbed] });
    // log.debug(F, `sent a message to the moderators room`);
  }

  // If this is the info command then return with info
  if (command === 'BOTINFO') {
    modlogEmbed
      .addFields(
        { inline: true, name: 'Name', value: targetGuild.name },
        { inline: true, name: 'Acronym', value: targetGuild.nameAcronym },
        { inline: true, name: 'ID', value: targetGuild.id },
      )
      .addFields(
        { inline: true, name: 'Created', value: time(targetGuild.createdAt, 'R') },
        { inline: true, name: 'Joined', value: time(targetGuild.joinedAt, 'R') },
        { inline: true, name: 'Description', value: `${targetGuild.description}` },
      )
      .addFields(
        { inline: true, name: 'Members', value: `${targetGuild.memberCount}` },
        { inline: true, name: 'Owner ID', value: targetGuild.ownerId },
        { inline: true, name: 'Owner Name', value: targetGuildOwner.user.tag },
      )
      .addFields(
        { inline: true, name: 'Banned', value: `${guildData.is_banned}` },
        { inline: true, name: 'Large', value: `${targetGuild.large}` },
        { inline: true, name: 'NSFW', value: `${targetGuild.nsfwLevel}` },
      )
      .addFields(
        { inline: true, name: 'Partner', value: `${targetGuild.partnered}` },
        { inline: true, name: 'Locale', value: targetGuild.preferredLocale },
        // { name: 'guild_region', value: `${targetGuild.guild_region}`, inline: true },
      );

    try {
      // log.info(F, `response: ${JSON.stringify(infoString, null, 2)}`);
      return { embeds: [modlogEmbed] };
    } catch (error) {
      log.error(F, `Error: ${error}`);
    }
  }

  // Return a message to the user confirming the user was acted on
  // log.debug(F, `${target.displayName} has been ${embedVariables[command as keyof typeof embedVariables].verb}!`);
  const desc = `${targetGuild.name} has been ${embedVariables[command as keyof typeof embedVariables].verb}!`;
  const response = embedTemplate().setColor(Colors.Yellow).setDescription(desc);
  log.info(F, `response: ${JSON.stringify(desc, null, 2)}`);
  return { embeds: [response] };
}

async function botmodUser(
  interaction: ChatInputCommandInteraction,
  actor: GuildMember,
  command: UserActionType,
  target: string,
  privReason: null | string,
  pubReason: null | string,
): Promise<InteractionReplyOptions> {
  const targetUser = await interaction.client.users.fetch(target);
  const userData = await db.users.upsert({
    create: {
      discord_id: targetUser.id,
    },
    update: {},
    where: {
      discord_id: targetUser.id,
    },
  });

  if (command === 'BOTBAN' && userData.discord_bot_ban) {
    const embed = embedTemplate()
      .setColor(Colors.Green)
      .setTitle('User Already Banned')
      .addFields({ name: 'User ID', value: target });
    return { embeds: [embed] };
  }

  if (command === 'UNBOTBAN' && !userData.discord_bot_ban) {
    const embed = embedTemplate()
      .setColor(Colors.Green)
      .setTitle('User Not Banned')
      .addFields({ name: 'User ID', value: target });
    return { embeds: [embed] };
  }

  // Perform actions
  if (command === 'BOTBAN') {
    userData.discord_bot_ban = true;
  } else if (command === 'UNBOTBAN') {
    userData.discord_bot_ban = false;
  }

  // log.debug(F, `targetUserInfo: ${JSON.stringify(targetUserInfo, null, 2)}`);

  await db.users.update({
    data: {
      discord_bot_ban: userData.discord_bot_ban,
    },
    where: {
      discord_id: targetUser.id,
    },
  });

  const noReason = 'No reason provided';
  const modlogEmbed = embedTemplate()
    .setColor(embedVariables[command as keyof typeof embedVariables].embedColor)
    .setTitle(
      `${actor.displayName} ${embedVariables[command as keyof typeof embedVariables].verb} ${targetUser.tag}`,
    ).setDescription(stripIndents`
    **PrivReason:** ${privReason ?? noReason}
    ${pubReason ? `**PubReason:** ${pubReason}` : ''}
    `);

  // Send the message to the mod channel
  const moduleChan = (await globalThis.discordClient.channels.fetch(
    env.CHANNEL_MODERATORS,
  )) as TextChannel;
  // We must send the mention outside of the embed, cuz mentions don't work in embeds
  const tripsitGuild = await globalThis.discordClient.guilds.fetch(env.DISCORD_GUILD_ID);
  const roleModerator = (await tripsitGuild.roles.fetch(env.ROLE_MODERATOR))!;
  await moduleChan.send({ content: `Hey ${roleModerator}`, embeds: [modlogEmbed] });
  const modlog = (await globalThis.discordClient.channels.fetch(env.CHANNEL_MODLOG)) as TextChannel;
  modlog.send({ embeds: [modlogEmbed] });
  // log.debug(F, `sent a message to the moderators room`);

  // Return a message to the user confirming the user was acted on
  // log.debug(F, `${target.displayName} has been ${embedVariables[command as keyof typeof embedVariables].verb}!`);
  const desc = `${targetUser.tag} has been ${embedVariables[command as keyof typeof embedVariables].verb}!`;
  const response = embedTemplate().setColor(Colors.Yellow).setDescription(desc);
  log.info(F, `response: ${JSON.stringify(desc, null, 2)}`);
  return { embeds: [response] };
}
