import {
  time,
  Colors,
  ActionRowBuilder,
  ButtonBuilder,
  GuildMember,
  TextChannel,
  ChatInputCommandInteraction,
  User,
  Role,
  Guild,
  ModalSubmitInteraction,
  UserContextMenuCommandInteraction,
} from 'discord.js';
import {
  ButtonStyle,
} from 'discord-api-types/v10';
import {stripIndents} from 'common-tags';
import {parseDuration} from '../utils/parseDuration';
import {embedTemplate} from '../../discord/utils/embedTemplate';
import ms from 'ms';
import env from '../utils/env.config';
import logger from '../utils/logger';
const PREFIX = require('path').parse(__filename).name;

let generalChannels = [];
let hrChannels = [] as string[];
let allChannels = [] as string[];

if (env.NODE_ENV === 'production') {
  generalChannels = [
    '#tripsitters',
    '#music',
    '#science',
    '#gaming',
    '#cooking',
    '#pets',
    '#creative',
    '#movies',
    '#opiates',
    '#depressants',
    '#dissociatives',
    '#psychedelics',
    '#stimulants',
    '#lounge',
    '#tripsitvip',
    '#gold-lounge',
    '#psychonaut',
    '#dissonaut',
    '#minecraft',
    '#recovery',
    '#compsci',
    '#tripsit-dev',
    '#content',
    '#teamtripsit',
    '#moderators',
    '#tripsit.me',
    '#modhaven',
    '#operations',
    '#emergency',
    '#meeting-room',
    '#drugs',
  ];
  hrChannels = [
    '#sanctuary',
    '#tripsit',
    '#tripsit1',
    '#tripsit2',
    '#tripsit3',
  ];
  allChannels = generalChannels.concat(hrChannels);
} else {
  generalChannels = [
    '#sandbox-dev',
  ];
  hrChannels = [];
  allChannels = generalChannels.concat(hrChannels);
}

const teamRoles = [
  env.ROLE_DIRECTOR,
  env.ROLE_SUCCESSOR,
  env.ROLE_SYSADMIN,
  env.ROLE_LEADDEV,
  env.ROLE_IRCADMIN,
  env.ROLE_DISCORDADMIN,
  env.ROLE_IRCOP,
  env.ROLE_MODERATOR,
  env.ROLE_TRIPSITTER,
  env.ROLE_TEAMTRIPSIT,
  env.ROLE_TRIPBOT2,
  env.ROLE_TRIPBOT,
  env.ROLE_BOT,
  env.ROLE_DEVELOPER,
];

const modButtons = new ActionRowBuilder()
    .addComponents(
        new ButtonBuilder()
            .setCustomId('warnbtn')
            .setLabel('Warn')
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId('timeoutbtn')
            .setLabel('Timeout')
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('kickbtn')
            .setLabel('Kick')
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('banbtn')
            .setLabel('Ban')
            .setStyle(ButtonStyle.Danger),
    );

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
 * Takes a user and returns information on them
 * @param {string | GuildMember} actor
 * @param {string} command
 * @param {string} target
 * @param {string} channel
 * @param {string} toggle
 * @param {string} reason
 * @param {string} duration
 * @param {ChatInputCommandInteraction} interaction
 */
