import {
  Colors,
  GuildMember,
  Role,
  ThreadChannel,
  ButtonInteraction,
  GuildMemberRoleManager,
  Message,
  MessageReaction,
  User,
  // ChatInputCommandInteraction,
  PermissionsBitField,
  // TextChannel,
} from 'discord.js';
import env from '../../../global/utils/env.config';
import {stripIndents} from 'common-tags';
import log from '../../../global/utils/log';
import {embedTemplate} from '../../utils/embedTemplate';

import {parse} from 'path';
const PREFIX = parse(__filename).name;

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

const colorRoles = [
  env.ROLE_TREE,
  env.ROLE_SPROUT,
  env.ROLE_SEEDLING,
  env.ROLE_BOOSTER,
  env.ROLE_RED,
  env.ROLE_ORANGE,
  env.ROLE_YELLOW,
  env.ROLE_GREEN,
  env.ROLE_BLUE,
  env.ROLE_PURPLE,
  env.ROLE_PINK,
  // env.ROLE_BROWN,
  env.ROLE_BLACK,
  env.ROLE_WHITE,
];

const mindsetRoles = [
  env.ROLE_DRUNK,
  env.ROLE_HIGH,
  env.ROLE_ROLLING,
  env.ROLE_TRIPPING,
  env.ROLE_DISSOCIATING,
  env.ROLE_STIMMING,
  env.ROLE_NODDING,
  env.ROLE_SOBER,
];

const ignoredRoles = `${teamRoles},${colorRoles},${mindsetRoles}`;

const testNotice = '🧪THIS IS A TEST PLEASE IGNORE🧪\n\n';

const invisibleEmoji = env.NODE_ENV === 'production' ?
  '<:invisible:976853930489298984>' :
  '<:invisible:976824380564852768>';

/**
 * Handles removing of the NeedsHelp mode
 * @param {ButtonInteraction} interaction
 */
