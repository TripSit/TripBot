/* eslint-disable max-len */
import {
  time,
  Colors,
  ActionRowBuilder,
  ButtonBuilder,
  GuildMember,
  TextChannel,
  Role,
  Guild,
  InteractionReplyOptions,
} from 'discord.js';
import {
  ButtonStyle,
} from 'discord-api-types/v10';
// import {ModActionDict} from '../@types/database.d';

import { stripIndents } from 'common-tags';
import ms from 'ms';
import { parse } from 'path';
import { embedTemplate } from '../../discord/utils/embedTemplate';
import { db, getUser } from '../utils/knex';
import {
  UserActions,
  UserActionType,
} from '../@types/pgdb';
import { last } from './g.last';

import env from '../utils/env.config';
import log from '../utils/log';

const PREFIX = parse(__filename).name;

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
  TIMEOUT: {
    embedColor: Colors.Yellow,
    embedTitle: 'Timeout!',
    verb: 'timed out',
  },
  UNTIMEOUT: {
    embedColor: Colors.Green,
    embedTitle: 'Untimeout!',
    verb: 'removed from time-out',
  },
  KICK: {
    embedColor: Colors.Orange,
    embedTitle: 'Kicked!',
    verb: 'kicked',
  },
  FULL_BAN: {
    embedColor: Colors.Red,
    embedTitle: 'Banned!',
    verb: 'banned',
  },
  UNBAN: {
    embedColor: Colors.Green,
    embedTitle: 'Un-banned!',
    verb: 'un-banned',
  },
  UNDERBAN: {
    embedColor: Colors.Blue,
    embedTitle: 'Underbanned!',
    verb: 'underbanned',
  },
  UNUNDERBAN: {
    embedColor: Colors.Green,
    embedTitle: 'Un-Underbanned!',
    verb: 'un-underbanned',
  },
  WARNING: {
    embedColor: Colors.Yellow,
    embedTitle: 'Warned!',
    verb: 'warned',
  },
  NOTE: {
    embedColor: Colors.Yellow,
    embedTitle: 'Note!',
    verb: 'noted',
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
    .setCustomId('acknowledgebtn')
    .setLabel('I understand, it wont happen again!')
    .setStyle(ButtonStyle.Primary),
  new ButtonBuilder()
    .setCustomId('refusalbtn')
    .setLabel('Nah, I do what I want!')
    .setStyle(ButtonStyle.Danger),
);

export default moderate;

/**
 * Takes a user and performs a moderation action on them
 * @param {GuildMember} actor
 * @param {string} command
 * @param {GuildMember} target
 * @param {string | null} privReason
 * @param {string | null} pubReason
 * @param {number | null} duration
 */
