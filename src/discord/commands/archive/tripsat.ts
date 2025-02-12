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
import { stripIndents } from 'common-tags';
import { embedTemplate } from '../../utils/embedTemplate';

const F = f(__filename);

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
  env.ROLE_REDORANGE,
  env.ROLE_ORANGE,
  env.ROLE_YELLOW,
  env.ROLE_YELLOWGREEN,
  env.ROLE_GREEN,
  env.ROLE_GREENBLUE,
  env.ROLE_BLUE,
  env.ROLE_BLUEPURPLE,
  env.ROLE_PURPLE,
  env.ROLE_PINK,
  env.ROLE_PINKRED,
  env.ROLE_WHITE,

  env.ROLE_DONOR_RED,
  env.ROLE_DONOR_REDORANGE,
  env.ROLE_DONOR_ORANGE,
  env.ROLE_DONOR_YELLOW,
  env.ROLE_DONOR_YELLOWGREEN,
  env.ROLE_DONOR_GREEN,
  env.ROLE_DONOR_GREENBLUE,
  env.ROLE_DONOR_BLUE,
  env.ROLE_DONOR_BLUEPURPLE,
  env.ROLE_DONOR_PURPLE,
  env.ROLE_DONOR_PINK,
  env.ROLE_DONOR_PINKRED,
  env.ROLE_DONOR_BLACK,
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
  env.ROLE_TALKATIVE,
  env.ROLE_VOICECHATTY,
  env.ROLE_BUSY,
  env.ROLE_EVENT_1,
  env.ROLE_EVENT_2,
  env.ROLE_EVENT_3,
  env.ROLE_EVENT_4,
  env.ROLE_EVENT_5,
  env.ROLE_EVENT_6,
  env.ROLE_EVENT_7,
  env.ROLE_EVENT_8,
  env.ROLE_EVENT_9,
  env.ROLE_EVENT_10,
  env.ROLE_EVENT_11,
];

const ignoredRoles = `${teamRoles},${colorRoles},${mindsetRoles}`;

const testNotice = '🧪THIS IS A TEST PLEASE IGNORE🧪\n\n';

const invisibleEmoji = env.NODE_ENV === 'production'
  ? '<:invisible:976853930489298984>'
  : '<:invisible:976824380564852768>';

/**
 * Handles removing of the NeedsHelp mode
 * @param {ButtonInteraction} interaction
 */
