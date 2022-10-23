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
  ColorResolvable,
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
import * as path from 'path';
const PREFIX = path.parse(__filename).name;

const teamRoles = [
  env.ROLE_DIRECTOR,
  env.ROLE_SUCCESSOR,
  env.ROLE_SYSADMIN,
  env.ROLE_LEADDEV,
  env.ROLE_DISCORDADMIN,
  env.ROLE_MODERATOR,
  env.ROLE_TRIPSITTER,
  env.ROLE_TEAMTRIPSIT,
  env.ROLE_TRIPBOT2,
  env.ROLE_TRIPBOT,
  env.ROLE_BOT,
  env.ROLE_DEVELOPER,
];

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
 * @param {TextChannel} channel
 * @param {string} toggle
 * @param {string} privReason
 * @param {string} pubReason
 * @param {string} duration
 * @param {ChatInputCommandInteraction} interaction
 */
export async function moderate(
  actor: GuildMember,
  command:string,
  target: GuildMember,
  channel: TextChannel | undefined,
  toggle: 'on' | 'off' | undefined,
  privReason: string | undefined,
  pubReason: string | undefined,
  duration: string | undefined,
  interaction:ChatInputCommandInteraction | ModalSubmitInteraction | UserContextMenuCommandInteraction | undefined,
):Promise<any> {
  logger.debug(stripIndents`[${PREFIX}]
      Actor: ${actor}
      Command: ${command}
      Toggle: ${toggle}
      Target: ${target}
      Channel: ${channel}
      Duration: ${duration}
      PubReason: ${pubReason}
      PrivReason: ${privReason}
    `);

  let minutes = 604800000;

  // Determine if the actor is on the team
  if (actor.roles) {
    // If you're unbanning a actor they wont have roles
    actor.roles.cache.forEach(async (role) => {
      if (teamRoles.includes(role.id)) {
        // Actor Team check - Only team members can use mod actions (except report)
        if (command !== 'report') {
          // logger.debug(`[${PREFIX}] actor is NOT a team member!`);
          return {content: stripIndents`Hey ${actor}, you need to be a team member to ${command}!`, ephemeral: true};
        }
      }
    });
  }

  // Determine if the target is on the team
  if (target.roles) {
    target.roles.cache.forEach(async (role) => {
      if (teamRoles.includes(role.id)) {
        // Target Team check - Only NON team members can be targeted by mod actions
        logger.debug(`[${PREFIX}] Target is a team member!`);
        return {content: stripIndents`Hey ${actor}, you cannot ${command} a team member!`, ephemeral: true};
      }
    });
  }

  // Get duration
  if (duration) {
    minutes = duration ?
      await parseDuration(duration) :
      604800000;
    logger.debug(`[${PREFIX}] minutes: ${minutes}`);
  }
  logger.debug(`[${PREFIX}] duration: ${duration}`);

  // Perform various mod actions
  let embedColor = Colors.Red as ColorResolvable;
  let embedTitle = '';
  let verb = '';
  if (command === 'timeout') {
    if (toggle === 'on' || toggle === null) {
      embedColor = Colors.Yellow;
      embedTitle = 'Timeout!';
      verb = 'timed out';
      try {
        target.timeout(minutes, privReason);
      } catch (err) {
        logger.error(`[${PREFIX}] Error: ${err}`);
      }
    } else {
      embedColor = Colors.Green;
      embedTitle = 'Untimeout!';
      verb = 'removed from time-out';
      try {
        target.timeout(0, privReason);
        logger.debug(`[${PREFIX}] I untimeouted ${target.displayName} because\n '${privReason}'!`);
      } catch (err) {
        logger.error(`[${PREFIX}] Error: ${err}`);
      }
    }
  } else if (command === 'kick') {
    embedColor = Colors.Orange;
    embedTitle = 'Kicked!';
    verb = 'kicked';
    try {
      target.kick();
    } catch (err) {
      logger.error(`[${PREFIX}] Error: ${err}`);
    }
  } else if (command === 'ban') {
    if (toggle === 'on' || toggle === null) {
      embedColor = Colors.Red;
      embedTitle = 'Banned!';
      verb = 'banned';
      try {
        const targetGuild = await global.client.guilds.fetch(env.DISCORD_GUILD_ID);
        targetGuild.members.ban(target, {reason: privReason});
      } catch (err) {
        logger.error(`[${PREFIX}] Error: ${err}`);
      }
    } else {
      embedColor = Colors.Green;
      embedTitle = 'Un-banned!';
      verb = 'un-banned';
      try {
        const targetGuild = await global.client.guilds.fetch(env.DISCORD_GUILD_ID);
        await targetGuild.bans.fetch();
        await targetGuild.bans.remove(target.user, privReason);
      } catch (err) {
        logger.error(`[${PREFIX}] Error: ${err}`);
      }
    }
  } else if (command === 'underban') {
    if (toggle === 'on' || toggle === null) {
      embedColor = Colors.Blue;
      embedTitle = 'Underbanned!';
      verb = 'underbanned';
      try {
        const targetGuild = await global.client.guilds.fetch(env.DISCORD_GUILD_ID);
        targetGuild.members.ban(target, {reason: privReason});
      } catch (err) {
        logger.error(`[${PREFIX}] Error: ${err}`);
      }
    } else {
      try {
        const targetGuild = await global.client.guilds.fetch(env.DISCORD_GUILD_ID);
        await targetGuild.bans.fetch();
        await targetGuild.bans.remove(target.user, privReason);
      } catch (err) {
        logger.error(`[${PREFIX}] Error: ${err}`);
      }
    }
  } else if (command === 'warn') {
    embedColor = Colors.Yellow;
    embedTitle = 'Warned!';
    verb = 'warned';
  }

  const warnEmbed = embedTemplate()
    .setColor(embedColor)
    .setTitle(embedTitle)
    .setDescription(stripIndents`
    Hey ${target}, you have been ${verb} ${duration ? `for ${ms(minutes, {long: true})}` : ''} by Team TripSit:

    ${pubReason}

    **Do not message a moderator to talk about this**
    
    You can respond to this bot and it will provide you a way to appeal!

    Please read the rules and be respectful of them.

    https://tripsit.me/rules
    `);

  await target.user.send({embeds: [warnEmbed], components: [warnButtons]});

  // Send the embed to the mod channel
  const modChan = await global.client.channels.fetch(env.CHANNEL_MODERATORS) as TextChannel;
  if (command !== 'note') {
    // We must send the mention outside of the embed, cuz mentions dont work in embeds
    const tripsitGuild = await global.client.guilds.fetch(env.DISCORD_GUILD_ID) as Guild;
    const roleModerator = tripsitGuild.roles.cache.find((role:Role) => role.id === env.ROLE_MODERATOR) as Role;
    modChan.send(stripIndents`
      Hey ${roleModerator}!
      ${actor.displayName} ${verb} ${target.displayName}\
      ${channel ? `in ${channel.name}` : ''}\
      ${duration ? `for ${ms(minutes, {long: true})}` : ''}\
      ${privReason ? `\nPriv Reason: ${privReason}` : ''}
      `);
  }
  logger.debug(`[${PREFIX}] sent a message to the moderators room`);

  // Create the embed that will be sent to the mod-log channel
  const modlogEmbed = embedTemplate()
    .setColor(Colors.Blue)
    .setDescription(`${actor} ${command}ed ${target.displayName}\
      ${channel ? ` in ${channel.name}` : ''}\
      ${duration ? ` for ${ms(minutes, {long: true})}` : ''}\
      ${privReason ? ` because\n ${privReason}` : ''}`)
    .addFields(
      {name: 'Displayname', value: `${target.displayName}`, inline: true},
      {name: 'Username', value: `${target.user.username}`, inline: true},
      {name: 'ID', value: `${target.id}`, inline: true},
    );
  modlogEmbed.addFields(
    {name: 'Created', value: `${time(target.user.createdAt, 'R')}`, inline: true},
    {name: 'Joined', value: `${target.joinedAt ? time(target.joinedAt!, 'R') : 'Unknown'}`, inline: true},
  );

  // If this is the info command then just return with the above embed in an emphemeral message
  if (command === 'info') {
    try {
      const reply = {embeds: [modlogEmbed], ephemeral: true};
      logger.debug(`[${PREFIX}] returned info about ${target.displayName}`);
      logger.debug(`[${PREFIX}] finished!`);
      return reply;
    } catch (err) {
      logger.error(`[${PREFIX}] Error: ${err}`);
    }
  }

  // Send the embed to the mod-log room
  const modlog = await global.client.channels.fetch(env.CHANNEL_MODLOG) as TextChannel;
  modlog.send({embeds: [modlogEmbed]});
  logger.debug(`[${PREFIX}] sent a message to the modlog room`);

  // Return a message to the user confirming the user was acted on
  logger.debug(`[${PREFIX}] ${target.displayName} has been ${command}ed!`);
  const response = embedTemplate()
    .setColor(Colors.Yellow)
    .setDescription(`${target.displayName} has been ${command}ed!`);
  return {embeds: [response], ephemeral: true};
};