export async function moderate(
    actor:string | GuildMember,
    command:string,
    target:string | GuildMember,
    channel:unknown,
    toggle:string | undefined,
    reason:string | undefined,
    duration:string | undefined,
    interaction:ChatInputCommandInteraction | ModalSubmitInteraction | UserContextMenuCommandInteraction | undefined,
):Promise<any> {
  logger.debug(stripIndents`[${PREFIX}]
      Actor: ${actor}
      Command: ${command}
      Toggle: ${toggle}
      Target: ${target}
      Channel: ${channel}
      Duration: ${duration}
      Reason: ${reason}
    `);

  let minutes = 604800000;

  // Get actor object
  const [
    // actorUser,
    actorUsername,
    actorPlatform,
    actorNickname,
    actorId,
    actorIsTeamMember,
  ] = await determineUserInfo(actor);

  // logger.debug(`[${PREFIX}] actorUser: ${JSON.stringify(actorUser, null, 2)}`);
  logger.debug(`[${PREFIX}] actorNickname: ${actorNickname}`);
  logger.debug(`[${PREFIX}] actorId: ${actorId}`);
  logger.debug(`[${PREFIX}] actorPlatform: ${actorPlatform}`);
  logger.debug(`[${PREFIX}] actorUsername: ${actorUsername}`);
  logger.debug(`[${PREFIX}] actorIsTeamMember: ${actorIsTeamMember}`);

  // Actor Team check - Only team members can use mod actions (except report)
  if (!actorIsTeamMember && command !== 'report') {
    logger.debug(`[${PREFIX}] actor is NOT a team member!`);
    return stripIndents`Hey ${actor}, you need to be a team member to ${command}!`;
  }

  // Get target object
  const [
    targetUser,
    targetUsername,
    targetNickname,
    targetId,
    targetPlatform,
    targetIsTeamMember,
  ] = await determineUserInfo(target);
  logger.debug(`[${PREFIX}] targetUser: ${JSON.stringify(targetUser, null, 2)}`);

  if (!targetUser) {
    return `[${PREFIX}] Target not found!`;
  }

  // Target Team check - Cannot be run on team members
  if (targetIsTeamMember && command !== 'report') {
    logger.debug(`[${PREFIX}] Target is a team member!`);
    return stripIndents`Hey ${actor}, you cannot ${command} a team member!`;
  }
  logger.debug(`[${PREFIX}] targetPlatform: ${targetPlatform}`);
  logger.debug(`[${PREFIX}] targetUsername: ${targetUsername}`);
  logger.debug(`[${PREFIX}] targetIsTeamMember: ${targetIsTeamMember}`);

  // Get channel object
  let targetChannel = {} as TextChannel;
  if (channel) {
    if ((channel as TextChannel).guild) {
      // If the query is an object and has the userId property, it's a discord user
      logger.debug(`[${PREFIX}] Channel given is already channel object!`);
      targetChannel = channel as TextChannel;
    } else if ((channel as string).startsWith('<#') && (channel as string).endsWith('>')) {
      // Discord channel mentions start with <#
      const targetGuild = await interaction!.client.guilds.fetch(env.DISCORD_GUILD_ID);
      targetChannel = await targetGuild.channels.fetch((channel as string).slice(2, -1)) as TextChannel;
    }
    logger.debug(`[${PREFIX}] targetChannel: ${JSON.stringify(targetChannel, null, 2)}`);
    logger.debug(`[${PREFIX}] targetChannel: ${targetChannel.name}`);
  }

  // Get duration
  if (duration) {
    minutes = duration ?
        await parseDuration(duration) :
        604800000;
    logger.debug(`[${PREFIX}] minutes: ${minutes}`);
  }

  logger.debug(`[${PREFIX}] command: ${command}`);
  logger.debug(`[${PREFIX}] targetPlatform: ${targetPlatform}`);
  logger.debug(`[${PREFIX}] duration: ${duration}`);
  if (command === 'warn') {
    if (targetPlatform === 'discord') {
      const warnEmbed = embedTemplate()
          .setColor(Colors.Yellow)
          .setTitle('Warning!')
          .setDescription(stripIndents`
        You have been warned by Team TripSit:

        ${reason}

        Please read the rules and be respectful of them.

        Contact a TripSit Team Member if you have any questions!`);
      try {
        await (targetUser as User).send({embeds: [warnEmbed], components: [warnButtons]});
      } catch (err) {
        logger.error(`[${PREFIX}] Error: ${err}`);
      }
    }
    if (targetPlatform === 'irc') {
      logger.debug(`[${PREFIX}] Warning on IRC!`);
      const warnMessage = stripIndents`
          You have warned by Team TripSit:

          ${reason}

          Please read the rules and be respectful of them.

          Contact a TripSit Team Member if you have any questions!`;
      logger.debug(`[${PREFIX}] warnMessage: ${warnMessage}`);
      logger.debug(`[${PREFIX}] targetNickname: ${targetNickname}`);
      try {
        global.ircClient.say(targetNickname, warnMessage);
      } catch (err) {
        logger.error(`[${PREFIX}] Error: ${err}`);
      }
    }
  } else if (command === 'timeout') {
    if (targetPlatform === 'discord') {
      if (toggle === 'on' || toggle === null) {
        try {
          // The length of the timout defaults to 1 week if no time is given

          logger.debug(`[${PREFIX}] timeout minutes: ${minutes}`);
          targetUser.timeout(minutes, reason);
          await targetUser.send(
              `You have been quieted for ${ms(minutes, {long: true})}${reason ? ` because:\n ${reason}` : ''} `);
        } catch (err) {
          logger.error(`[${PREFIX}] Error: ${err}`);
        }
      } else {
        try {
          await targetUser.send(`You have been unquieted because:\n${reason}`);
          targetUser.timeout(0, reason);
          logger.debug(`[${PREFIX}] I untimeouted ${targetUsername} because\n '${reason}'!`);
        } catch (err) {
          logger.error(`[${PREFIX}] Error: ${err}`);
        }
      }
    }
    if (targetPlatform === 'irc') {
      if (toggle === 'on' || toggle === null) {
        // eslint-disable-next-line no-restricted-syntax
        for (const ircChannel of allChannels) {
          try {
            global.ircClient.send('MODE', ircChannel, '+q', `*@${targetId}`);
          } catch (err) {
            logger.error(`[${PREFIX}] ${err}`);
          }
        }
        try {
          global.ircClient.say(targetNickname,
              `You have been quieted for ${ms(minutes, {long: true})}${reason ? ` because:\n ${reason}` : ''} `);
        } catch (err) {
          logger.error(`[${PREFIX}] Error: ${err}`);
        }
      } else {
        // eslint-disable-next-line no-restricted-syntax
        for (const ircChannel of allChannels) {
          try {
            global.ircClient.send('MODE', ircChannel, '-q', `*@${targetId}`);
          } catch (err) {
            logger.error(`[${PREFIX}] ${err}`);
          }
        }
        try {
          global.ircClient.say(targetNickname, `You have been unquieted because:\n${reason}`);
        } catch (err) {
          logger.error(`[${PREFIX}] Error: ${err}`);
        }
      }
    }
  } else if (command === 'kick') {
    if (targetPlatform === 'discord') {
      try {
        await targetUser.send(`You have been kicked because\n ${reason}`);
        targetUser.kick();
      } catch (err) {
        logger.error(`[${PREFIX}] Error: ${err}`);
      }
    }
    if (targetPlatform === 'irc') {
      // eslint-disable-next-line no-restricted-syntax
      for (const ircChannel of allChannels) {
        try {
          global.ircClient.send('KICK', ircChannel, targetNickname, reason);
        } catch (err) {
          logger.error(`[${PREFIX}] ${err}`);
        }
      }
      try {
        global.ircClient.say(targetNickname, `You have been kicked because:\n${reason}`);
      } catch (err) {
        logger.error(`[${PREFIX}] Error: ${err}`);
      }
    }
  } else if (command === 'ban') {
    // IRCCloud
    // if you do that: its basically only an sqline + a kill
    if (targetPlatform === 'discord') {
      if (toggle === 'on' || toggle === null) {
        try {
          // The length of the timout defaults to forever if no time is given
          minutes = duration ?
              await parseDuration(duration) :
              0;
          logger.debug(`[${PREFIX}] minutes: ${minutes}`);
          const targetGuild = await global.client.guilds.fetch(env.DISCORD_GUILD_ID);
          targetGuild.members.ban(targetUser, {deleteMessageDays: 7, reason});
          await targetUser.send(
              `You have been banned ${minutes ? `for ${ms(minutes, {long: true})}` : ''}\
            ${reason ? ` because\n ${reason}` : ''} `);
        } catch (err) {
          logger.error(`[${PREFIX}] Error: ${err}`);
        }
      } else {
        try {
          logger.debug(`[${PREFIX}] targetUser.id: ${targetUser.id}`);
          const targetGuild = await global.client.guilds.fetch(env.DISCORD_GUILD_ID);
          const bans = await targetGuild.bans.fetch();
          logger.debug(`[${PREFIX}] targetGuild.bans.fetch(): ${bans}`);
          await targetGuild.bans.remove(targetUser, reason);
          logger.debug(`[${PREFIX}] I unbanned ${targetUsername}!`);
          targetUser.send(`You have been unbanned for ${reason}`);
        } catch (err) {
          logger.error(`[${PREFIX}] Error: ${err}`);
        }
      }
    }
    if (targetPlatform === 'irc') {
      if (toggle === 'on' || toggle === null) {
        // Just go straight for the akill
        global.ircClient.say(targetNickname,
            `You have been banned for ${ms(minutes, {long: true})}${reason ? ` because:\n ${reason}` : ''} `);

        const ircCommand = `akill add ${targetId} !P ${reason}`;
        global.ircClient.say('operserv', ircCommand);
        global.ircClient.say('#sandbox-dev', ircCommand);

        // Kickban just in case
        // eslint-disable-next-line no-restricted-syntax
        for (const banChannel of allChannels) {
          try {
            global.ircClient.send('KICK', banChannel, targetNickname);
            global.ircClient.send('MODE', banChannel, '+b', `*@${targetId}`);
          } catch (err) {
            logger.error(`[${PREFIX}] ${err}`);
          }
        }
      } else {
        try {
          global.ircClient.say(targetNickname, `You have been unbanned ${reason ? ` because:\n ${reason}` : ''} `);
        } catch (err) {
          logger.error(`[${PREFIX}] User may not be in the irc`);
        }

        const ircCommand = `akill del ${targetId}`;
        global.ircClient.say('operserv', ircCommand);
        global.ircClient.say('#sandbox-dev', ircCommand);

        // Unban just in case
        // eslint-disable-next-line no-restricted-syntax
        for (const unbanChannel of allChannels) {
          try {
            global.ircClient.send('MODE', unbanChannel, '-b', `*@${targetId}`);
          } catch (err) {
            logger.error(`[${PREFIX}] ${err}`);
          }
        }
      }
    }
  }
  // else if (command === 'underban') {
  //   if (targetPlatform === 'discord') {
  //     if (toggle === 'on' || toggle === null) {
  //       try {
  //         logger.debug(`[${PREFIX}] I would underban on discord`);
  //         await targetUser.send(`You have been underbanned for
  // ${ms(minutes, { long: true })}${reason ? ` because:\n ${reason}` : ''} `);
  //       } catch (err) {
  //         logger.error(`[${PREFIX}] Error: ${err}`);
  //       }
  //     } else {
  //       try {
  //         logger.debug(`[${PREFIX}] I would remove underban on discord`);
  //         await targetUser.send(`The underban has been removed because:\n${reason}`);
  //       } catch (err) {
  //         logger.error(`[${PREFIX}] Error: ${err}`);
  //       }
  //     }
  //   }
  //   if (targetPlatform === 'irc') {
  //     if (toggle === 'on' || toggle === null) {
  //       // eslint-disable-next-line no-restricted-syntax
  //       for (const ircChannel of allChannels) {
  //         try {
  //           logger.debug(`[${PREFIX}] I would underban on irc`);
  //         } catch (err) {
  //           logger.error(`[${PREFIX}] ${err}`);
  //         }
  //       }
  //       global.ircClient.say(targetNickname, `You have been underbanned
  // for ${ms(minutes, { long: true })}${reason ? ` because:\n ${reason}` : ''} `);
  //     } else {
  //       // eslint-disable-next-line no-restricted-syntax
  //       for (const ircChannel of allChannels) {
  //         try {
  //           global.ircClient.send('MODE', ircChannel, '-q', `*@${targetId}`);
  //         } catch (err) {
  //           logger.error(`[${PREFIX}] ${err}`);
  //         }
  //       }
  //       try {
  //         global.ircClient.say(targetNickname, `You have been unquieted because:\n${reason}`);
  //       } catch (err) {
  //         logger.error(`[${PREFIX}] Error: ${err}`);
  //       }
  //     }
  //   }
  //   logger.debug(`[${PREFIX}] underban`);
  //   // eslint-disable-next-line no-restricted-syntax
  //   for (const channel of hrChannels) {
  //     global.ircClient.send('KICK', channel, target);
  //     global.ircClient.send('MODE', channel, '+b', `*@${target.host}`);
  //   }
  // } else if (command === 'say') {
  //   logger.debug(`[${PREFIX}] say`);
  //   // async function say(target, quote) {
  //   //   logger.debug(`[${PREFIX}] Saying ${quote} to ${target}`);
  //   //   global.ircClient.say(target, quote);
  //   // }
  // } else if (command === 'invite') {
  //   logger.debug(`[${PREFIX}] say`);
  //   async function invite(target, channel) {
  //     global.ircClient.send('INVITE', target.nick, channel);
  //     // global.ircClient.say('#sandbox-dev', `'INVITE', ${channel}, ${target.host}`);
  //   }
  // } else if (command === 'shadowquiet') {
  //   async function shadowquiet(target) {
  //     // eslint-disable-next-line no-restricted-syntax
  //     for (const channel of allChannels) {
  //       global.ircClient.send('MODE', channel, '+q', `*@${target.host}`);
  //       global.ircClient.send('MODE', channel, '+z', `*@${target.host}`);
  //     }
  //   }
  //   logger.debug(`[${PREFIX}] say`);
  // } else if (command === 'rename') {
  //   logger.debug(`[${PREFIX}] rename`);
  //   // Needs operator privileges
  //   // async function rename(target, newNick) {
  //   //   const command = `SVSNICK ${target.nick} ${newNick}`;
  //   //   global.ircClient.say('operserv', command);
  //   //   global.ircClient.say('#sandbox-dev', command);
  //   // }
  // } else if (command === 'announce') {
  //   logger.debug(`[${PREFIX}] announce`);
  //   // async function announce(quote) {
  //   //   // eslint-disable-next-line no-restricted-syntax
  //   //   for (const channel of allChannels) {
  //   //     global.ircClient.say(channel, '<><><> Global message from Team TripSit! <><><>');
  //   //     global.ircClient.say(channel, quote);
  //   //   }
  //   // }
  // }

  // Get the moderator role
  const tripsitGuild = await global.client.guilds.fetch(env.DISCORD_GUILD_ID) as Guild;
  const roleModerator = tripsitGuild.roles.cache.find((role:Role) => role.id === env.ROLE_MODERATOR) as Role;

  // Extract targetUser data
  // const [targetData, targetFbid] = await getUserInfo(targetUser);
  // const targetAction = `received_${command}`;
  // const targetModActions = targetData.modActions ? targetData.modActions : {};
  // logger.debug(`[${PREFIX}] targetModActions: ${JSON.stringify(targetModActions, null, 2)}`);
  const targetEmbed = embedTemplate()
      .setColor(Colors.Blue)
      .setDescription(`${actor} ${command}ed ${targetNickname}\
      ${targetChannel ? ` in ${targetChannel}` : ''}\
      ${duration ? ` for ${ms(minutes, {long: true})}` : ''}\
      ${reason ? ` because\n ${reason}` : ''}`)
      .addFields(
          {name: 'Nickname', value: `${targetNickname}`, inline: true},
          {name: 'Username', value: `${targetUsername}`, inline: true},
          {name: 'ID', value: `${targetId}`, inline: true},
      );
  if (targetPlatform === 'discord') {
    targetEmbed.addFields(
        {
          name: 'Account created',
          value: `${(targetUser as GuildMember).user ? time(targetUser.user.createdAt, 'R') :
          time(targetUser.createdAt, 'R')}`, inline: true},
        {name: 'Joined', value: `${time(targetUser.joinedAt, 'R')}`, inline: true},
        // { name: 'Timeout until', value: `${targetUser.communicationDisabledUntil
        // ? time(targetUser.communicationDisabledUntil, 'R') : 'Not Timeouted'}`, inline: true },
    );
  }
  // .addFields(
  //   { name: '# of Reports', value: `${targetModActions.received_report
  // ? targetModActions.received_report.length : 0}`, inline: true },
  //   { name: '# of Timeouts', value: `${targetModActions.received_timeout
  // ? targetModActions.received_timeout.length : 0}`, inline: true },
  //   { name: '# of Warns', value: `${targetModActions.received_warn
  // ? targetModActions.received_warn.length : 0}`, inline: true },
  // )
  // .addFields(
  //   { name: '# of Kicks', value: `${targetModActions.received_kick
  // ? targetModActions.received_kick.length : 0}`, inline: true },
  //   { name: '# of Bans', value: `${targetModActions.received_ban
  // ? targetModActions.received_ban.length : 0}`, inline: true },
  //   { name: '# of Notes', value: `${targetModActions.received_note
  // ? targetModActions.received_note.length : 0}`, inline: true },
  // )
  // .addFields(
  //   { name: '# of Tripsitmes', value: `${targetModActions.received_tripsitme
  // ? targetModActions.received_tripsitme : 0}`, inline: true },
  //   { name: '# of I\'m Good', value: `${targetModActions.received_imgood
  // ? targetModActions.received_imgood : 0}`, inline: true },
  //   { name: '# of Fucks to Give', value: '0', inline: true },
  // );

  if (command === 'info') {
    if (targetPlatform === 'discord') {
      try {
        const reply = {embeds: [targetEmbed], ephemeral: true, components: [modButtons]};
        logger.debug(`[${PREFIX}] replied to user ${actor} with info about ${targetUser}`);
        logger.debug(`[${PREFIX}] finished!`);
        return reply;
      } catch (err) {
        logger.error(`[${PREFIX}] Error: ${err}`);
      }
    }
    if (targetPlatform === 'irc') {
      try {
        global.ircClient.say('tripbot', `${env.IRC_BOTPREFIX}${command} ${targetUsername}`);
        global.ircClient.say('#sandbox', `Sent: ${env.IRC_BOTPREFIX}${command} ${targetUsername}`);
        return;
      } catch (err) {
        logger.error(`[${PREFIX}] Error: ${err}`);
      }
    }
  }

  logger.debug(`[${PREFIX}] CHANNEL_MODERATORS: ${env.CHANNEL_MODERATORS}`);
  const modChan = await global.client.channels.fetch(env.CHANNEL_MODERATORS) as TextChannel;
  // We must send the mention outside of the embed, cuz mentions dont work in embeds
  modChan.send(`Hey <@&${roleModerator.id}>!`);
  modChan.send({embeds: [targetEmbed]});
  logger.debug(`[${PREFIX}] send a message to the moderators room`);

  // const now = new Date().toString();
  // const targetModAction = {
  //   [now]: {
  //     actor: (actor as GuildMember).id,
  //     target: targetUser.id,
  //     command,
  //   },
  // };
  // if (reason) {
  //   targetModAction[now].reason = reason;
  // }
  // if (duration) {
  //   targetModAction[now].duration = duration;
  // }
  // if (targetChannel) {
  //   targetModAction[now].targetChannel = targetChannel.toString();
  // }

  // logger.debug(`[${PREFIX}] targetModAction: ${JSON.stringify(targetModAction, null, 2)}`);
  // logger.debug(`[${PREFIX}] targetAction: ${targetAction}`);
  // if ('modActions' in targetData) {
  //   if (targetAction in targetData.modActions) {
  //     logger.debug(`[${PREFIX}] targetAction in targetData.modActions`);
  //     targetData.modActions[targetAction].push(targetModAction);
  //   } else {
  //     logger.debug(`[${PREFIX}] targetAction not in targetData.modActions`);
  //     targetData.modActions[targetAction] = [targetModAction];
  //   }
  // } else {
  //   logger.debug(`[${PREFIX}] modActions not in targetData`);
  //   targetData.modActions = {
  //     [targetAction]: [targetModAction],
  //   };
  // }

  // // Load targetUser data
  // await setUserInfo(targetFbid, targetData);

  // // // Extract actor data
  // const actorAction = `${command}_received`;

  // const actorModAction = {
  //   [now]: {
  //     actor: actor.id,
  //     target: targetUser.id,
  //   },
  // };
  // if (reason) {
  //   actorModAction[now].reason = reason;
  // }
  // if (duration) {
  //   actorModAction[now].duration = duration;
  // }
  // if (targetChannel) {
  //   actorModAction[now].targetChannel = targetChannel.id;
  // }

  // // Extract actorData data
  // const [actorData, actorFbid] = await getUserInfo(actorUser);

  // if ('modActions' in actorData) {
  //   if (actorAction in actorData.modActions) {
  //     logger.debug(`[${PREFIX}] actorAction in actorData.modActions`);
  //     actorData.modActions[actorAction].push(actorModAction);
  //   } else {
  //     logger.debug(`[${PREFIX}] actorAction not in actorData.modActions`);
  //     actorData.modActions[actorAction] = [actorModAction];
  //   }
  // } else {
  //   logger.debug(`[${PREFIX}] modActions not in actorData`);
  //   actorData.modActions = {
  //     [actorAction]: [actorModAction],
  //   };
  // }

  // // // Load actor data
  // await setUserInfo(actorFbid, actorData);

  // logger.debug(`[${PREFIX}] finished!`);
  return `${targetNickname} has been ${command}ed!`;
};