export async function tripsat(
  interaction:ButtonInteraction,
) {
// log.debug(F, `starting!`);
  await interaction.deferReply({ ephemeral: true });
  if (!interaction.guild) {
  // log.debug(F, `no guild!`);
    await interaction.reply('This must be performed in a guild!');
    return;
  }
  if (!interaction.member) {
  // log.debug(F, `no member!`);
    await interaction.reply('This must be performed by a member of a guild!');
    return;
  }

  const meOrThem = interaction.customId.split('~')[1];
  const targetId = interaction.customId.split('~')[2];
  // const threadId = interaction.customId.split('~')[3];
  const needsHelpId = interaction.customId.split('~')[4];

  const target = await interaction.guild?.members.fetch(targetId)!;
  const actor = interaction.member as GuildMember;

  if (meOrThem === 'me' && targetId !== actor.id) {
  // log.debug(F, `not the target!`);
    await interaction.reply({ content: 'Only the user receiving help can click this button!', ephemeral: true });
    return;
  }

  const targetLastHelpedDate = new Date();
  const targetLastHelpedThreadId = '';
  const targetLastHelpedMetaThreadId = '';
  const targetRoles:string[] = [];

// log.debug(F, `targetLastHelpedDate: ${targetLastHelpedDate}`);
// log.debug(F, `targetLastHelpedThreadId: ${targetLastHelpedThreadId}`);
// log.debug(F, `targetLastHelpedMetaThreadId: ${targetLastHelpedMetaThreadId}`);

  // const channelOpentripsit = await interaction.client.channels.cache.get(env.CHANNEL_OPENTRIPSIT);
  // const channelSanctuary = await interaction.client.channels.cache.get(env.CHANNEL_SANCTUARY);
  // Get the channel objects for the help and meta threads
  const threadHelpUser = interaction.guild.channels.cache
    .find(chan => chan.id === targetLastHelpedThreadId) as ThreadChannel;
  const threadDiscussUser = interaction.guild.channels.cache
    .find(chan => chan.id === targetLastHelpedMetaThreadId) as ThreadChannel;

  const actorHasRoleDeveloper = (actor as GuildMember).permissions.has(PermissionsBitField.Flags.Administrator);
// log.debug(F, `actorHasRoleDeveloper: ${actorHasRoleDeveloper}`);

  const targetHasRoleDeveloper = (target as GuildMember).permissions.has(PermissionsBitField.Flags.Administrator);
// log.debug(F, `targetHasRoleDeveloper: ${targetHasRoleDeveloper}`);

  const roleNeedshelp = await interaction.guild.roles.fetch(needsHelpId)!;
  const targetHasNeedsHelpRole = (target.roles as GuildMemberRoleManager).cache.find(
    (role:Role) => role === roleNeedshelp,
  ) !== undefined;
// log.debug(F, `targetHasNeedsHelpRole: ${targetHasNeedsHelpRole}`);

  if (!targetHasNeedsHelpRole) {
    let rejectMessage = `Hey ${interaction.member}, you're not currently being taken care of!`;

    if (actorHasRoleDeveloper && targetHasRoleDeveloper) {
      rejectMessage = testNotice + rejectMessage;
    }
    const embed = embedTemplate().setColor(Colors.DarkBlue);
    embed.setDescription(rejectMessage);
  // log.debug(F, `target ${target} does not need help!`);
    await interaction.editReply({ embeds: [embed] });
    return;
  }

  if (targetLastHelpedDate) {
    const lastHour = Date.now() - (1000 * 60 * 60);
  // log.debug(F, `lastHelp: ${targetLastHelpedDate.valueOf() * 1000}`);
  // log.debug(F, `lastHour: ${lastHour.valueOf()}`);
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
      await interaction.editReply({ embeds: [embed] });

      if (threadDiscussUser) {
        let metaUpdate = stripIndents`Hey team, ${target.nickname || target.user.username} said they're good \
but it's been less than an hour since they asked for help.

If they still need help it's okay to leave them with that role.`;
        if (actorHasRoleDeveloper && targetHasRoleDeveloper) {
          metaUpdate = testNotice + metaUpdate;
        }
        await threadDiscussUser.send(metaUpdate);
      }

    // log.debug(F, `Rejected the "im good" button`);
      return;
    }
  }

  // For each role in targetRoles2, add it to the target
  if (targetRoles) {
    targetRoles.forEach(async roleId => {
    // log.debug(F, `Re-adding roleId: ${roleId}`);
      const roleObj = interaction.guild!.roles.cache.find(r => r.id === roleId) as Role;
      if (!ignoredRoles.includes(roleObj.id) && roleObj.name !== '@everyone') {
      // log.debug(F, `Adding role ${roleObj.name} to ${target.nickname || target.user.username}`);
        await target.roles.add(roleObj);
      }
    });
  }

  await target.roles.remove(roleNeedshelp!);
// log.debug(F, `Removed ${roleNeedshelp!.name} from ${target.nickname || target.user.username}`);

  let endHelpMessage = stripIndents`Hey ${target}, we're glad you're doing better!
      We've restored your old roles back to normal <3
      This thread will remain here for a day if you want to follow up tomorrow.
      After 7 days, or on request, it will be deleted to preserve your privacy =)`;

  if (actorHasRoleDeveloper && targetHasRoleDeveloper) {
    endHelpMessage = testNotice + endHelpMessage;
  }

  await threadHelpUser.send(endHelpMessage);

  let message:Message;
  await threadHelpUser.send(stripIndents`
        ${invisibleEmoji}
        > **If you have a minute, your feedback is important to us!**
        > Please rate your experience with the TripSit service by reacting below.
        > Thank you!
        ${invisibleEmoji}
        `)
    .then(async msg => {
      message = msg;
      await msg.react('🙁');
      await msg.react('😕');
      await msg.react('😐');
      await msg.react('🙂');
      await msg.react('😁');

      // Setup the reaction collector
      const filter = (reaction:MessageReaction, user:User) => user.id === target.id;
      const collector = message.createReactionCollector({ filter, time: 1000 * 60 * 60 * 24 });
      collector.on('collect', async (reaction, user) => {
        await threadHelpUser.send(stripIndents`
            ${invisibleEmoji}
            > Thank you for your feedback, here's a cookie! 🍪
            ${invisibleEmoji}
            `);
      // log.debug(F, `Collected ${reaction.emoji.name} from ${user.tag}`);
        const finalEmbed = embedTemplate()
          .setColor(Colors.Blue)
          .setDescription(`Collected ${reaction.emoji.name} from ${user.tag}`);
        try {
          if (threadDiscussUser) {
            await threadDiscussUser.send({ embeds: [finalEmbed] });
          }
        } catch (err) {
        // log.debug(F, `Failed to send message, am i still in the tripsit guild?`);
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

  await threadDiscussUser.send(endMetaHelpMessage);

// log.debug(F, `target ${target} is no longer being helped!`);
  await interaction.editReply({ content: 'Done!' });
}
