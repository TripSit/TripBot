'use strict';

const PREFIX = require('path').parse(__filename).name;
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
  discordGuildId,
  roleNeedshelpId,
  roleAdminId,
  roleDiscordopId,
  roleIrcopId,
  roleModeratorId,
  roleTripsitterId,
  roleTeamtripsitId,
  roleTripbot2Id,
  roleTripbotId,
  roleBotId,
  roleDeveloperId,
  roleTreeId,
  roleSproutId,
  roleSeedlingId,
  roleBoosterId,
  roleRedId,
  roleOrangeId,
  roleYellowId,
  roleGreenId,
  roleBlueId,
  rolePurpleId,
  rolePinkId,
  roleBrownId,
  roleBlackId,
  roleWhiteId,
  roleDrunkId,
  roleHighId,
  roleRollingId,
  roleTrippingId,
  roleDissociatingId,
  roleStimmingId,
  roleNoddingId,
  roleSoberId,
} = require('../../env');

const teamRoles = [
  roleAdminId,
  roleDiscordopId,
  roleIrcopId,
  roleModeratorId,
  roleTripsitterId,
  roleTeamtripsitId,
  roleTripbot2Id,
  roleTripbotId,
  roleBotId,
  roleDeveloperId,

];

const ignoredRoles = `${teamRoles},${colorRoles},${mindsetRoles}`;

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
        .setDescription('Channel to kick from!')
        .setRequired(true))
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
  async execute(interaction) {
    const actor = interaction.member;
    logger.debug(`[${PREFIX}] Actor: ${actor}`);
    let command = interaction.options.getSubcommand();
    logger.debug(`[${PREFIX}] Command: ${command}`);
    const toggle = interaction.options.getString('toggle');
    logger.debug(`[${PREFIX}] toggle: ${toggle}`);
    const reason = interaction.options.getString('reason');
    logger.debug(`[${PREFIX}] reason: ${reason}`);
    const duration = interaction.options.getString('duration');
    logger.debug(`[${PREFIX}] duration: ${duration}`);
    const minutes = duration ? (await parseDuration.execute(duration) / 1000) / 60 : 0;
    logger.debug(`[${PREFIX}] minutes: ${minutes}`);

    let targetFromIrc = null;
    let targetFromDiscord = null;
    let targetIsMember = null;

    // Determine target information
    let target = interaction.options.getString('target');
    if (target.startsWith('<@') && target.endsWith('>')) {
      // If the target string starts with a < then it's likely a discord user
      targetFromIrc = false;
      targetFromDiscord = true;
      targetIsMember = true;
      const targetId = target.slice(3, -1);
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
    logger.debug(`[${PREFIX}] target: ${JSON.stringify(target, null, 2)}`);

    // Get the channel information
    let channel = interaction.options.getString('channel');
    if (channel) {
      if (channel.startsWith('<#') && channel.endsWith('>')) {
        // Discord channels start with <#
        const channelId = channel.slice(2, -1);
        channel = await interaction.guild.channels.fetch(channelId);
      } else if (channel.startsWith('#')) {
        // IRC channels start with #
        channel = channel.slice(1);
      }
    }
    logger.debug(`[${PREFIX}] channel: ${JSON.stringify(channel, null, 2)}`);

    const username = target.nick ? target.nick : target.displayname;
    logger.debug(`[${PREFIX}] username: ${username}`);

    if (!target) {
      const embed = template.embedTemplate()
        .setColor('RED')
        .setDescription('Target not found?');
      interaction.reply({ embeds: [embed], ephemeral: true });
      logger.debug(`[${PREFIX}] Target not found!`);
      return;
    }

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
            .setTitle('Warned!')
            .setDescription(stripIndents`
            You have warned by Team TripSit:

            > ${reason}

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
        if (toggle === 'on') {
          try {
            await target.send(`You have been quieted for ${duration} because ${reason}`);
            target.timeout(duration, reason);
          } catch (err) {
            logger.error(`[${PREFIX}] Error: ${err}`);
          }
        } else {
          try {
            await target.send(`You have been unquieted for ${reason}`);
            target.timeout(0, reason);
            command = 'untimeout';
            logger.debug(`[${PREFIX}] I un${command}ed ${username} because '${reason}'!`);
            interaction.reply(`I un${command}ed ${username} because '${reason}'`);
            return;
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
          await target.send(`You have been kicked for ${reason}`);
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
            interaction.reply(`I un${command}ed ${username} because '${reason}'`);
            return;
          } catch (err) {
            logger.error(`[${PREFIX}] Error: ${err}`);
          }
        }
      }
      if (targetFromDiscord) {
        if (toggle === 'on') {
          try {
            await target.send(`You have been banned for ${reason}`);
            interaction.guild.members.ban(target, { days: duration, reason });
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

    interaction.reply(`I ${command}ed ${username} ${channel ? `in ${channel}` : ''}${minutes ? ` for ${minutes} minutes` : ''} because '${reason}'`);

    // Extract actor data
    const [actorData, actorFbid] = await getUserInfo(actor);
    const actorAction = `${command}_received`;

    // Transfor actor data
    if ('discord' in actorData) {
      if ('modActions' in actorData) {
        actorData.discord.modActions[actorAction] = (
          actorData.discord.modActions[actorAction] || 0) + 1;
      } else {
        actorData.discord.modActions = { [actorAction]: 1 };
      }
    } else {
      actorData.discord = { modActions: { [actorAction]: 1 } };
    }

    // Load actor data
    await setUserInfo(actorFbid, actorData);

    // Extract target data
    const [targetData, targetFbid] = await getUserInfo(target);
    const targetAction = `${command}_received`;
    const targetUsername = `${targetIsMember ? target.user.username : target.username}#${targetIsMember ? target.user.discriminator : target.discriminator}`;

    // eslint-disable-next-line
        // const title = `${actor} ${command}ed ${username} ${duration ? `for ${duration}` : ''} ${reason ? `because ${reason}` : ''}`;
    const title = `${actor} ${command}ed ${targetData} ${reason ? `because ${reason}` : ''}`;
    // const book = [];
    const targetEmbed = template.embedTemplate()
      .setColor('BLUE')
      .setDescription(title)
      .addFields(
        { name: 'Username', value: targetUsername, inline: true },
        { name: 'Nickname', value: `${target.nickname}`, inline: true },
        { name: 'ID', value: `${targetIsMember ? target.user.id : target.id}`, inline: true },
      )
      .addFields(
        { name: 'Account created', value: `${targetIsMember ? time(target.user.createdAt, 'R') : time(target.createdAt, 'R')}`, inline: true },
        { name: 'Joined', value: `${time(target.joinedAt, 'R')}`, inline: true },
        { name: 'Timeout until', value: `${time(target.communicationDisabledUntil, 'R')}`, inline: true },
      )
      .addFields(
        { name: 'Pending', value: `${target.pending}`, inline: true },
        { name: 'Moderatable', value: `${target.moderatable}`, inline: true },
        { name: 'Muted', value: `${targetIsMember ? target.isCommunicationDisabled() : 'banned'}`, inline: true },
      )
      .addFields(
        { name: 'Manageable', value: `${target.manageable}`, inline: true },
        { name: 'Bannable', value: `${target.bannable}`, inline: true },
        { name: 'Kickable', value: `${target.kickable}`, inline: true },
      )
      .addFields(
        { name: '# of Reports', value: `${targetData.reports_recv ? targetData.reports_recv : 0}`, inline: true },
        { name: '# of Timeouts', value: `${targetData.timeout_recv ? targetData.timeout_recv : 0}`, inline: true },
        { name: '# of Warns', value: `${targetData.warn_recv ? targetData.warn_recv : 0}`, inline: true },
      )
      .addFields(
        { name: '# of Kicks', value: `${targetData.kick_recv ? targetData.kick_recv : 0}`, inline: true },
        { name: '# of Bans', value: `${targetData.ban_recv ? targetData.ban_recv : 0}`, inline: true },
        { name: '# of Fucks to give', value: '0', inline: true },
      );

    // Transform taget data
    if ('discord' in actorData) {
      if ('modActions' in targetData) {
        targetData.discord.modActions[targetAction] = (
          targetData.discord.modActions[targetAction] || 0) + 1;
      } else {
        targetData.discord.modActions = { [targetAction]: 1 };
      }
    } else {
      targetData.discord = { modActions: { [targetAction]: 1 } };
    }

    // Load target data
    await setUserInfo(targetFbid, targetData);

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
          logger.debug(`${PREFIX} replied to user ${interaction.member.user.name} with info about ${target.user.name}`);
          logger.debug(`[${PREFIX}] finished!`);
          return;
        } catch (err) {
          logger.error(`[${PREFIX}] Error: ${err}`);
        }
      }
    }

    logger.debug(`${PREFIX} channelModeratorsId: ${channelModeratorsId}`);
    const modChan = interaction.client.channels.cache.get(channelModeratorsId);
    modChan.send({ embeds: [targetEmbed], components: [modButtons] });
    // modChan.send({ embeds: [targetEmbed] });
    logger.debug(`${PREFIX} send a message to the moderators room`);
    logger.debug(`[${PREFIX}] finished!`);
  },
};