/**
 * Takes a user and returns information on them
 * @param {any} query A user object or a string of a user's ID
 * @return {string[]} A list of properties about this user
 */
async function determineUserInfo(
    query:GuildMember | string,
):Promise<any[]> {
  let userInfo:GuildMember | User | string = '';
  let userPlatform = null;
  let userNickname = null;
  let userUsername = null;
  let userId = null;
  let userIsTeamMember = false;
  logger.debug(`[${PREFIX}] Query: ${typeof query}`);
  logger.debug(`[${PREFIX}] Query: ${query}`);
  logger.debug(`[${PREFIX}] Query: ${JSON.stringify(query, null, 2)}`);

  if (query === 'The community') {
    logger.debug(`[${PREFIX}] Community!`);
    userInfo = 'The community';
    userUsername = 'The community';
    userPlatform = 'discord';
    userNickname = 'The community';
    userId = 'The community';
    userIsTeamMember = true;
    return [userInfo, userNickname, userUsername, userId, userPlatform, userIsTeamMember.toString()];
  }

  // logger.debug(`[${PREFIX}] Query.userId: ${query.guildId}`);

  if ((query as GuildMember).guild) {
    // If the query is an object and has the userId property, it's a discord user
    logger.debug(`[${PREFIX}] Query is already discord member object`);
    userPlatform = 'discord';
    userInfo = query as GuildMember;
    userNickname = (query as GuildMember).nickname;
    userUsername = (query as GuildMember).user.username;
    userId = (query as GuildMember).user.id;
  } else if ((query as string).startsWith('<@') && (query as string).endsWith('>')) {
    // If the query string starts with a <@ and ends with > then it's likely a discord user
    logger.debug(`[${PREFIX}] Query is a discord mention`);
    logger.debug(`[${PREFIX}] Query userId: ${(query as string).slice(2, -1)}`);
    try {
      const tripsitGuild = await global.client.guilds.fetch(env.DISCORD_GUILD_ID);
      userInfo = await tripsitGuild.members.fetch((query as string).slice(2, -1)) as GuildMember;
      userPlatform = 'discord';
      userNickname = userInfo.displayName;
      userUsername = userInfo.user.username;
      userId = userInfo.id;
    } catch (err) {
      logger.error(`[${PREFIX}] Error fetching discord user: ${err}`);
      userInfo = await global.client.users.fetch((query as string).slice(2, -1)) as User;
      userPlatform = 'discord';
      userNickname = userInfo.username;
      userUsername = userInfo.username;
      userId = userInfo.id;
    }
  }
  // else {
  //   // Do a whois lookup to the user
  //   let data = null;
  //   await global.ircClient.whois(query, async (resp) => {
  //     data = resp;
  //   });

  //   // This is a hack substanc3 helped create to get around the fact that the whois command
  //   // is asyncronous by default, so we need to make this syncronous
  //   while (data === null) {
  //       await new Promise(resolve => setTimeout(resolve, 100)); // eslint-disable-line
  //   }
  //   // logger.debug(`[${PREFIX}] data ${JSON.stringify(data, null, 2)}`);
  //   if (!data.host) {
  //     const embed = template.embedTemplate();
  //     logger.debug(`[${PREFIX}] ${query} not found on IRC`);
  //     embed.setDescription(stripIndents`
  // ${query} is not found on IRC, did you spell that right?`);
  //     const reply = {embeds: [embed], ephemeral: true};
  //     return reply;
  //   }
  //   userInfo = data;
  //   userPlatform = 'irc';
  //   userNickname = data.user;
  //   userUsername = data.nick;
  //   userId = data.host;
  // }
  // logger.debug(`[${PREFIX}] userInfo: ${JSON.stringify(userInfo, null, 2)}`);
  // logger.debug(`[${PREFIX}] userPlatform: ${userPlatform}`);

  // Determine if the user is on the team
  if (userPlatform === 'discord') {
    // If you're unbanning a user they wont have roles
    if ((userInfo as GuildMember).roles) {
      (userInfo as GuildMember).roles.cache.forEach(async (role) => {
        if (teamRoles.includes(role.id)) {
          userIsTeamMember = true;
        }
      });
    }
  }
  // if (userPlatform === 'irc') {
  //   logger.debug(`[${PREFIX}] userPlatform: ${userPlatform}`);
  //   if (userInfo.host) {
  //     const role = userInfo.host.split('/')[1];
  //     logger.debug(`[${PREFIX}] role: ${role}`);
  //     const ircTeamRoles = [
  //       'founder',
  //       'operator',
  //       'admin',
  //       'sysop',
  //       'moderator',
  //       'tripsitter',
  //       'helper',
  //       'guardian',
  //     ];
  //     if (ircTeamRoles.includes(role)) {
  //       userIsTeamMember = true;
  //     }
  //   }
  // }
  return [userInfo, userNickname, userUsername, userId, userPlatform, userIsTeamMember];
}
