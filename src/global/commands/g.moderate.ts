import {
  time,
  Colors,
  ActionRowBuilder,
  ButtonBuilder,
  GuildMember,
  TextChannel,
  ChatInputCommandInteraction,
  Role,
  Guild,
  ModalSubmitInteraction,
  UserContextMenuCommandInteraction,
} from 'discord.js';
import {
  ButtonStyle,
} from 'discord-api-types/v10';
import {modActionDict} from '../@types/database.d';
import {stripIndents} from 'common-tags';
import {embedTemplate} from '../../discord/utils/embedTemplate';

import ms from 'ms';
import env from '../utils/env.config';
import logger from '../utils/logger';
import * as path from 'path';
const PREFIX = path.parse(__filename).name;

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
  timeout: {
    embedColor: Colors.Yellow,
    embedTitle: 'Timeout!',
    verb: 'timed out',
  },
  untimeout: {
    embedColor: Colors.Green,
    embedTitle: 'Untimeout!',
    verb: 'removed from time-out',
  },
  kick: {
    embedColor: Colors.Orange,
    embedTitle: 'Kicked!',
    verb: 'kicked',
  },
  ban: {
    embedColor: Colors.Red,
    embedTitle: 'Banned!',
    verb: 'banned',
  },
  unban: {
    embedColor: Colors.Green,
    embedTitle: 'Un-banned!',
    verb: 'un-banned',
  },
  underban: {
    embedColor: Colors.Blue,
    embedTitle: 'Underbanned!',
    verb: 'underbanned',
  },
  ununderban: {
    embedColor: Colors.Green,
    embedTitle: 'Un-Underbanned!',
    verb: 'un-underbanned',
  },
  warn: {
    embedColor: Colors.Yellow,
    embedTitle: 'Warned!',
    verb: 'warned',
  },
  note: {
    embedColor: Colors.Yellow,
    embedTitle: 'Note!',
    verb: 'noted',
  },
  report: {
    embedColor: Colors.Orange,
    embedTitle: 'Report!',
    verb: 'reported',
  },
  info: {
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

/**
 * Takes a user and performs a moderation action on them
 * @param {GuildMember} actor
 * @param {string} command
 * @param {GuildMember} target
 * @param {string | null} privReason
 * @param {string | null} pubReason
 * @param {number | null} duration
 * @param {ChatInputCommandInteraction} interaction
 */
export async function moderate(
  actor: GuildMember,
  command:string,
  target: GuildMember,
  privReason: string | null,
  pubReason: string | null,
  duration: number | null,
  interaction:ChatInputCommandInteraction | ModalSubmitInteraction | UserContextMenuCommandInteraction | undefined,
):Promise<any> {
  logger.debug(stripIndents`[${PREFIX}]
      Actor: ${actor}
      Command: ${command}
      Target: ${target}
      Duration: ${duration}
      PubReason: ${pubReason}
      PrivReason: ${privReason}
    `);

  // Determine if the actor is on the team
  // if (actor.roles) {
  //   // If you're unbanning a actor they wont have roles
  //   actor.roles.cache.forEach(async (role) => {
  //     if (teamRoles.includes(role.id)) {
  //       // Actor Team check - Only team members can use mod actions (except report)
  //       if (command !== 'report') {
  //         // logger.debug(`[${PREFIX}] actor is NOT a team member!`);
  //         return {content: stripIndents`Hey ${actor}, you need to be a team member to ${command}!`, ephemeral: true};
  //       }
  //     }
  //   });
  // }

  // Determine if the target is on the team
  // if (target.roles) {
  //   target.roles.cache.forEach(async (role) => {
  //     if (teamRoles.includes(role.id)) {
  //       // Target Team check - Only NON team members can be targeted by mod actions
  //       logger.debug(`[${PREFIX}] Target is a team member111!`);
  //       return {content: stripIndents`Hey ${actor}, you cannot ${command} a team member!`, ephemeral: true};
  //     }
  //   });
  // }

  // Send a message to the user
  /* eslint-disable max-len */
  if (command !== 'report' && command !== 'note' && command !== 'info') {
    const warnEmbed = embedTemplate()
      .setColor(embedVariables[command as keyof typeof embedVariables].embedColor)
      .setTitle(embedVariables[command as keyof typeof embedVariables].embedTitle)
      .setDescription(stripIndents`
    Hey ${target}, you have been ${embedVariables[command as keyof typeof embedVariables].verb}${duration && command === 'timeout' ? ` for ${ms(duration, {long: true})}` : ''} by Team TripSit:

    ${pubReason}

    **Do not message a moderator to talk about this!**
    
    ${command !== 'ban' && command !== 'underban' && command !== 'kick'?
    `You can respond to this bot and it will allow you to talk to the team privately!` :
    `You can send an email to appeals@tripsit.me to appeal this ban!`}
    Please read the rules and be respectful of them.

    https://tripsit.me/rules 
    `);
    if (command !== 'ban' && command !== 'underban' && command !== 'kick') {
      await target.user.send({embeds: [warnEmbed], components: [warnButtons]});
    } else {
      await target.user.send({embeds: [warnEmbed]});
    }
  }

  // Perform actions
  if (command === 'timeout') {
    try {
      target.timeout(duration, privReason ?? 'No reason provided');
    } catch (err) {
      logger.error(`[${PREFIX}] Error: ${err}`);
    }
  } else if (command === 'untimeout') {
    try {
      target.timeout(0, privReason ?? 'No reason provided');
      logger.debug(`[${PREFIX}] I untimeouted ${target.displayName} because\n '${privReason}'!`);
    } catch (err) {
      logger.error(`[${PREFIX}] Error: ${err}`);
    }
  } else if (command === 'kick') {
    try {
      target.kick();
    } catch (err) {
      logger.error(`[${PREFIX}] Error: ${err}`);
    }
  } else if (command === 'ban') {
    try {
      const targetGuild = await global.client.guilds.fetch(env.DISCORD_GUILD_ID);
      const deleteMessageValue = duration ?? 0;
      logger.debug(`[${PREFIX}] Days to delete: ${deleteMessageValue}`);
      targetGuild.members.ban(target, {deleteMessageSeconds: deleteMessageValue, reason: privReason ?? 'No reason provided'});
    } catch (err) {
      logger.error(`[${PREFIX}] Error: ${err}`);
    }
  } else if (command === 'unban') {
    try {
      const targetGuild = await global.client.guilds.fetch(env.DISCORD_GUILD_ID);
      await targetGuild.bans.fetch();
      await targetGuild.bans.remove(target.user, privReason ?? 'No reason provided');
    } catch (err) {
      logger.error(`[${PREFIX}] Error: ${err}`);
    }
  } else if (command === 'underban') {
    try {
      const targetGuild = await global.client.guilds.fetch(env.DISCORD_GUILD_ID);
      targetGuild.members.ban(target, {reason: privReason ?? 'No reason provided'});
    } catch (err) {
      logger.error(`[${PREFIX}] Error: ${err}`);
    }
  } else if (command === 'ununderban') {
    try {
      const targetGuild = await global.client.guilds.fetch(env.DISCORD_GUILD_ID);
      await targetGuild.bans.fetch();
      await targetGuild.bans.remove(target.user, privReason ?? 'No reason provided');
    } catch (err) {
      logger.error(`[${PREFIX}] Error: ${err}`);
    }
  }

  const targetActionCount = {
    timeout: 0,
    kick: 0,
    ban: 0,
    underban: 0,
    warn: 0,
    note: 0,
    report: 0,
  };
  const targetActionList = {
    timeout: [] as string[],
    kick: [] as string[],
    ban: [] as string[],
    underban: [] as string[],
    warn: [] as string[],
    note: [] as string[],
    report: [] as string[],
  };

  const actionData = {
    actor: actor.id,
    command: command,
    target: target.id,
    duration: duration,
    privReason: privReason,
    pubReason: pubReason,
  };
  let actions = {} as modActionDict;
  const ref = db.ref(`${env.FIREBASE_DB_USERS}/${target.id}/modActions/`);
  await ref.once('value', (data) => {
    if (data.val() !== null) {
      actions = data.val();
      actions[Date.now().valueOf().toString()] = actionData;
      Object.keys(actions).forEach(async (actionDate) => {
        const actionValue = actions[actionDate];
        const actionCommand = actionValue.command;
        if (actionCommand in targetActionCount) {
          targetActionCount[actionCommand as keyof typeof targetActionCount] += 1;
        }
        if (actionCommand in targetActionList) {
          // turn actionDate into a date object
          const actionDateObj = new Date(parseInt(actionDate));
          // Format the date into a short format
          const actionDateFormatted = actionDateObj.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          });
          const actionString = stripIndents`
            ${actionDateFormatted} by <@${actionValue.actor}>: ${actionValue.privReason} ${actionValue.pubReason ? `**PubReason: ${actionValue.pubReason}**` : ''}
          `;
          targetActionList[actionCommand as keyof typeof targetActionList].push(actionString);
        }
      });
    } else {
      actions[Date.now().valueOf().toString()] = actionData;
    }
    ref.set(actions);
  });

  // logger.debug(`[${PREFIX}] actions: ${JSON.stringify(actions)}`);
  logger.debug(`[${PREFIX}] targetActionCount: ${JSON.stringify(targetActionCount)}`);
  // logger.debug(`[${PREFIX}] targetActionList: ${JSON.stringify(targetActionList, null, 2)}`);

  const modlogEmbed = embedTemplate()
    // eslint-disable-next-line
    .setTitle(`${actor.displayName} ${embedVariables[command as keyof typeof embedVariables].verb} ${target.displayName} (${target.user.tag})${duration ? ` for ${ms(duration, {long: true})}` : ''}`)
    .setDescription(stripIndents`
    **PrivReason:** ${privReason ?? 'No reason provided'}
    ${pubReason ? `**PubReason:** ${pubReason}` : ''}
    `)
    .setColor(Colors.Blue)
    .addFields(
      {name: 'Created', value: `${time(target.user.createdAt, 'R')}`, inline: true},
      {name: 'Joined', value: `${target.joinedAt ? time(target.joinedAt!, 'R') : 'Unknown'}`, inline: true},
      {name: 'ID', value: `${target.id}`, inline: true},
      {name: '# of Reports', value: `${targetActionCount.report}`, inline: true},
      {name: '# of Warns', value: `${targetActionCount.warn}`, inline: true},
      {name: '# of Timeouts', value: `${targetActionCount.timeout}`, inline: true},
      // {name: '# of Kicks', value: `${targetActionCount.kick}`, inline: true},
      // {name: '# of Bans', value: `${targetActionCount.ban}`, inline: true},
      {name: '# of Notes', value: `${targetActionCount.note}`, inline: true},
      {name: '# of Tripsitmes', value: `TBD`, inline: true},
      // {name: '# of I\'m Good', value: `TBD`, inline: true},
      {name: '# of Fucks to Give', value: '0', inline: true},
      // {name: '\u200B', value: '\u200B', inline: true},
      // {name: 'Displayname', value: `${target.displayName}`, inline: true},
      // {name: 'Tag', value: `${target.user.tag}`, inline: true},
    );

  // Send the message to the mod channel
  if (command !== 'info') {
    const modChan = await global.client.channels.fetch(env.CHANNEL_MODERATORS) as TextChannel;
    // We must send the mention outside of the embed, cuz mentions dont work in embeds
    const tripsitGuild = await global.client.guilds.fetch(env.DISCORD_GUILD_ID) as Guild;
    const roleModerator = tripsitGuild.roles.cache.find((role:Role) => role.id === env.ROLE_MODERATOR) as Role;
    modChan.send({content: `${command !== 'note' ? `Hey ${roleModerator}` : ``}`, embeds: [modlogEmbed]});
    logger.debug(`[${PREFIX}] sent a message to the moderators room`);
  }

  // If this is the info command then return with info
  if (command === 'info') {
    let infoString = 'Squeaky clean!';
    infoString = stripIndents`
      ${targetActionList.ban.length > 0 ? `**Bans**\n${targetActionList.ban.join('\n')}` : ''}
      ${targetActionList.underban.length > 0 ? `**Underbans**\n${targetActionList.underban.join('\n')}` : ''}
      ${targetActionList.kick.length > 0 ? `**Kicks**\n${targetActionList.kick.join('\n')}` : ''}
      ${targetActionList.timeout.length > 0 ? `**Timeouts**\n${targetActionList.timeout.join('\n')}` : ''}
      ${targetActionList.warn.length > 0 ? `**Warns**\n${targetActionList.warn.join('\n')}` : ''}
      ${targetActionList.report.length > 0 ? `**Reports**\n${targetActionList.report.join('\n')}` : ''}
      ${targetActionList.note.length > 0 ? `**Notes**\n${targetActionList.note.join('\n')}` : ''}
    `;
    logger.debug(`[${PREFIX}] infoString: ${infoString}`);
    modlogEmbed.setDescription(infoString);
    try {
      logger.debug(`[${PREFIX}] returned info about ${target.displayName}`);
      return {embeds: [modlogEmbed], ephemeral: true};
    } catch (err) {
      logger.error(`[${PREFIX}] Error: ${err}`);
    }
  }

  // Send a message to the modlog room
  if (command !== 'info') {
    const modlog = await global.client.channels.fetch(env.CHANNEL_MODLOG) as TextChannel;
    modlog.send({embeds: [modlogEmbed]});
    logger.debug(`[${PREFIX}] sent a message to the modlog room`);
  }

  // Return a message to the user confirming the user was acted on
  logger.debug(`[${PREFIX}] ${target.displayName} has been ${embedVariables[command as keyof typeof embedVariables].verb}!`);
  const response = embedTemplate()
    .setColor(Colors.Yellow)
    .setDescription(`${target.displayName} has been ${embedVariables[command as keyof typeof embedVariables].verb}!`);
  return {embeds: [response], ephemeral: true};
};
