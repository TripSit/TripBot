'use strict';

const PREFIX = require('path').parse(__filename).name;
const ms = require('ms');
const { time } = require('@discordjs/builders');
const { MessageActionRow, MessageButton } = require('discord.js');
const { stripIndents } = require('common-tags/lib');
const logger = require('./logger');
const template = require('../../discord/utils/embed-template');
const { getUserInfo, setUserInfo } = require('../services/firebaseAPI');
const parseDuration = require('./parseDuration');

const {
  NODE_ENV,
  channelModeratorsId,
  discordGuildId,
} = require('../../../env');

const botPrefix = NODE_ENV === 'production' ? '~' : '-';

let generalChannels = [];
let hrChannels = [];
let allChannels = [];

if (NODE_ENV === 'production') {
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

const {
  roleDirectorId,
  roleSuccessorId,
  roleSysadminId,
  roleLeaddevId,
  roleIrcadminId,
  roleDiscordadminId,
  roleIrcopId,
  roleModeratorId,
  roleTripsitterId,
  roleTeamtripsitId,
  roleTripbotId,
  roleTripbot2Id,
  roleBotId,
  roleDeveloperId,
} = require('../../../env');

const teamRoles = [
  roleDirectorId,
  roleSuccessorId,
  roleSysadminId,
  roleLeaddevId,
  roleIrcadminId,
  roleDiscordadminId,
  roleIrcopId,
  roleModeratorId,
  roleTripsitterId,
  roleTeamtripsitId,
  roleTripbot2Id,
  roleTripbotId,
  roleBotId,
  roleDeveloperId,
];

const modButtons = new MessageActionRow()
  .addComponents(
    new MessageButton()
      .setCustomId('warnbtn')
      .setLabel('Warn')
      .setStyle('PRIMARY'),
    new MessageButton()
      .setCustomId('timeoutbtn')
      .setLabel('Timeout')
      .setStyle('SECONDARY'),
    new MessageButton()
      .setCustomId('kickbtn')
      .setLabel('Kick')
      .setStyle('SECONDARY'),
    new MessageButton()
      .setCustomId('banbtn')
      .setLabel('Ban')
      .setStyle('DANGER'),
  );

const warnButtons = new MessageActionRow().addComponents(
  new MessageButton()
    .setCustomId('acknowledgebtn')
    .setLabel('I understand, it wont happen again!')
    .setStyle('PRIMARY'),
  new MessageButton()
    .setCustomId('refusalbtn')
    .setLabel('Nah, I do what I want!')
    .setStyle('DANGER'),
);

async function determineUserInfo(query) {
  const tripsitGuild = await global.client.guilds.fetch(discordGuildId);

  let userInfo = null;
  let userPlatform = null;
  let userNickname = null;
  let userUsername = null;
  let userId = null;
  logger.debug(`[${PREFIX}] Query: ${typeof query}`);
  // logger.debug(`[${PREFIX}] Query: ${JSON.stringify(query.guild, null, 2)}`);

  // logger.debug(`[${PREFIX}] Query.userId: ${query.guildId}`);

  if (query.guild) {
    // If the query is an object and has the userId property, it's a discord user
    logger.debug(`[${PREFIX}] Query is already discord member object`);
    userInfo = query;
    userPlatform = 'discord';
    userNickname = userInfo.nickname || userInfo.displayName;
    userUsername = userInfo.user.username;
    userId = userInfo.id;
  } else if (query.startsWith('<@') && query.endsWith('>')) {
    // If the query string starts with a <@ and ends with > then it's likely a discord user
    logger.debug(`[${PREFIX}] Query is a discord mention`);
    try {
      userInfo = await tripsitGuild.members.fetch(query.slice(3, -1));
      userPlatform = 'discord';
      userNickname = userInfo.displayName;
    } catch (err) {
      logger.error(`[${PREFIX}] Error fetching discord member: ${err}`);
      userInfo = await global.client.users.fetch(query.slice(3, -1));
      userPlatform = 'discord';
      userNickname = userInfo.nickname;
      userUsername = userInfo.user.username;
      userId = userInfo.id;
    }
  } else {
    // Do a whois lookup to the user
    let data = null;
    await global.ircClient.whois(query, async resp => {
      data = resp;
    });

    // This is a hack substanc3 helped create to get around the fact that the whois command
    // is asyncronous by default, so we need to make this syncronous
    while (data === null) {
        await new Promise(resolve => setTimeout(resolve, 100)); // eslint-disable-line
    }
    // logger.debug(`[${PREFIX}] data ${JSON.stringify(data, null, 2)}`);
    if (!data.host) {
      const embed = template.embedTemplate();
      logger.debug(`[${PREFIX}] ${query} not found on IRC`);
      embed.setDescription(stripIndents`
  ${query} is not found on IRC, did you spell that right?`);
      const reply = { embeds: [embed], ephemeral: true };
      return reply;
    }
    userInfo = data;
    userPlatform = 'irc';
    userNickname = data.user;
    userUsername = data.nick;
    userId = data.host;
  }
  // logger.debug(`[${PREFIX}] userInfo: ${JSON.stringify(userInfo, null, 2)}`);
  // logger.debug(`[${PREFIX}] userPlatform: ${userPlatform}`);

  // Determine if the user is on the team
  let userIsTeamMember = false;
  if (userPlatform === 'discord') {
    // If you're unbanning a user they wont have roles
    if (userInfo.roles) {
      userInfo.roles.cache.forEach(async role => {
        if (teamRoles.includes(role.id)) {
          userIsTeamMember = true;
        }
      });
    }
  }
  if (userPlatform === 'irc') {
    if (userInfo.account) {
      const role = userInfo.account.split('\\')[1];
      const ircTeamRoles = [
        'founder',
        'operator',
        'admin',
        'sysop',
        'moderator',
        'tripsitter',
        'helper',
        'guardian',
      ];
      if (ircTeamRoles.includes(role)) {
        userIsTeamMember = true;
      }
    }
  }
  return [userInfo, userNickname, userUsername, userId, userPlatform, userIsTeamMember];
}

module.exports = {
  async moderate(actor, command, target, channel, toggle, reason, duration) {
    logger.debug(stripIndents`[${PREFIX}]
      Actor: ${actor}
      Command: ${command}
      Toggle: ${toggle}
      Target: ${target}
      Channel: ${channel}
      Duration: ${duration}
      Reason: ${reason}
    `);

    let minutes = null;

    // Get actor object
    const [
      actorUser,
      actorUsername,
      actorPlatform,
      // actorNickname,
      // actorId,
      actorIsTeamMember,
    ] = await determineUserInfo(actor);
    // logger.debug(`[${PREFIX}] actorUser: ${JSON.stringify(actorUser, null, 2)}`);
    logger.debug(`[${PREFIX}] actorPlatform: ${actorPlatform}`);
    logger.debug(`[${PREFIX}] actorUsername: ${actorUsername}`);

    // Extract actorData data
    const [actorData, actorFbid] = await getUserInfo(actorUser);

    // Actor Team check - Only team members can use mod actions (except report)
    if (!actorIsTeamMember && command !== 'report') {
      logger.debug(`[${PREFIX}] actor is NOT a team member!`);
      const teamMessage = stripIndents`
             Hey ${actor}, you need to be a team member to do that!`;
      const embed = template.embedTemplate()
        .setColor('DARK_BLUE')
        .setDescription(teamMessage);
      return { embeds: [embed], ephemeral: true };
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
      const embed = template.embedTemplate()
        .setColor('RED')
        .setDescription('Target not found?');
      logger.debug(`[${PREFIX}] Target not found!`);
      const reply = { embeds: [embed], ephemeral: true };
      return reply;
    }

    // Target Team check - Cannot be run on team members
    if (targetIsTeamMember) {
      logger.debug(`[${PREFIX}] Target is a team member!`);
      const teamMessage = stripIndents`
                Hey ${actor}, ${targetUser.user.username} is a team member!
                Did you mean to do that?`;
      const embed = template.embedTemplate()
        .setColor('DARK_BLUE')
        .setDescription(teamMessage);
      return { embeds: [embed], ephemeral: true };
    }

    logger.debug(`[${PREFIX}] targetPlatform: ${targetPlatform}`);
    logger.debug(`[${PREFIX}] targetUsername: ${targetUsername}`);

    // Extract targetUser data
    const [targetData, targetFbid] = await getUserInfo(targetUser);

    // Get channel object
    let targetChannel = null;
    if (channel) {
      if (channel.startsWith('<#') && channel.endsWith('>')) {
        // Discord channels start with <#
        const targetGuild = await global.client.guilds.fetch(discordGuildId);
        targetChannel = await targetGuild.channels.fetch(channel.slice(2, -1));
      }
      logger.debug(`[${PREFIX}] targetChannel: ${JSON.stringify(targetChannel, null, 2)}`);
      logger.debug(`[${PREFIX}] targetChannel: ${targetChannel.name}`);
    }

    // Get duration
    minutes = duration
      ? await parseDuration.execute(duration)
      : 604800000;

    if (command === 'warn') {
      if (targetPlatform === 'discord') {
        const warnEmbed = template.embedTemplate()
          .setColor('YELLOW')
          .setTitle('Warning!')
          .setDescription(stripIndents`
        You have warned by Team TripSit:

        ${reason}

        Please read the rules and be respectful of them.

        Contact a TripSit Team Member if you have any questions!`);
        try {
          await targetUser.send({ embeds: [warnEmbed], components: [warnButtons] });
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

            logger.debug(`[${PREFIX}] minutes: ${minutes}`);
            targetUser.timeout(minutes, reason);
            await targetUser.send(`You have been quieted for ${ms(minutes, { long: true })}${reason ? ` because:\n ${reason}` : ''} `);
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
            global.ircClient.say(targetNickname, `You have been quieted for ${ms(minutes, { long: true })}${reason ? ` because:\n ${reason}` : ''} `);
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
            global.ircClient.send('KICK', ircChannel, targetNickname);
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
      if (targetPlatform === 'discord') {
        if (toggle === 'on' || toggle === null) {
          try {
            // The length of the timout defaults to forever if no time is given
            minutes = duration
              ? await parseDuration.execute(duration)
              : null;
            logger.debug(`[${PREFIX}] minutes: ${minutes}`);
            const targetGuild = await global.client.guilds.fetch(discordGuildId);
            targetGuild.members.ban(targetUser, { days: 7, reason });
            await targetUser.send(`You have been banned ${minutes ? `for ${ms(minutes, { long: true })}` : ''}${reason ? ` because\n ${reason}` : ''} `);
          } catch (err) {
            logger.error(`[${PREFIX}] Error: ${err}`);
          }
        } else {
          try {
            logger.debug(`[${PREFIX}] targetUser.id: ${targetUser.id}`);
            const targetGuild = await global.client.guilds.fetch(discordGuildId);
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
          global.ircClient.say(targetNickname, `You have been banned for ${ms(minutes, { long: true })}${reason ? ` because:\n ${reason}` : ''} `);

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

    const targetAction = `received_${command}`;
    // const targetModActions = targetData.modActions ? targetData.modActions : {};
    // logger.debug(`[${PREFIX}] targetModActions: ${JSON.stringify(targetModActions, null, 2)}`);
    const targetEmbed = template.embedTemplate()
      .setColor('BLUE')
      .setDescription(`${actor} ${command}ed ${targetNickname}${targetChannel ? ` in ${targetChannel}` : ''}${minutes ? ` for ${ms(minutes, { long: true })}` : ''}${reason ? ` because\n ${reason}` : ''}`)
      .addFields(
        { name: 'Nickname', value: `${targetNickname}`, inline: true },
        { name: 'Username', value: `${targetUsername}`, inline: true },
        { name: 'ID', value: `${targetId}`, inline: true },
      );
    if (targetPlatform === 'discord') {
      targetEmbed.addFields(
        { name: 'Account created', value: `${targetUser.user ? time(targetUser.user.createdAt, 'R') : time(targetUser.createdAt, 'R')}`, inline: true },
        { name: 'Joined', value: `${time(targetUser.joinedAt, 'R')}`, inline: true },
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
          const reply = { embeds: [targetEmbed], ephemeral: true, components: [modButtons] };
          logger.debug(`[${PREFIX}] replied to user ${actor} with info about ${targetUser}`);
          logger.debug(`[${PREFIX}] finished!`);
          return reply;
        } catch (err) {
          logger.error(`[${PREFIX}] Error: ${err}`);
        }
      }
      if (targetPlatform === 'irc') {
        try {
          global.ircClient.say('tripbot', `${botPrefix}${command} ${targetUsername}`);
          global.ircClient.say('#sandbox', `Sent: ${botPrefix}${command} ${targetUsername}`);
          return;
        } catch (err) {
          logger.error(`[${PREFIX}] Error: ${err}`);
        }
      }
    }

    logger.debug(`[${PREFIX}] channelModeratorsId: ${channelModeratorsId}`);
    const modChan = await global.client.channels.fetch(channelModeratorsId);
    modChan.send({ embeds: [targetEmbed] });
    logger.debug(`[${PREFIX}] send a message to the moderators room`);

    const now = new Date();
    const targetModAction = {
      [now]: {
        actor: actor.id,
        target: targetUser.id,
        command,
      },
    };
    if (reason) {
      targetModAction[now].reason = reason;
    }
    if (duration) {
      targetModAction[now].duration = duration;
    }
    if (targetChannel) {
      targetModAction[now].targetChannel = targetChannel.toString();
    }

    logger.debug(`[${PREFIX}] targetModAction: ${JSON.stringify(targetModAction, null, 2)}`);
    logger.debug(`[${PREFIX}] targetAction: ${targetAction}`);
    if ('modActions' in targetData) {
      if (targetAction in targetData.modActions) {
        logger.debug(`[${PREFIX}] targetAction in targetData.modActions`);
        targetData.modActions[targetAction].push(targetModAction);
      } else {
        logger.debug(`[${PREFIX}] targetAction not in targetData.modActions`);
        targetData.modActions[targetAction] = [targetModAction];
      }
    } else {
      logger.debug(`[${PREFIX}] modActions not in targetData`);
      targetData.modActions = {
        [targetAction]: [targetModAction],
      };
    }

    // Load targetUser data
    await setUserInfo(targetFbid, targetData);

    // // Extract actor data
    const actorAction = `${command}_received`;

    const actorModAction = {
      [now]: {
        actor: actor.id,
        target: targetUser.id,
      },
    };
    if (reason) {
      actorModAction[now].reason = reason;
    }
    if (duration) {
      actorModAction[now].duration = duration;
    }
    if (targetChannel) {
      actorModAction[now].targetChannel = targetChannel.id;
    }

    if ('modActions' in actorData) {
      if (actorAction in actorData.modActions) {
        logger.debug(`[${PREFIX}] actorAction in actorData.modActions`);
        actorData.modActions[actorAction].push(actorModAction);
      } else {
        logger.debug(`[${PREFIX}] actorAction not in actorData.modActions`);
        actorData.modActions[actorAction] = [actorModAction];
      }
    } else {
      logger.debug(`[${PREFIX}] modActions not in actorData`);
      actorData.modActions = {
        [actorAction]: [actorModAction],
      };
    }

    // // Load actor data
    await setUserInfo(actorFbid, actorData);

    logger.debug(`[${PREFIX}] finished!`);
    return `${targetUsername} has been ${command}ed!`;
  },
};