export async function moderate(
  actor: GuildMember,
  command: UserActionType | 'INFO' | 'UNBAN' | 'UNTIMEOUT' | 'UNUNDERBAN',
  target: GuildMember,
  privReason: string | null,
  pubReason: string | null,
  duration: number | null,
):Promise<InteractionReplyOptions> {
  // log.debug(`${PREFIX}
  // actor: ${actor.user.tag}
  // command: ${command}
  // target: ${target.user.tag}
  // privReason: ${privReason}
  // pubReason: ${pubReason}
  // duration: ${duration}`);

  // Send a message to the user
  if (command !== 'REPORT' && command !== 'NOTE' && command !== 'INFO') {
    const warnEmbed = embedTemplate()
      .setColor(embedVariables[command as keyof typeof embedVariables].embedColor)
      .setTitle(embedVariables[command as keyof typeof embedVariables].embedTitle)
      .setDescription(stripIndents`
    Hey ${target}, you have been ${embedVariables[command as keyof typeof embedVariables].verb}${duration && command === 'TIMEOUT' ? ` for ${ms(duration, { long: true })}` : ''} by Team TripSit:

    ${pubReason}

    **Do not message a moderator to talk about this!**
    
    ${command !== 'FULL_BAN' && command !== 'UNDERBAN' && command !== 'KICK'
    ? 'You can respond to this bot and it will allow you to talk to the team privately!'
    : 'You can send an email to appeals@tripsit.me to appeal this ban!'}
    Please read the rules and be respectful of them.

    https://tripsit.me/rules 
    `);
    if (command !== 'FULL_BAN' && command !== 'UNDERBAN' && command !== 'KICK') {
      try {
        await target.user.send({ embeds: [warnEmbed], components: [warnButtons] });
      } catch (error) {
        // Ignore
      }
    } else {
      try {
        await target.user.send({ embeds: [warnEmbed] });
      } catch (error) {
        // Ignore
      }
    }
  }

  const actorData = await getUser(actor.id, null);
  const targetData = await getUser(target.id, null);

  let extraMessage = '';

  let actionData = {
    id: undefined as string | undefined,
    user_id: targetData.id,
    type: {} as UserActionType,
    ban_evasion_related_user: null as string | null,
    description: pubReason ?? 'No reason provided' as string,
    internal_note: privReason ?? 'No reason provided' as string | null,
    expires_at: null as Date | null,
    repealed_by: null as string | null,
    repealed_at: null as Date | null,
    created_by: actorData.id,
    created_at: new Date(),
  } as UserActions;

  // Perform actions
  if (command === 'TIMEOUT') {
    actionData.type = 'TIMEOUT' as UserActionType;
    try {
      await target.timeout(duration, privReason ?? 'No reason provided');
    } catch (err) {
      log.error(`[${PREFIX}] Error: ${err}`);
    }
  } else if (command === 'UNTIMEOUT') {
    actionData.type = 'TIMEOUT' as UserActionType;
    // Get the current timeout record from the DB

    const timeoutRecord = await db<UserActions>('user_actions')
      .select('*')
      .where('user_id', targetData.id)
      .andWhere('type', 'TIMEOUT')
      .andWhere('repealed_at', null)
      .first();

    if (timeoutRecord) {
      actionData = timeoutRecord;
    }

    actionData.repealed_at = new Date();
    actionData.repealed_by = actorData.id;

    try {
      await target.timeout(0, privReason ?? 'No reason provided');
      // log.debug(`[${PREFIX}] I untimeouted ${target.displayName} because\n '${privReason}'!`);
    } catch (err) {
      log.error(`[${PREFIX}] Error: ${err}`);
    }
  } else if (command === 'FULL_BAN') {
    actionData.type = 'FULL_BAN' as UserActionType;
    try {
      const deleteMessageValue = duration ?? 0;
      if (deleteMessageValue > 0) {
      // log.debug(`[${PREFIX}] I am deleting ${deleteMessageValue} days of messages!`);
        const response = await last(target);
        extraMessage = `${target.displayName}'s last ${response.messageCount} (out of ${response.totalMessages}) messages before being banned :\n${response.messageList}`;
      }
      const targetGuild = await global.client.guilds.fetch(env.DISCORD_GUILD_ID);
      // log.debug(`[${PREFIX}] Days to delete: ${deleteMessageValue}`);
      targetGuild.members.ban(target, { deleteMessageSeconds: deleteMessageValue, reason: privReason ?? 'No reason provided' });
    } catch (err) {
      log.error(`[${PREFIX}] Error: ${err}`);
    }
  } else if (command === 'UNBAN') {
    actionData.type = 'BAN' as UserActionType;

    const previousRecord = await db<UserActions>('user_actions')
      .select('*')
      .where('user_id', targetData.id)
      .andWhere('type', 'FULL_BAN')
      .andWhere('repealed_at', null)
      .first();

    if (previousRecord) {
      actionData = previousRecord;
    }

    actionData.repealed_at = new Date();
    actionData.repealed_by = actorData.id;

    try {
      const targetGuild = await global.client.guilds.fetch(env.DISCORD_GUILD_ID);
      await targetGuild.bans.fetch();
      await targetGuild.bans.remove(target.user, privReason ?? 'No reason provided');
    } catch (err) {
      log.error(`[${PREFIX}] Error: ${err}`);
    }
  } else if (command === 'UNDERBAN') {
    actionData.type = 'UNDERBAN' as UserActionType;
    try {
      const targetGuild = await global.client.guilds.fetch(env.DISCORD_GUILD_ID);
      targetGuild.members.ban(target, { reason: privReason ?? 'No reason provided' });
    } catch (err) {
      log.error(`[${PREFIX}] Error: ${err}`);
    }
  } else if (command === 'UNUNDERBAN') {
    actionData.type = 'UNDERBAN' as UserActionType;

    const previousRecord = await db<UserActions>('user_actions')
      .select('*')
      .where('user_id', targetData.id)
      .andWhere('type', 'UNDERBAN')
      .andWhere('repealed_at', null)
      .first();

    if (previousRecord) {
      actionData = previousRecord;
    }

    actionData.repealed_at = new Date();
    actionData.repealed_by = actorData.id;

    try {
      const targetGuild = await global.client.guilds.fetch(env.DISCORD_GUILD_ID);
      await targetGuild.bans.fetch();
      await targetGuild.bans.remove(target.user, privReason ?? 'No reason provided');
    } catch (err) {
      log.error(`[${PREFIX}] Error: ${err}`);
    }
  } else if (command === 'TICKET_BAN') {
    actionData.type = 'TICKET_BAN' as UserActionType;
  } else if (command === 'DISCORD_BOT_BAN') {
    actionData.type = 'DISCORD_BOT_BAN' as UserActionType;
  } else if (command === 'BAN_EVASION') {
    actionData.type = 'BAN_EVASION' as UserActionType;
  } else if (command === 'NOTE') {
    actionData.type = 'NOTE' as UserActionType;
  } else if (command === 'REPORT') {
    actionData.type = 'REPORT' as UserActionType;
  } else if (command === 'KICK') {
    actionData.type = 'KICK' as UserActionType;
    try {
      await target.kick();
    } catch (err) {
      log.error(`[${PREFIX}] Error: ${err}`);
    }
  } else if (command === 'WARNING') {
    actionData.type = 'WARNING' as UserActionType;
  }

  if (command !== 'INFO') {
  // log.debug(`[${PREFIX}] actionData: ${JSON.stringify(actionData, null, 2)}`);
    await db<UserActions>('user_actions')
      .insert(actionData)
      .onConflict('id')
      .merge();
  }

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
  const targetActionListRaw = await db<UserActions>('user_actions')
    .select('*')
    .where('user_id', targetData.id)
    .orderBy('created_at', 'desc');

  // log.debug(`[${PREFIX}] targetActionListRaw: ${JSON.stringify(targetActionListRaw, null, 2)}`);

  // for (const action of targetActionListRaw) {
  targetActionListRaw.forEach(action => {
    const actionString = `${action.type} (${time(action.created_at, 'R')}) - ${action.internal_note
      ?? 'No note provided'}`;
    targetActionList[action.type as keyof typeof targetActionList].push(actionString);
  });

  // log.debug(`[${PREFIX}] targetActionList: ${JSON.stringify(targetActionList, null, 2)}`);

  const modlogEmbed = embedTemplate()
    // eslint-disable-next-line
    .setTitle(`${actor.displayName} ${embedVariables[command as keyof typeof embedVariables].verb} ${target.displayName} (${target.user.tag})${duration && command === 'TIMEOUT' ? ` for ${ms(duration, {long: true})}` : ''}`)
    .setDescription(stripIndents`
    **PrivReason:** ${privReason ?? 'No reason provided'}
    ${pubReason ? `**PubReason:** ${pubReason}` : ''}
    `)
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

  // Send the message to the mod channel
  if (command !== 'INFO') {
    const modChan = await global.client.channels.fetch(env.CHANNEL_MODERATORS) as TextChannel;
    // We must send the mention outside of the embed, cuz mentions dont work in embeds
    const tripsitGuild = await global.client.guilds.fetch(env.DISCORD_GUILD_ID) as Guild;
    const roleModerator = tripsitGuild.roles.cache.find((role:Role) => role.id === env.ROLE_MODERATOR) as Role;
    modChan.send({ content: `${command !== 'NOTE' ? `Hey ${roleModerator}` : ''}`, embeds: [modlogEmbed] });
    // log.debug(`[${PREFIX}] sent a message to the moderators room`);
    if (extraMessage) {
      await modChan.send({ content: extraMessage });
    }
  }

  // If this is the info command then return with info
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
    // log.debug(`[${PREFIX}] infoString: ${infoString}`);
    modlogEmbed.setDescription(infoString);
    try {
      log.info(`[${PREFIX}] response: ${JSON.stringify(infoString, null, 2)}`);
      return { embeds: [modlogEmbed], ephemeral: true };
    } catch (err) {
      log.error(`[${PREFIX}] Error: ${err}`);
    }
  }

  // Send a message to the modlog room
  if (command !== 'INFO') {
    const modlog = await global.client.channels.fetch(env.CHANNEL_MODLOG) as TextChannel;
    modlog.send({ embeds: [modlogEmbed] });
    // log.debug(`[${PREFIX}] sent a message to the modlog room`);
  }

  // Return a message to the user confirming the user was acted on
  // log.debug(`[${PREFIX}] ${target.displayName} has been ${embedVariables[command as keyof typeof embedVariables].verb}!`);
  const desc = `${target.displayName} has been ${embedVariables[command as keyof typeof embedVariables].verb}!`;
  const response = embedTemplate()
    .setColor(Colors.Yellow)
    .setDescription(desc);
  log.info(`[${PREFIX}] response: ${JSON.stringify(desc, null, 2)}`);
  return { embeds: [response], ephemeral: true };
}
