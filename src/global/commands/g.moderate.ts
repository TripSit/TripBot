/* eslint-disable no-lonely-if */
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
import { botBannedUsers } from '../../discord/utils/populateBotBans';

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
    botBannedUsers.push(target.id);
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

    // Remove the user from the botBannedUsers list
    const index = botBannedUsers.indexOf(target.id);
    if (index > -1) {
      botBannedUsers.splice(index, 1);
    }
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
    // log.debug(F, `Member: ${JSON.stringify(target)}`);
    // log.debug(F, `User: ${JSON.stringify(target.user)}`);
    let trollScore = 0;
    let tsReasoning = '';

    // Calculate how like it is that this user is a troll.
    // This is based off of factors like, how old is their account, do they have a profile picture, how many other guilds are they in, etc.
    const diff = Math.abs(Date.now() - Date.parse(target.user.createdAt.toString()));
    const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365));
    const months = Math.floor(diff / (1000 * 60 * 60 * 24 * 30));
    const weeks = Math.floor(diff / (1000 * 60 * 60 * 24 * 7));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    if (years > 0) {
      trollScore += 0;
      tsReasoning += '+0 | Account was created at least a year ago\n';
    } else if (years === 0 && months > 0) {
      trollScore += 1;
      tsReasoning += '+1 | Account was created months ago\n';
    } else if (months === 0 && weeks > 0) {
      trollScore += 2;
      tsReasoning += '+2 | Account was created weeks ago\n';
    } else if (weeks === 0 && days > 0) {
      trollScore += 3;
      tsReasoning += '+3 | Account was created days ago\n';
    } else if (days === 0 && hours > 0) {
      trollScore += 4;
      tsReasoning += '+4 | Account was created hours ago\n';
    } else if (hours === 0 && minutes > 0) {
      trollScore += 5;
      tsReasoning += '+5 | Account was created minutes ago\n';
    } else if (minutes === 0 && seconds > 0) {
      trollScore += 6;
      tsReasoning += '+6 | Account was created seconds ago\n';
    }

    if (target.user.avatarURL()) {
      trollScore += 0;
      tsReasoning += '+0 | Account has a profile picture\n';
    } else {
      trollScore += 1;
      tsReasoning += '+1 | Account does not have a profile picture\n';
    }

    if (target.user.bannerURL()) {
      trollScore += 0;
      tsReasoning += '+0 | Account has a banner\n';
    } else {
      trollScore += 1;
      tsReasoning += '+1 | Account does not have a banner\n';
    }

    if (target.premiumSince) {
      trollScore -= 1;
      tsReasoning += '-1 | Account is boosting the guild\n';
    } else {
      trollScore += 0;
      tsReasoning += '+0 | Account is not boosting the guild\n';
    }

    const errorUnknown = 'unknown-error';
    const errorMember = 'unknown-member';
    const errorPermission = 'no-permission';

    await client.guilds.fetch();
    const memberTest = await Promise.all(client.guilds.cache.map(async guild => {
      try {
        await guild.members.fetch(target.id);
        // log.debug(F, `User is in guild: ${guild.name}`);
        return guild.name;
      } catch (err:any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        // log.debug(F, `Error: ${err} in ${guild.name}`);
        if (err.code === 10007) {
          return errorMember;
        }
        return errorUnknown;
      }
    }));

    // count how many 'banned' appear in the array
    const mutualGuilds = memberTest.filter(item => item !== errorUnknown && item !== errorMember);
    // log.debug(F, `mutualGuilds: ${mutualGuilds.join(', ')}`);

    if (mutualGuilds.length > 0) {
      trollScore += 0;
      tsReasoning += `+0 | I currently share ${mutualGuilds.length} guilds with them\n`;
    } else {
      trollScore += mutualGuilds.length;
      tsReasoning += `+1 | Account is only in this guild, that i can tell
      `;
    }

    const bannedTest = await Promise.all(client.guilds.cache.map(async guild => {
      try {
        await guild.bans.fetch(target.id);
        // log.debug(F, `User is banned in guild: ${guild.name}`);
        return guild.name;
      } catch (err:any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        // log.debug(F, `Error: ${err} in ${guild.name}`);
        if (err.code === 50013) {
          // log.debug(F, `I do not have permission to check if ${target.user.tag} is banned in ${guild.name}`);
          return errorPermission;
        }
        if (err.code === 10026) {
          // log.debug(F, `Ban not found for ${target.user.tag} in ${guild.name}`);
          return 'not-found';
        }
        // return nothing
        return errorUnknown;
      }
    }));

    // count how many 'banned' appear in the array
    const bannedGuilds = bannedTest.filter(item => item !== errorPermission && item !== 'not-found' && item !== errorUnknown);
    // log.debug(F, `Banned Guilds: ${bannedGuilds.join(', ')}`);

    // count how many i didn't have permission to check
    const noPermissionGuilds = bannedTest.filter(item => item === errorPermission);

    if (bannedGuilds.length === 0) {
      trollScore += 0;
      tsReasoning += stripIndents`+0 | Not banned in any other guilds that I can tell
      I could not check ${noPermissionGuilds.length} guilds due to permission issues\n`;
    } else {
      trollScore += bannedGuilds.length;
      tsReasoning += stripIndents`+${bannedGuilds.length} | Account is banned in ${bannedGuilds.length} other guilds that I can see
      I could not check ${noPermissionGuilds.length} guilds due to permission issues\n`;
    }

    modlogEmbed.setDescription(`**TripSit TrollScore: ${trollScore}**\n\`\`\`${tsReasoning}\`\`\`
    ${modlogEmbed.data.description}`);
    return { embeds: [modlogEmbed] };
  }

  const tripsitGuild = await global.client.guilds.fetch(env.DISCORD_GUILD_ID);
  const roleModerator = await tripsitGuild.roles.fetch(env.ROLE_MODERATOR) as Role;
  const greeting = `Hey ${roleModerator}`;
  const timeoutDuration = duration ? ` for ${ms(duration, { long: true })}` : '';
  const summary = `${actor.displayName} ${embedVariables[command as keyof typeof embedVariables].verb} ${target.displayName}${command === 'TIMEOUT' ? timeoutDuration : ''}!`;
  const anonSummary = `${target.displayName} was ${embedVariables[command as keyof typeof embedVariables].verb}${command === 'TIMEOUT' ? timeoutDuration : ''}!`;

  let modThread = {} as ThreadChannel;
  if (targetData.mod_thread_id) {
    modThread = await global.client.channels.fetch(targetData.mod_thread_id) as ThreadChannel;
    log.debug(F, 'Mod thread exists');
  } else {
    // Create a new thread in the mod channel
    if (!internalNote?.toLowerCase().includes('vendor')) {
      const modChan = await global.client.channels.fetch(env.CHANNEL_MODERATORS) as TextChannel;
      modThread = await modChan.threads.create({
        name: `${target.displayName}`,
        autoArchiveDuration: 60,
      });
      // log.debug(F, 'created modthread');
      // Save the thread id to the user
      targetData.mod_thread_id = modThread.id;
      await usersUpdate(targetData);
    } else {
      // log.debug(F, 'did not create modthread');
    }
  }
  if(targetData.mod_thread_id) {
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
  return { embeds: [response] };
}

export async function userInfoEmbed(target:GuildMember, targetData:Users, command: string):Promise<EmbedBuilder> {
  const targetActionList = {
    NOTE: [] as string[],
    WARNING: [] as string[],
    REPORT: [] as string[],
    TIMEOUT: [] as string[],
    KICK: [] as string[],
    FULL_BAN: [] as string[],
    UNDERBAN: [] as string[],
    TICKET_BAN: [] as string[],
    DISCORD_BOT_BAN: [] as string[],
  };
  // Populate targetActionList from the db

  const targetActionListRaw = await useractionsGet(targetData.id);

  // log.debug(F, `targetActionListRaw: ${JSON.stringify(targetActionListRaw, null, 2)}`);

  // for (const action of targetActionListRaw) {
  targetActionListRaw.forEach(action => {
    // log.debug(F, `action: ${JSON.stringify(action, null, 2)}`);
    const actionString = `${action.type} (${time(action.created_at, 'R')}) - ${action.internal_note
      ?? 'No note provided'}`;
    // log.debug(F, `actionString: ${actionString}`);
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
