'use strict';

const PREFIX = require('path').parse(__filename).name;
const ms = require('ms');
const { SlashCommandBuilder, time } = require('@discordjs/builders');
const { MessageActionRow, MessageButton } = require('discord.js');
const { stripIndents } = require('common-tags/lib');
const logger = require('../../utils/logger');
const template = require('../../utils/embed-template');
const { getUserInfo, setUserInfo } = require('../../utils/firebase');
const parseDuration = require('../../utils/parseDuration');

const {
  NODE_ENV,
  channelModeratorsId,
} = require('../../../env');

const botPrefix = NODE_ENV === 'production' ? '~' : '-';

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

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mod')
    .setDescription('Moderation actions!')
    .addSubcommand(subcommand => subcommand
      .setDescription('Info on a user')
      .addStringOption(option => option
        .setName('target')
        .setDescription('User to get info on!')
        .setRequired(true))
      .setName('info'))
    .addSubcommand(subcommand => subcommand
      .setDescription('Warn a user')
      .addStringOption(option => option
        .setName('target')
        .setDescription('User to warn!')
        .setRequired(true))
      .addStringOption(option => option
        .setName('reason')
        .setDescription('Reason for warn!')
        .setRequired(true))
      .setName('warn'))
    .addSubcommand(subcommand => subcommand
      .setDescription('Create a note about a user')
      .addStringOption(option => option
        .setName('target')
        .setDescription('User to note about!')
        .setRequired(true))
      .addStringOption(option => option
        .setName('reason')
        .setDescription('Reason for note!')
        .setRequired(true))
      .setName('note'))
    .addSubcommand(subcommand => subcommand
      .setDescription('Timeout a user')
      .addStringOption(option => option
        .setName('target')
        .setDescription('User to timeout!')
        .setRequired(true))
      .addStringOption(option => option
        .setName('reason')
        .setDescription('Reason for timeout!')
        .setRequired(true))
      .addStringOption(option => option
        .setName('toggle')
        .setDescription('On off?')
        .addChoice('On', 'on')
        .addChoice('Off', 'off'))
      .addStringOption(option => option
        .setName('duration')
        .setDescription('Duration of ban!'))
      .setName('timeout'))
    .addSubcommand(subcommand => subcommand
      .setDescription('Kick a user')
      .addStringOption(option => option
        .setName('target')
        .setDescription('User to kick!')
        .setRequired(true))
      .addStringOption(option => option
        .setName('reason')
        .setDescription('Reason for kick!')
        .setRequired(true))
      .addStringOption(option => option
        .setName('channel')
        .setDescription('Channel to kick from!'))
      .setName('kick'))
    .addSubcommand(subcommand => subcommand
      .setDescription('Ban a user')
      .addStringOption(option => option
        .setName('target')
        .setDescription('User to ban!')
        .setRequired(true))
      .addStringOption(option => option
        .setName('reason')
        .setDescription('Reason for ban!')
        .setRequired(true))
      .addStringOption(option => option
        .setName('duration')
        .setDescription('How long to ban!'))
      .addStringOption(option => option
        .setName('toggle')
        .setDescription('On off?')
        .addChoice('On', 'on')
        .addChoice('Off', 'off'))
      .setName('ban')),
  async execute(interaction, options) {
    const actor = options ? options.actor : interaction.member;
    logger.debug(`[${PREFIX}] Actor: ${actor}`);
    let command = options ? options.command : interaction.options.getSubcommand();
    logger.debug(`[${PREFIX}] Command: ${command}`);
    const toggle = options ? options.toggle : interaction.options.getString('toggle');
    logger.debug(`[${PREFIX}] toggle: ${toggle}`);
    const reason = options ? options.reason : interaction.options.getString('reason');
    logger.debug(`[${PREFIX}] reason: ${reason}`);
    const duration = options ? options.duration : interaction.options.getString('duration');
    logger.debug(`[${PREFIX}] duration: ${duration}`);

    let minutes = null;
    let targetFromIrc = options ? false : null;
    let targetFromDiscord = options ? true : null;
    let targetIsMember = options ? true : null;

    // Determine target information
    let target = options ? options.target : interaction.options.getString('target');
    logger.debug(`[${PREFIX}] Target: ${target}`);
    logger.debug(`[${PREFIX}] typeof Target: ${typeof target}`);
    if (typeof target !== 'object') {
      if (target.startsWith('<@') && target.endsWith('>')) {
        // If the target string starts with a < then it's likely a discord user
        targetFromIrc = false;
        targetFromDiscord = true;
        targetIsMember = true;
        const targetId = target.slice(3, -1);
        logger.debug(`[${PREFIX}] targetId: ${targetId}`);
        target = await interaction.guild.members.fetch(targetId);
      } else if (target.match(/^\d+$/)) {
        // If the target string is a series of numbers, it's likely a discord user
        targetFromIrc = false;
        targetFromDiscord = true;
        targetIsMember = true;
        const targetId = target;
        logger.debug(`[${PREFIX}] targetId: ${targetId}`);
        target = await interaction.guild.members.fetch(targetId);
      } else {
        // Do a whois lookup to the user
        let data = null;
        await global.ircClient.whois(target, async resp => {
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
          logger.debug(`[${PREFIX}] ${target} not found on IRC`);
          embed.setDescription(stripIndents`${target} is not found on IRC, did you spell that right?`);
          interaction.reply({ embeds: [embed], ephemeral: true });
          return;
        }

        targetFromIrc = true;
        targetFromDiscord = false;
        targetIsMember = false;
        target = data;
      }
    }

    // logger.debug(`[${PREFIX}] target: ${JSON.stringify(target, null, 2)}`);

    if (!target) {
      const embed = template.embedTemplate()
        .setColor('RED')
        .setDescription('Target not found?');
      interaction.reply({ embeds: [embed], ephemeral: true });
      logger.debug(`[${PREFIX}] Target not found!`);
      return;
    }

    // Team check - Cannot be run on team members
    let targetIsTeamMember = false;
    if (targetFromDiscord) {
      target.roles.cache.forEach(async role => {
        if (teamRoles.includes(role.id)) {
          targetIsTeamMember = true;
        }
      });
      if (targetIsTeamMember) {
        logger.debug(`[${PREFIX}] Target is a team member!`);
        const teamMessage = stripIndents`
              Hey ${actor}, ${target.user.username} is a team member!
              Did you mean to do that?`;
        const embed = template.embedTemplate()
          .setColor('DARK_BLUE')
          .setDescription(teamMessage);
        if (!interaction.replied) {
          await interaction.reply({ embeds: [embed], ephemeral: true });
        }
        return;
      }
    }

    // Get the channel information
    let channel = options ? options.channel : interaction.options.getString('channel');
    logger.debug(`[${PREFIX}] Channel: ${channel}`);
    if (channel) {
      if (channel.startsWith('<#') && channel.endsWith('>')) {
        // Discord channels start with <#
        channel = await interaction.guild.channels.fetch(channel.slice(2, -1));
      }
    }
    logger.debug(`[${PREFIX}] channel: ${JSON.stringify(channel, null, 2)}`);
    const username = target.displayName ? target.displayName : target.nick;
    if (command === 'warn') {
      if (targetFromIrc) {
        try {
          global.ircClient.say('tripbot', `${botPrefix}${command} ${username} ${reason}`);
          global.ircClient.say('#sandbox', `Sent: ${botPrefix}${command} ${username} ${reason}`);
        } catch (err) {
          logger.error(`[${PREFIX}] Error: ${err}`);
        }
      }
      if (targetFromDiscord) {
        try {
          const warnEmbed = template.embedTemplate()
            .setColor('YELLOW')
            .setTitle('Warning!')
            .setDescription(stripIndents`
            You have warned by Team TripSit:

            ${reason}

            Please read the rules and be respectful of them.

            Contact a TripSit Team Member if you have any questions!`);
          await target.send({ embeds: [warnEmbed], components: [warnButtons] });
        } catch (err) {
          logger.error(`[${PREFIX}] Error: ${err}`);
        }
      }
    } else if (command === 'timeout') {
      if (targetFromIrc) {
        command = 'quiet';
        if (toggle === 'on' || toggle === null) {
          try {
            const tripbotCommand = `${botPrefix}${command} ${username}${duration ? ` ${minutes}m` : ''} ${reason}`;
            global.ircClient.say('tripbot', tripbotCommand);
            global.ircClient.say('#sandbox', `Sent: ${tripbotCommand}`);
          } catch (err) {
            logger.error(`[${PREFIX}] Error: ${err}`);
          }
        } else {
          command = 'unquiet';
          try {
            const tripbotCommand = `${botPrefix}${command} ${username} ${reason}`;
            global.ircClient.say('tripbot', tripbotCommand);
            global.ircClient.say('#sandbox', `Sent: ${tripbotCommand}`);
          } catch (err) {
            logger.error(`[${PREFIX}] Error: ${err}`);
          }
        }
      }
      if (targetFromDiscord) {
        if (toggle === 'on' || toggle === null) {
          try {
            // The length of the timout defaults to 1 week if no time is given
            minutes = duration
              ? await parseDuration.execute(duration)
              : 604800000;
            logger.debug(`[${PREFIX}] minutes: ${minutes}`);
            target.timeout(minutes, reason);
            await target.send(`You have been quieted for ${ms(minutes, { long: true })}${reason ? ` because\n ${reason}` : ''} `);
          } catch (err) {
            logger.error(`[${PREFIX}] Error: ${err}`);
          }
        } else {
          try {
            await target.send(`You have been unquieted for ${reason}`);
            target.timeout(0, reason);
            command = 'untimeout';
            logger.debug(`[${PREFIX}] I ${command}ed ${username} because\n '${reason}'!`);
          } catch (err) {
            logger.error(`[${PREFIX}] Error: ${err}`);
          }
        }
      }
    } else if (command === 'kick') {
      if (targetFromIrc) {
        try {
          const tripbotCommand = `${botPrefix}${command} ${username} ${channel} ${reason}`;
          global.ircClient.say('tripbot', tripbotCommand);
          global.ircClient.say('#sandbox', `Sent: ${tripbotCommand}`);
        } catch (err) {
          logger.error(`[${PREFIX}] Error: ${err}`);
        }
      }
      if (targetFromDiscord) {
        try {
          await target.send(`You have been kicked because\n ${reason}`);
          target.kick();
        } catch (err) {
          logger.error(`[${PREFIX}] Error: ${err}`);
        }
      }
    } else if (command === 'ban') {
      if (targetFromIrc) {
        if (toggle === 'on' || toggle === null) {
          try {
            command = 'nban';
            const tripbotCommand = `${botPrefix}${command} ${username}${duration ? ` ${minutes}m` : ''} ${reason}`;
            global.ircClient.say('tripbot', tripbotCommand);
            global.ircClient.say('#sandbox', `Sent: ${tripbotCommand}`);
          } catch (err) {
            logger.error(`[${PREFIX}] Error: ${err}`);
          }
        } else {
          try {
            command = 'nunban';
            const tripbotCommand = `${botPrefix}nunban ${username} ${reason}`;
            global.ircClient.say('tripbot', tripbotCommand);
            global.ircClient.say('#sandbox', `Sent: ${tripbotCommand}`);
          } catch (err) {
            logger.error(`[${PREFIX}] Error: ${err}`);
          }
        }
      }
      if (targetFromDiscord) {
        if (toggle === 'on' || toggle === null) {
          try {
            // The length of the timout defaults to forever if no time is given
            minutes = duration
              ? await parseDuration.execute(duration)
              : null;
            logger.debug(`[${PREFIX}] minutes: ${minutes}`);
            await target.send(`You have been banned ${minutes ? `for ${ms(minutes, { long: true })}` : ''}${reason ? ` because\n ${reason}` : ''} `);
            interaction.guild.members.ban(target, { days: 7, reason });
          } catch (err) {
            logger.error(`[${PREFIX}] Error: ${err}`);
          }
        } else {
          try {
            command = 'unban';
            target = interaction.client.users.fetch(target);
            logger.debug(`[${PREFIX}] target_user.id: ${target.id}`);
            const bans = await interaction.guild.bans.fetch();
            logger.debug(`[${PREFIX}] interaction.guild.bans.fetch(): ${bans}`);
            await interaction.guild.bans.remove(target, reason);
            logger.debug(`[${PREFIX}] I unbanned ${username}!`);
            target.send(`You have been unbanned for ${reason}`);
          } catch (err) {
            logger.error(`[${PREFIX}] Error: ${err}`);
          }
        }
      }
    }

    if (command !== 'info') {
      interaction.reply(
        {
          content: stripIndents`
      I ${command}ed ${username}${channel ? ` in ${channel}` : ''}${minutes ? ` for ${ms(minutes, { long: true })}` : ''}${reason ? ` because\n ${reason}` : ''}`,
          ephemeral: true,
        },
      );
    }

    // Extract target data
    const [targetData, targetFbid] = await getUserInfo(target);
    const targetAction = `received_${command}`;
    const targetUsername = `${targetIsMember ? target.user.username : target.username}#${targetIsMember ? target.user.discriminator : target.discriminator}`;
    const targetModActions = targetData.modActions ? targetData.modActions : {};
    // logger.debug(`[${PREFIX}] targetModActions: ${JSON.stringify(targetModActions, null, 2)}`);
    const targetEmbed = template.embedTemplate()
      .setColor('BLUE')
      .setDescription(`${actor} ${command}ed ${username}${channel ? ` in ${channel}` : ''}${minutes ? ` for ${ms(minutes, { long: true })}` : ''}${reason ? ` because\n ${reason}` : ''}`)
      .addFields(
        { name: 'Username', value: targetUsername, inline: true },
        { name: 'Nickname', value: `${target.nickname ? target.nickname : target.user.username}`, inline: true },
        { name: 'ID', value: `${targetIsMember ? target.user.id : target.id}`, inline: true },
      )
      .addFields(
        { name: 'Account created', value: `${targetIsMember ? time(target.user.createdAt, 'R') : time(target.createdAt, 'R')}`, inline: true },
        { name: 'Joined', value: `${time(target.joinedAt, 'R')}`, inline: true },
        { name: 'Timeout until', value: `${target.communicationDisabledUntil ? time(target.communicationDisabledUntil, 'R') : 'Not Timeouted'}`, inline: true },
      )
      .addFields(
        { name: '# of Reports', value: `${targetModActions.received_report ? targetModActions.received_report.length : 0}`, inline: true },
        { name: '# of Timeouts', value: `${targetModActions.received_timeout ? targetModActions.received_timeout.length : 0}`, inline: true },
        { name: '# of Warns', value: `${targetModActions.received_warn ? targetModActions.received_warn.length : 0}`, inline: true },
      )
      .addFields(
        { name: '# of Kicks', value: `${targetModActions.received_kick ? targetModActions.received_kick.length : 0}`, inline: true },
        { name: '# of Bans', value: `${targetModActions.received_ban ? targetModActions.received_ban.length : 0}`, inline: true },
        { name: '# of Notes', value: `${targetModActions.received_note ? targetModActions.received_note.length : 0}`, inline: true },
      )
      .addFields(
        { name: '# of Tripsitmes', value: `${targetModActions.received_tripsitme ? targetModActions.received_tripsitme : 0}`, inline: true },
        { name: '# of I\'m Good', value: `${targetModActions.received_imgood ? targetModActions.received_imgood : 0}`, inline: true },
        { name: '# of Fucks to Give', value: '0', inline: true },
      );
    if (command === 'info') {
      if (targetFromIrc) {
        try {
          global.ircClient.say('tripbot', `${botPrefix}${command} ${username}`);
          global.ircClient.say('#sandbox', `Sent: ${botPrefix}${command} ${username}`);
          return;
        } catch (err) {
          logger.error(`[${PREFIX}] Error: ${err}`);
        }
      } else {
        try {
          interaction.reply({ embeds: [targetEmbed], ephemeral: true, components: [modButtons] });
          logger.debug(`[${PREFIX}] replied to user ${actor} with info about ${target}`);
          logger.debug(`[${PREFIX}] finished!`);
          return;
        } catch (err) {
          logger.error(`[${PREFIX}] Error: ${err}`);
        }
      }
    }

    logger.debug(`[${PREFIX}] channelModeratorsId: ${channelModeratorsId}`);
    const modChan = interaction.client.channels.cache.get(channelModeratorsId);
    // modChan.send({ embeds: [targetEmbed], components: [modButtons] });
    modChan.send({ embeds: [targetEmbed] });
    logger.debug(`[${PREFIX}] send a message to the moderators room`);

    const now = new Date();
    const targetModAction = {
      [now]: {
        actor: actor.id,
        target: actor.id,
      },
    };
    if (reason) {
      targetModAction[now].reason = reason;
    }
    if (duration) {
      targetModAction[now].duration = duration;
    }
    if (channel) {
      targetModAction[now].channel = channel.toString();
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

    // Load target data
    await setUserInfo(targetFbid, targetData);

    // // Extract actor data
    const [actorData, actorFbid] = await getUserInfo(actor);
    const actorAction = `${command}_received`;

    const actorModAction = {
      [now]: {
        actor: actor.id,
        target: target.id,
      },
    };
    if (reason) {
      actorModAction[now].reason = reason;
    }
    if (duration) {
      actorModAction[now].duration = duration;
    }
    if (channel) {
      actorModAction[now].channel = channel.id;
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
  },
};
