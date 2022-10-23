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
  actor: GuildMember,
  command:string,
  target: GuildMember,
  channel: unknown,
  toggle: string | undefined,
  reason: string | undefined,
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
      Reason: ${reason}
    `);

  let minutes = 604800000;

  // Determine if the actor is on the team
  let actorIsTeamMember = false;
  if ((actor as GuildMember).roles) {
    // If you're unbanning a actor they wont have roles
    (actor as GuildMember).roles.cache.forEach(async (role) => {
      if (teamRoles.includes(role.id)) {
        actorIsTeamMember = true;
      }
    });
  }

  // Actor Team check - Only team members can use mod actions (except report)
  if (!actorIsTeamMember && command !== 'report') {
    logger.debug(`[${PREFIX}] actor is NOT a team member!`);
    return stripIndents`Hey ${actor}, you need to be a team member to ${command}!`;
  }

  // Determine if the target is on the team
  let targetIsTeamMember = false;
  if ((target as GuildMember).roles) {
    (target as GuildMember).roles.cache.forEach(async (role) => {
      if (teamRoles.includes(role.id)) {
        targetIsTeamMember = true;
      }
    });
  }

  // Target Team check - Only NON team members can be targeted by mod actions
  if (targetIsTeamMember) {
    logger.debug(`[${PREFIX}] Target is a team member!`);
    return stripIndents`Hey ${actor}, you cannot ${command} a team member!`;
  }

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
  logger.debug(`[${PREFIX}] duration: ${duration}`);
  if (command === 'warn') {
    const warnEmbed = embedTemplate()
      .setColor(Colors.Yellow)
      .setTitle('Warning!')
      .setDescription(stripIndents`
        You have been warned by Team TripSit:

        ${reason}

        Please read the rules and be respectful of them.

        Contact a TripSit Team Member if you have any questions!`);
    try {
      await target.user.send({embeds: [warnEmbed], components: [warnButtons]});
    } catch (err) {
      logger.error(`[${PREFIX}] Error: ${err}`);
    }
  } else if (command === 'timeout') {
    if (toggle === 'on' || toggle === null) {
      try {
        // The length of the timout defaults to 1 week if no time is given

        logger.debug(`[${PREFIX}] timeout minutes: ${minutes}`);
        target.timeout(minutes, reason);
        await target.user.send(
          `You have been quieted for ${ms(minutes, {long: true})}${reason ? ` because:\n ${reason}` : ''} `);
      } catch (err) {
        logger.error(`[${PREFIX}] Error: ${err}`);
      }
    } else {
      try {
        await target.user.send(`You have been unquieted because:\n${reason}`);
        target.timeout(0, reason);
        logger.debug(`[${PREFIX}] I untimeouted ${target.displayName} because\n '${reason}'!`);
      } catch (err) {
        logger.error(`[${PREFIX}] Error: ${err}`);
      }
    }
  } else if (command === 'kick') {
    try {
      // await target.user.send(`You have been kicked from the TripSit guild because\n ${reason}`);
      target.kick();
    } catch (err) {
      logger.error(`[${PREFIX}] Error: ${err}`);
    }
  } else if (command === 'ban') {
    if (toggle === 'on' || toggle === null) {
      try {
        // The length of the timout defaults to forever if no time is given
        minutes = duration ?
          await parseDuration(duration) :
          0;
        logger.debug(`[${PREFIX}] minutes: ${minutes}`);
        const targetGuild = await global.client.guilds.fetch(env.DISCORD_GUILD_ID);
        targetGuild.members.ban(target, {reason});
        // await targetUser.send(
        //     `You have been banned ${minutes ? `for ${ms(minutes, {long: true})}` : ''}\
        //   ${reason ? ` because\n ${reason}` : ''} `);
      } catch (err) {
        logger.error(`[${PREFIX}] Error: ${err}`);
      }
    } else {
      try {
        logger.debug(`[${PREFIX}] targetUser.id: ${target.user.id}`);
        const targetGuild = await global.client.guilds.fetch(env.DISCORD_GUILD_ID);
        const bans = await targetGuild.bans.fetch();
        logger.debug(`[${PREFIX}] targetGuild.bans.fetch(): ${bans}`);
        await targetGuild.bans.remove(target.user, reason);
        logger.debug(`[${PREFIX}] I unbanned ${target.displayName}!`);
        target.user.send(`You have been unbanned for ${reason}`);
      } catch (err) {
        logger.error(`[${PREFIX}] Error: ${err}`);
      }
    }
  }
  // else if (command === 'underban') {
  //     if (toggle === 'on' || toggle === null) {
  //       try {
  //         logger.debug(`[${PREFIX}] I would underban on discord`);
  //         await target.user.send(`You have been underbanned for
  // ${ms(minutes, { long: true })}${reason ? ` because:\n ${reason}` : ''} `);
  //       } catch (err) {
  //         logger.error(`[${PREFIX}] Error: ${err}`);
  //       }
  //     } else {
  //       try {
  //         logger.debug(`[${PREFIX}] I would remove underban on discord`);
  //         await target.user.send(`The underban has been removed because:\n${reason}`);
  //       } catch (err) {
  //         logger.error(`[${PREFIX}] Error: ${err}`);
  //       }
  //     }

  // Get the moderator role
  const tripsitGuild = await global.client.guilds.fetch(env.DISCORD_GUILD_ID) as Guild;
  const roleModerator = tripsitGuild.roles.cache.find((role:Role) => role.id === env.ROLE_MODERATOR) as Role;

  const targetEmbed = embedTemplate()
    .setColor(Colors.Blue)
  // .setImage(target.displayAvatarURL)
  // .setThumbnail(target.displayAvatarURL)
    .setDescription(`${actor} ${command}ed ${target.displayName}\
      ${targetChannel.name ? ` in ${targetChannel.name}` : ''}\
      ${duration ? ` for ${ms(minutes, {long: true})}` : ''}\
      ${reason ? ` because\n ${reason}` : ''}`)
    .addFields(
      {name: 'Displayname', value: `${target.displayName}`, inline: true},
      {name: 'Username', value: `${target.user.username}`, inline: true},
      {name: 'ID', value: `${target.id}`, inline: true},
    );
  targetEmbed.addFields(
    {
      name: 'Created',
      value: `${time(target.user.createdAt, 'R')}`, inline: true},
    {name: 'Joined', value: `${target.joinedAt ? time(target.joinedAt!, 'R') : 'Unknown'}`, inline: true},
  );

  if (command === 'info') {
    try {
      const reply = {embeds: [targetEmbed], ephemeral: true};
      logger.debug(`[${PREFIX}] returned info about ${target.displayName}`);
      logger.debug(`[${PREFIX}] finished!`);
      return reply;
    } catch (err) {
      logger.error(`[${PREFIX}] Error: ${err}`);
    }
  }

  logger.debug(`[${PREFIX}] CHANNEL_MODERATORS: ${env.CHANNEL_MODERATORS}`);
  const modChan = await global.client.channels.fetch(env.CHANNEL_MODERATORS) as TextChannel;
  // We must send the mention outside of the embed, cuz mentions dont work in embeds
  if (command !== 'note') {
    modChan.send(`Hey <@&${roleModerator.id}>!`);
  }
  modChan.send({embeds: [targetEmbed]});
  logger.debug(`[${PREFIX}] sent a message to the moderators room`);

  const modlog = await global.client.channels.fetch(env.CHANNEL_MODLOG) as TextChannel;
  modlog.send({embeds: [targetEmbed]});
  logger.debug(`[${PREFIX}] sent a message to the modlog room`);

  logger.debug(`[${PREFIX}] ${target.displayName} has been ${command}ed!`);
  const response = embedTemplate()
    .setColor(Colors.Yellow)
    .setDescription(`${target.displayName} has been ${command}ed!`);
  return {embeds: [response], ephemeral: true};
};
