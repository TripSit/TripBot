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
  EmbedBuilder,
  ThreadChannel,
  MessageComponentInteraction,
} from 'discord.js';
import {
  ButtonStyle,
} from 'discord-api-types/v10';

import { stripIndents } from 'common-tags';
import ms from 'ms';
import { embedTemplate } from '../../discord/utils/embedTemplate';
import {
  getUser, useractionsGet, useractionsSet, usersUpdate,
} from '../utils/knex';
import {
  UserActions,
  UserActionType,
  Users,
} from '../@types/database';
import { last } from './g.last';

export default moderate;

const F = f(__filename);

// const teamRoles = [
//   env.ROLE_DIRECTOR,
//   env.ROLE_SUCCESSOR,
//   env.ROLE_SYSADMIN,
//   env.ROLE_LEADDEV,
//   env.ROLE_DISCORDADMIN,
//   env.ROLE_MODERATOR,
//   env.ROLE_TRIPSITTER,
//   env.ROLE_TEAMTRIPSIT,
//   env.ROLE_TRIPBOT2,
//   env.ROLE_TRIPBOT,
//   env.ROLE_BOT,
//   env.ROLE_DEVELOPER,
// ];

const embedVariables = {
  NOTE: {
    embedColor: Colors.Yellow,
    embedTitle: 'Note!',
    verb: 'noted',
  },
  WARNING: {
    embedColor: Colors.Yellow,
    embedTitle: 'Warned!',
    verb: 'warned',
  },
  FULL_BAN: {
    embedColor: Colors.Red,
    embedTitle: 'Banned!',
    verb: 'banned',
  },
  'UN-FULL_BAN': {
    embedColor: Colors.Green,
    embedTitle: 'Un-banned!',
    verb: 'un-banned',
  },
  TICKET_BAN: {
    embedColor: Colors.Red,
    embedTitle: 'Ticket Banned!',
    verb: 'banned from using tickets',
  },
  'UN-TICKET_BAN': {
    embedColor: Colors.Green,
    embedTitle: 'Un-Ticket Banned!',
    verb: 'allowed to submit tickets again',
  },
  DISCORD_BOT_BAN: {
    embedColor: Colors.Red,
    embedTitle: 'Discord Bot Banned!',
    verb: 'banned from using the Discord bot',
  },
  'UN-DISCORD_BOT_BAN': {
    embedColor: Colors.Green,
    embedTitle: 'Un-Discord Bot Banned!',
    verb: 'allowed to use the Discord bot again',
  },
  BAN_EVASION: {
    embedColor: Colors.Red,
    embedTitle: 'Ban Evasion!',
    verb: 'banned for evasion',
  },
  'UN-BAN_EVASION': {
    embedColor: Colors.Green,
    embedTitle: 'Un-Ban Evasion!',
    verb: 'un-banned for evasion',
  },
  UNDERBAN: {
    embedColor: Colors.Red,
    embedTitle: 'Underban!',
    verb: 'banned for being underage',
  },
  'UN-UNDERBAN': {
    embedColor: Colors.Green,
    embedTitle: 'Un-Underban!',
    verb: 'un-banned for being underage',
  },
  TIMEOUT: {
    embedColor: Colors.Yellow,
    embedTitle: 'Timeout!',
    verb: 'timed out',
  },
  'UN-TIMEOUT': {
    embedColor: Colors.Green,
    embedTitle: 'Untimeout!',
    verb: 'removed from time-out',
  },
  KICK: {
    embedColor: Colors.Orange,
    embedTitle: 'Kicked!',
    verb: 'kicked',
  },
  REPORT: {
    embedColor: Colors.Orange,
    embedTitle: 'Report!',
    verb: 'reported',
  },
  INFO: {
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

export async function moderate(
  actor: GuildMember,
  command: UserActionType | 'INFO' | 'UN-FULL_BAN' | 'UN-TICKET_BAN' | 'UN-DISCORD_BOT_BAN' | 'UN-UNDERBAN' | 'UN-BAN_EVASION' | 'UN-TIMEOUT',
  target: GuildMember,
  internalNote: string | null,
  description: string | null,
  duration: number | null,
):Promise<InteractionReplyOptions> {
  // log.debug(`${PREFIX}
  // actor: ${actor.user.tag}
  // command: ${command}
  // target: ${target.user.tag}
  // internalNote: ${internalNote}
  // description: ${description}
  // duration: ${duration}`);

  const actorData = await getUser(actor.id, null);
  const targetData = await getUser(target.id, null);

  // log.debug(F, `TargetData: ${JSON.stringify(targetData, null, 2)}`);

  // If this is a Warn, ban, timeout or kick, send a message to the user
  // Do this first cuz you can't do this if they're not in the guild
  if ((description !== '' && description !== null) && 'WARNING, FULL_BAN, TICKET_BAN, DISCORD_BOT_BAN, BAN_EVASION, UNDERBAN, TIMEOUT, KICK'.includes(command)) {
    const embed = embedTemplate()
      .setColor(embedVariables[command as keyof typeof embedVariables].embedColor)
      .setTitle(embedVariables[command as keyof typeof embedVariables].embedTitle);

    let body = stripIndents`
      Hey ${target}, I'm sorry to inform that you've been ${embedVariables[command as keyof typeof embedVariables].verb}${duration && command === 'TIMEOUT' ? ` for ${ms(duration, { long: true })}` : ''} by Team TripSit:

      ${description}

      **Do not message a moderator to talk about this!**
    `;

    if ('FULL_BAN, BAN_EVASION, UNDERBAN'.includes(command)) {
      body = stripIndents`${body}\n\nYou can send an email to appeals@tripsit.me to appeal this ban! Evasion bans are permanent, and underban bans are permanent until you turn 18.`;
    }

    if ('WARNING, TICKET_BAN, DISCORD_BOT_BAN, TIMEOUT, KICK'.includes(command)) {
      const channel = await client.channels.fetch(env.CHANNEL_HELPDESK);
      body = stripIndents`${body}\n\nYou can discuss this with the mods in ${channel}. Do not argue the rules in public channels!`;
    }

    if ('TIMEOUT'.includes(command)) {
      const channel = await client.channels.fetch(env.CHANNEL_HELPDESK);
      body = stripIndents`${body}\n\nYou can discuss this with the mods in ${channel} when this expires. Do not argue the rules in public channels!`;
    }

    if ('WARNING, TIMEOUT, KICK'.includes(command)) {
      body = stripIndents`${body}\n\nPlease review the rules so this doesn't happen again!\nhttps:// wiki.tripsit.me/wiki/Terms_of_Service`;
    }

    if ('KICK'.includes(command)) {
      body = stripIndents`${body}\n\nIf you feel you can follow the rules you can rejoin here: https://discord.gg/tripsit`;
    }

    embed.setDescription(body);

    if ('WARNING, TIMEOUT'.includes(command)) {
      try {
        const message = await target.user.send({ embeds: [embed], components: [warnButtons] });
        const filter = (i: MessageComponentInteraction) => i.user.id === target.user.id;
        const collector = message.createMessageComponentCollector({ filter, time: 0 });

        collector.on('collect', async (i: MessageComponentInteraction) => {
          if (i.customId === 'acknowledgeButton') {
            const targetChan = await client.channels.fetch(targetData.mod_thread_id as string) as TextChannel;
            if (targetChan) {
              await targetChan.send({
                embeds: [embedTemplate()
                  .setColor(Colors.Green)
                  .setDescription(`${target.user.username} has acknowledged their warning.`)],
              });
            }
            // remove the components from the message
            await i.update({ components: [] });
            i.user.send('Thanks for understanding! We appreciate your cooperation and will consider this in the future!');
          } else if (i.customId === 'refusalButton') {
            const targetChan = await client.channels.fetch(targetData.mod_thread_id as string) as TextChannel;
            await targetChan.send({
              embeds: [embedTemplate()
                .setColor(Colors.Red)
                .setDescription(`${target.user.username} has refused their warning and was kicked.`)],
            });
            // remove the components from the message
            await i.update({ components: [] });
            i.user.send('Thanks for admitting this, you\'ve been removed from the guild. You can rejoin if you ever decide to cooperate.');
            const guild = await client.guilds.fetch(env.DISCORD_GUILD_ID);
            await guild.members.kick(target.user.id, 'Refused to acknowledge warning');
          }
        });
      } catch (error) {
        // Ignore
      }
    } else {
      try {
        await target.user.send({ embeds: [embed] });
      } catch (error) {
        // Ignore
      }
    }
  }

  const noReason = 'No reason provided';
  let extraMessage = '';

  let actionData = {
    id: undefined as string | undefined,
    user_id: targetData.id,
    type: {} as UserActionType,
    ban_evasion_related_user: null as string | null,
    description,
    internal_note: internalNote,
    expires_at: null as Date | null,
    repealed_by: null as string | null,
    repealed_at: null as Date | null,
    created_by: actorData.id,
    created_at: new Date(),
  } as UserActions;

  // Perform actions
  if (command === 'TIMEOUT') {
    actionData.type = 'TIMEOUT' as UserActionType;
    actionData.expires_at = new Date(Date.now() + (duration as number));
    try {
      await target.timeout(duration, internalNote ?? noReason);
    } catch (err) {
      log.error(F, `Error: ${err}`);
    }
  } else if (command === 'UN-TIMEOUT') {
    actionData.type = 'TIMEOUT' as UserActionType;
    // Get the current timeout record from the DB

    const record = await useractionsGet(targetData.id, 'TIMEOUT');

    if (record.length > 0) {
      [actionData] = record;
    }

    actionData.repealed_at = new Date();
    actionData.repealed_by = actorData.id;

    try {
      await target.timeout(0, internalNote ?? noReason);
      // log.debug(F, `I untimeouted ${target.displayName} because\n '${internalNote}'!`);
    } catch (err) {
      log.error(F, `Error: ${err}`);
    }
  } else if (command === 'FULL_BAN') {
    actionData.type = 'FULL_BAN' as UserActionType;
    targetData.removed_at = new Date();
    await usersUpdate(targetData);

    try {
      const deleteMessageValue = duration ?? 0;
      if (deleteMessageValue > 0) {
      // log.debug(F, `I am deleting ${deleteMessageValue} days of messages!`);
        const response = await last(target);
        extraMessage = `${target.displayName}'s last ${response.messageCount} (out of ${response.totalMessages}) messages before being banned :\n${response.messageList}`;
      }
      const targetGuild = await global.client.guilds.fetch(env.DISCORD_GUILD_ID);
      // log.debug(F, `Days to delete: ${deleteMessageValue}`);
      // log.debug(F, `target: ${target.user.tag} | deleteMessageValue: ${deleteMessageValue} | internalNote: ${internalNote ?? noReason}`);
      targetGuild.members.ban(target, { deleteMessageSeconds: deleteMessageValue / 1000, reason: internalNote ?? noReason });
    } catch (err) {
      log.error(F, `Error: ${err}`);
    }
  } else if (command === 'UN-FULL_BAN') {
    actionData.type = 'FULL_BAN' as UserActionType;

    targetData.removed_at = null;
    await usersUpdate(targetData);

    const record = await useractionsGet(targetData.id, 'FULL_BAN');

    if (record.length > 0) {
      [actionData] = record;
    }
    actionData.repealed_at = new Date();
    actionData.repealed_by = actorData.id;

    try {
      const targetGuild = await global.client.guilds.fetch(env.DISCORD_GUILD_ID);
      await targetGuild.bans.fetch();
      await targetGuild.bans.remove(target.user, internalNote ?? noReason);
    } catch (err) {
      log.error(F, `Error: ${err}`);
    }
  } else if (command === 'UNDERBAN') {
    actionData.type = 'UNDERBAN' as UserActionType;
    targetData.removed_at = new Date();
    await usersUpdate(targetData);
    try {
      const targetGuild = await global.client.guilds.fetch(env.DISCORD_GUILD_ID);
      targetGuild.members.ban(target, { reason: internalNote ?? noReason });
    } catch (err) {
      log.error(F, `Error: ${err}`);
    }
  } else if (command === 'UN-UNDERBAN') {
    actionData.type = 'UNDERBAN' as UserActionType;
    targetData.removed_at = null;
    await usersUpdate(targetData);

    const record = await useractionsGet(targetData.id, 'UNDERBAN');
    if (record.length > 0) {
      [actionData] = record;
    }
    actionData.repealed_at = new Date();
    actionData.repealed_by = actorData.id;

    try {
      const targetGuild = await global.client.guilds.fetch(env.DISCORD_GUILD_ID);
      await targetGuild.bans.fetch();
      await targetGuild.bans.remove(target.user, internalNote ?? noReason);
    } catch (err) {
      log.error(F, `Error: ${err}`);
    }
  } else if (command === 'TICKET_BAN') {
    actionData.type = 'TICKET_BAN' as UserActionType;
    targetData.ticket_ban = true;
    await usersUpdate(targetData);
  } else if (command === 'UN-TICKET_BAN') {
    actionData.type = 'TICKET_BAN' as UserActionType;
    targetData.ticket_ban = false;

    await usersUpdate(targetData);

    const record = await useractionsGet(targetData.id, 'UNDERBAN');
    if (record.length > 0) {
      [actionData] = record;
    }
    actionData.repealed_at = new Date();
    actionData.repealed_by = actorData.id;
  } else if (command === 'DISCORD_BOT_BAN') {
    actionData.type = 'DISCORD_BOT_BAN' as UserActionType;
    targetData.discord_bot_ban = true;
    await usersUpdate(targetData);
  } else if (command === 'UN-DISCORD_BOT_BAN') {
    actionData.type = 'DISCORD_BOT_BAN' as UserActionType;
    targetData.discord_bot_ban = false;
    await usersUpdate(targetData);

    const record = await useractionsGet(targetData.id, actionData.type);
    if (record.length > 0) {
      [actionData] = record;
    }
    actionData.repealed_at = new Date();
    actionData.repealed_by = actorData.id;
  } else if (command === 'BAN_EVASION') {
    actionData.type = 'BAN_EVASION' as UserActionType;
    targetData.removed_at = new Date();
    await usersUpdate(targetData);
  } else if (command === 'UN-BAN_EVASION') {
    actionData.type = 'BAN_EVASION' as UserActionType;
    targetData.removed_at = null;
    await usersUpdate(targetData);

    const record = await useractionsGet(targetData.id, actionData.type);
    if (record.length > 0) {
      [actionData] = record;
    }
    actionData.repealed_at = new Date();
    actionData.repealed_by = actorData.id;
  } else if (command === 'NOTE') {
    actionData.type = 'NOTE' as UserActionType;
  } else if (command === 'REPORT') {
    actionData.type = 'REPORT' as UserActionType;
  } else if (command === 'KICK') {
    actionData.type = 'KICK' as UserActionType;
    try {
      await target.kick();
    } catch (err) {
      log.error(F, `Error: ${err}`);
    }
  } else if (command === 'WARNING') {
    actionData.type = 'WARNING' as UserActionType;
  }

  if (command !== 'INFO') {
    // This needs to happen before creating the modlog embed
    await useractionsSet(actionData);
  }

  const modlogEmbed = await userInfoEmbed(target, targetData, command);

  // If this is the info command then return with info
  if (command === 'INFO') {
    return { embeds: [modlogEmbed], ephemeral: true };
  }

  let modThread = {} as ThreadChannel;
  if (targetData.mod_thread_id) {
    modThread = await global.client.channels.fetch(targetData.mod_thread_id) as ThreadChannel;
  } else {
    // Create a new thread in the mod channel
    const modChan = await global.client.channels.fetch(env.CHANNEL_MODERATORS) as TextChannel;
    modThread = await modChan.threads.create({
      name: `${target.displayName}`,
      autoArchiveDuration: 60,
    });
    // Save the thread id to the user
    targetData.mod_thread_id = modThread.id;
    await usersUpdate(targetData);
  }

  const tripsitGuild = await global.client.guilds.fetch(env.DISCORD_GUILD_ID);
  const roleModerator = await tripsitGuild.roles.fetch(env.ROLE_MODERATOR) as Role;
  const greeting = `Hey ${roleModerator}`;
  const timeoutDuration = duration ? ` for ${ms(duration, { long: true })}` : '';
  const summary = `${actor.displayName} ${embedVariables[command as keyof typeof embedVariables].verb} ${target.displayName}${command === 'TIMEOUT' ? timeoutDuration : ''}!`;
  const anonSummary = `${target.displayName} was ${embedVariables[command as keyof typeof embedVariables].verb}${command === 'TIMEOUT' ? timeoutDuration : ''}!`;

  await modThread.send({
    content: stripIndents`
      ${command !== 'NOTE' ? greeting : ''}
      ${summary}
      **Reason:** ${internalNote ?? noReason}
      **Note sent to user:** ${(description !== '' && description !== null) ? description : '*No message sent to user*'}
    `,
    embeds: [modlogEmbed],
  });
  // log.debug(F, `sent a message to the moderators room`);
  if (extraMessage) {
    await modThread.send({ content: extraMessage });
  }

  const desc = stripIndents`
    ${anonSummary}
    **Reason:** ${internalNote ?? noReason}
    **Note sent to user:** ${(description !== '' && description !== null) ? description : '*No message sent to user*'}
  `;
  const response = embedTemplate()
    .setColor(Colors.Yellow)
    .setDescription(desc)
    .setFooter(null);

  const modlog = await global.client.channels.fetch(env.CHANNEL_MODLOG) as TextChannel;
  modlog.send({ embeds: [response] });
  // log.debug(F, `sent a message to the modlog room`);

  // Return a message to the user who started this, confirming the user was acted on
  // log.debug(F, `${target.displayName} has been ${embedVariables[command as keyof typeof embedVariables].verb}!`);

  log.info(F, `response: ${JSON.stringify(desc, null, 2)}`);
  return { embeds: [response], ephemeral: true };
}

export async function userInfoEmbed(target:GuildMember, targetData:Users, command: string):Promise<EmbedBuilder> {
  const targetActionList = {
    TIMEOUT: [] as string[],
    KICK: [] as string[],
    FULL_BAN: [] as string[],
    UNDERBAN: [] as string[],
    WARNING: [] as string[],
    NOTE: [] as string[],
    REPORT: [] as string[],
  };
  // Populate targetActionList from the db

  const targetActionListRaw = await useractionsGet(targetData.id);

  // log.debug(F, `targetActionListRaw: ${JSON.stringify(targetActionListRaw, null, 2)}`);

  // for (const action of targetActionListRaw) {
  targetActionListRaw.forEach(action => {
    const actionString = `${action.type} (${time(action.created_at, 'R')}) - ${action.internal_note
      ?? 'No note provided'}`;
    targetActionList[action.type as keyof typeof targetActionList].push(actionString);
  });

  // log.debug(F, `targetActionList: ${JSON.stringify(targetActionList, null, 2)}`);
  const modlogEmbed = embedTemplate()
    // eslint-disable-next-line
    .setFooter(null)
    .setAuthor({ name: `${target.displayName} (${target.user.tag})`, iconURL: target.user.displayAvatarURL() })
    .setColor(embedVariables[command as keyof typeof embedVariables].embedColor)
    .addFields(
      { name: 'Created', value: `${time(target.user.createdAt, 'R')}`, inline: true },
      { name: 'Joined', value: `${target.joinedAt ? time(target.joinedAt, 'R') : 'Unknown'}`, inline: true },
      { name: 'ID', value: `${target.id}`, inline: true },
    );
  if (targetActionList.NOTE.length > 0) {
    modlogEmbed.addFields({ name: '# of Notes', value: `${targetActionList.NOTE.length}`, inline: true });
  }
  if (targetActionList.WARNING.length > 0) {
    modlogEmbed.addFields({ name: '# of Warns', value: `${targetActionList.WARNING.length}`, inline: true });
  }
  if (targetActionList.REPORT.length > 0) {
    modlogEmbed.addFields({ name: '# of Reports', value: `${targetActionList.REPORT.length}`, inline: true });
  }
  if (targetActionList.TIMEOUT.length > 0) {
    modlogEmbed.addFields({ name: '# of Timeouts', value: `${targetActionList.TIMEOUT.length}`, inline: true });
  }
  if (targetActionList.KICK.length > 0) {
    modlogEmbed.addFields({ name: '# of Kicks', value: `${targetActionList.KICK.length}`, inline: true });
  }
  if (targetActionList.FULL_BAN.length > 0) {
    modlogEmbed.addFields({ name: '# of Bans', value: `${targetActionList.FULL_BAN.length}`, inline: true });
  }
  if (targetActionList.UNDERBAN.length > 0) {
    modlogEmbed.addFields({ name: '# of Underbans', value: `${targetActionList.UNDERBAN.length}`, inline: true });
  }

  if (command === 'INFO') {
    let infoString = stripIndents`
      ${targetActionList.FULL_BAN.length > 0 ? `**Bans**\n${targetActionList.FULL_BAN.join('\n')}` : ''}
      ${targetActionList.UNDERBAN.length > 0 ? `**Underbans**\n${targetActionList.UNDERBAN.join('\n')}` : ''}
      ${targetActionList.KICK.length > 0 ? `**Kicks**\n${targetActionList.KICK.join('\n')}` : ''}
      ${targetActionList.TIMEOUT.length > 0 ? `**Timeouts**\n${targetActionList.TIMEOUT.join('\n')}` : ''}
      ${targetActionList.WARNING.length > 0 ? `**Warns**\n${targetActionList.WARNING.join('\n')}` : ''}
      ${targetActionList.REPORT.length > 0 ? `**Reports**\n${targetActionList.REPORT.join('\n')}` : ''}
      ${targetActionList.NOTE.length > 0 ? `**Notes**\n${targetActionList.NOTE.join('\n')}` : ''}
    `;
    if (infoString.length === 0) {
      infoString = 'Squeaky clean!';
    }
    // log.debug(F, `infoString: ${infoString}`);
    modlogEmbed.setDescription(infoString);
  }

  return modlogEmbed;
}

export async function linkThread(
  discordId: string,
  threadId: string,
  override: boolean | null,
):Promise<string | null> {
  // Get the targetData from the db
  const targetData = await getUser(discordId, null);

  if (targetData.mod_thread_id === null || override) {
    // log.debug(F, `targetData.mod_thread_id is null, updating it`);
    targetData.mod_thread_id = threadId;
    await usersUpdate(targetData);
    return null;
  }
  // log.debug(F, `targetData.mod_thread_id is not null, not updating it`);
  return targetData.mod_thread_id;
}