export async function tripsat(
  interaction:ButtonInteraction,
) {
  log.debug(`[${PREFIX}] starting!`);
  await interaction.deferReply({ephemeral: true});
  if (!interaction.guild) {
    log.debug(`[${PREFIX}] no guild!`);
    interaction.reply('This must be performed in a guild!');
    return;
  }
  if (!interaction.member) {
    log.debug(`[${PREFIX}] no member!`);
    interaction.reply('This must be performed by a member of a guild!');
    return;
  }

  const meOrThem = interaction.customId.split('~')[1];
  const targetId = interaction.customId.split('~')[2];
  // const threadId = interaction.customId.split('~')[3];
  const needsHelpId = interaction.customId.split('~')[4];

  const target = await interaction.guild?.members.fetch(targetId)!;
  const actor = interaction.member as GuildMember;

  if (meOrThem === 'me' && targetId !== actor.id) {
    log.debug(`[${PREFIX}] not the target!`);
    interaction.reply({content: 'Only the user receiving help can click this button!', ephemeral: true});
    return;
  }

  let targetLastHelpedDate = new Date();
  let targetLastHelpedThreadId = '';
  let targetLastHelpedMetaThreadId = '';
  let targetRoles:string[] = [];

  log.debug(`[${PREFIX}] targetLastHelpedDate: ${targetLastHelpedDate}`);
  log.debug(`[${PREFIX}] targetLastHelpedThreadId: ${targetLastHelpedThreadId}`);
  log.debug(`[${PREFIX}] targetLastHelpedMetaThreadId: ${targetLastHelpedMetaThreadId}`);

  // const channelOpentripsit = await interaction.client.channels.cache.get(env.CHANNEL_OPENTRIPSIT);
  // const channelSanctuary = await interaction.client.channels.cache.get(env.CHANNEL_SANCTUARY);
  // Get the channel objects for the help and meta threads
  const threadHelpUser = interaction.guild.channels.cache
    .find((chan) => chan.id === targetLastHelpedThreadId) as ThreadChannel;
  const threadDiscussUser = interaction.guild.channels.cache
    .find((chan) => chan.id === targetLastHelpedMetaThreadId) as ThreadChannel;

  const actorHasRoleDeveloper = (actor as GuildMember).permissions.has(PermissionsBitField.Flags.Administrator);
  log.debug(`[${PREFIX}] actorHasRoleDeveloper: ${actorHasRoleDeveloper}`);

  const targetHasRoleDeveloper = (target as GuildMember).permissions.has(PermissionsBitField.Flags.Administrator);
  log.debug(`[${PREFIX}] targetHasRoleDeveloper: ${targetHasRoleDeveloper}`);

  const roleNeedshelp = await interaction.guild.roles.fetch(needsHelpId)!;
  const targetHasNeedsHelpRole = (target.roles as GuildMemberRoleManager).cache.find(
    (role:Role) => role === roleNeedshelp,
  ) !== undefined;
  log.debug(`[${PREFIX}] targetHasNeedsHelpRole: ${targetHasNeedsHelpRole}`);

  if (!targetHasNeedsHelpRole) {
    let rejectMessage = `Hey ${interaction.member}, you're not currently being taken care of!`;

    if (actorHasRoleDeveloper && targetHasRoleDeveloper) {
      rejectMessage = testNotice + rejectMessage;
    }
    const embed = embedTemplate().setColor(Colors.DarkBlue);
    embed.setDescription(rejectMessage);
    log.debug(`[${PREFIX}] target ${target} does not need help!`);
    interaction.editReply({embeds: [embed]});
    return;
  }

  if (targetLastHelpedDate) {
    const lastHour = Date.now() - (1000 * 60 * 60);
    log.debug(`[${PREFIX}] lastHelp: ${targetLastHelpedDate.valueOf() * 1000}`);
    log.debug(`[${PREFIX}] lastHour: ${lastHour.valueOf()}`);
    if (targetLastHelpedDate.valueOf() * 1000 > lastHour.valueOf()) {
      let message = stripIndents`Hey ${interaction.member} you just asked for help recently!
        Take a moment to breathe and wait for someone to respond =)
        Maybe try listening to some lofi music while you wait?`;

      if (actorHasRoleDeveloper && targetHasRoleDeveloper) {
        message = testNotice + message;
      }

      const embed = embedTemplate()
        .setColor(Colors.DarkBlue)
        .setDescription(message);
      interaction.editReply({embeds: [embed]});

      if (threadDiscussUser) {
        let metaUpdate = stripIndents`Hey team, ${target.nickname || target.user.username} said they're good \
but it's been less than an hour since they asked for help.

If they still need help it's okay to leave them with that role.`;
        if (actorHasRoleDeveloper && targetHasRoleDeveloper) {
          metaUpdate = testNotice + metaUpdate;
        }
        threadDiscussUser.send(metaUpdate);
      }

      log.debug(`[${PREFIX}] Rejected the "im good" button`);
      return;
    }
  }

  // For each role in targetRoles2, add it to the target
  if (targetRoles) {
    targetRoles.forEach((roleId) => {
      log.debug(`[${PREFIX}] Re-adding roleId: ${roleId}`);
      const roleObj = interaction.guild!.roles.cache.find((r) => r.id === roleId) as Role;
      if (!ignoredRoles.includes(roleObj.id) && roleObj.name !== '@everyone') {
        log.debug(`[${PREFIX}] Adding role ${roleObj.name} to ${target.nickname || target.user.username}`);
        try {
          target.roles.add(roleObj);
        } catch (err) {
          log.error(`[${PREFIX}] Error adding role ${roleObj.name} to ${target.nickname || target.user.username}`);
          log.error(err);
        }
      }
    });
  }

  target.roles.remove(roleNeedshelp!);
  log.debug(`[${PREFIX}] Removed ${roleNeedshelp!.name} from ${target.nickname || target.user.username}`);

  let endHelpMessage = stripIndents`Hey ${target}, we're glad you're doing better!
      We've restored your old roles back to normal <3
      This thread will remain here for a day if you want to follow up tomorrow.
      After 7 days, or on request, it will be deleted to preserve your privacy =)`;

  if (actorHasRoleDeveloper && targetHasRoleDeveloper) {
    endHelpMessage = testNotice + endHelpMessage;
  }

  try {
    threadHelpUser.send(endHelpMessage);
  } catch (err) {
    log.error(`[${PREFIX}] Error sending end help message to ${threadHelpUser}`);
    log.error(err);
  }

  let message:Message;
  await threadHelpUser.send(stripIndents`
        ${invisibleEmoji}
        > **If you have a minute, your feedback is important to us!**
        > Please rate your experience with the TripSit service by reacting below.
        > Thank you!
        ${invisibleEmoji}
        `)
    .then(async (msg) => {
      message = msg;
      await msg.react('🙁');
      await msg.react('😕');
      await msg.react('😐');
      await msg.react('🙂');
      await msg.react('😁');

      // Setup the reaction collector
      const filter = (reaction:MessageReaction, user:User) => user.id === target.id;
      const collector = message.createReactionCollector({filter, time: 1000 * 60 * 60 * 24});
      collector.on('collect', async (reaction, user) => {
        threadHelpUser.send(stripIndents`
            ${invisibleEmoji}
            > Thank you for your feedback, here's a cookie! 🍪
            ${invisibleEmoji}
            `);
        log.debug(`[${PREFIX}] Collected ${reaction.emoji.name} from ${user.tag}`);
        const finalEmbed = embedTemplate()
          .setColor(Colors.Blue)
          .setDescription(`Collected ${reaction.emoji.name} from ${user.tag}`);
        try {
          if (threadDiscussUser) {
            await threadDiscussUser.send({embeds: [finalEmbed]});
          }
        } catch (err) {
          log.debug(`[${PREFIX}] Failed to send message, am i still in the tripsit guild?`);
        }
        msg.delete();
        collector.stop();
      });
    });

  let endMetaHelpMessage = stripIndents`${target.displayName} has indicated that they no longer need help!
      *This thread, and the #tripsit thread, will remain un-archived for 24 hours to allow the user to follow-up.
      If the user requests help again within 7 days these threads will be un-archived.
      After 7 days the threads will be deleted to preserve privacy.*`;

  if (actorHasRoleDeveloper && targetHasRoleDeveloper) {
    endMetaHelpMessage = testNotice + endMetaHelpMessage;
  }

  threadDiscussUser.send(endMetaHelpMessage);

  log.debug(`[${PREFIX}] target ${target} is no longer being helped!`);
  await interaction.editReply({content: 'Done!'});
};
