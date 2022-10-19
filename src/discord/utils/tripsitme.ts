/* eslint-disable max-len */
import {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  ButtonBuilder,
  ModalSubmitInteraction,
  TextChannel,
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
  // MessageFlags,
  MessageMentionTypes,
} from 'discord.js';
import {
  TextInputStyle,
  ChannelType,
  ButtonStyle,
} from 'discord-api-types/v10';
import env from '../../global/utils/env.config';
import {stripIndents} from 'common-tags';
import logger from '../../global/utils/logger';
import {embedTemplate} from '../utils/embedTemplate';

import * as path from 'path';
const PREFIX = path.parse(__filename).name;

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

const otherRoles = [
  env.ROLE_VERIFIED,
];

const ignoredRoles = `${teamRoles},${colorRoles},${mindsetRoles},${otherRoles}`;

/**
 * Creates the tripsit modal
 * @param {ButtonInteraction} interaction The interaction that started this
 */
export async function tripsitmeClick(interaction:ButtonInteraction) {
  // Create the modal

  // logger.debug(`[${PREFIX}] interaction.customId: ${interaction.customId}`);
  const roleNeedshelpId = interaction.customId.split('~')[1];
  const roleTripsitterId = interaction.customId.split('~')[2];
  const channelTripsittersId = interaction.customId.split('~')[3];

  // logger.debug(`[${PREFIX}] roleNeedshelpId: ${roleNeedshelpId}\n
  // roleTripsitterId: ${roleTripsitterId}\n
  // channelTripsittersId: ${channelTripsittersId}`);

  const modal = new ModalBuilder()
    .setCustomId(`tripsitmeSubmit~${roleNeedshelpId}~${roleTripsitterId}~${channelTripsittersId}`)
    .setTitle('Tripsitter Help Request');
  modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder()
    .setCustomId('triageInput')
    .setLabel('What substance? How much taken? What time?')
    .setStyle(TextInputStyle.Short)));
  modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder()
    .setCustomId('introInput')
    .setLabel('What\'s going on? Give us the details!')
    .setStyle(TextInputStyle.Paragraph)));
  await interaction.showModal(modal);
}

/**
 * This handles the submission of the tripsit modal
 * @param {ModalSubmitInteraction} interaction The interaction that was submitted
 * @param {GuildMember?} memberInput The member being aced upon
 * @param {string} triageGiven Given triage information
 * @param {string} introGiven Given intro information
 */
export async function tripsitmeSubmit(
  interaction:ModalSubmitInteraction,
  memberInput?:GuildMember,
  triageGiven?:string,
  introGiven?:string,
) {
  logger.debug(`[${PREFIX}] Submit starting!`);
  logger.debug(`[${PREFIX}] memberInput: ${memberInput}`);

  if (!interaction.guild) {
    logger.debug(`[${PREFIX}] no guild!`);
    interaction.reply('This must be performed in a guild!');
    return;
  }
  if (!interaction.member) {
    logger.debug(`[${PREFIX}] no member!`);
    interaction.reply('This must be performed by a member of a guild!');
    return;
  }

  // logger.debug(`[${PREFIX}] interaction.customId: ${interaction.customId}`);
  const roleNeedshelpId = interaction.customId.split('~')[1];
  const roleTripsitterId = interaction.customId.split('~')[2];
  const channelTripsitters = interaction.customId.split('~')[3];

  // logger.debug(`[${PREFIX}] roleNeedshelpId: ${roleNeedshelpId}\n
  // roleTripsitterId: ${roleTripsitterId}\n
  // channelTripsittersId: ${channelTripsittersId}`);

  // Get the input from the modal, if it was submitted
  let triageInput = triageGiven;
  let introInput = introGiven;
  // Otherwise get the input from the modal, if it was submitted
  if ((interaction as ModalSubmitInteraction).fields) {
    triageInput = (interaction as ModalSubmitInteraction).fields.getTextInputValue('triageInput');
    introInput = (interaction as ModalSubmitInteraction).fields.getTextInputValue('introInput');
  }
  logger.debug(`[${PREFIX}] triageInput: ${triageInput}`);
  logger.debug(`[${PREFIX}] introInput: ${introInput}`);

  // Get the roles we'll be referencing
  const roleNeedshelp = await interaction.guild.roles.fetch(roleNeedshelpId) as Role;
  logger.debug(`[${PREFIX}] roleNeedshelp: ${roleNeedshelp}`);
  const roleHelper = await interaction.guild.roles.fetch(roleTripsitterId) as Role;
  logger.debug(`[${PREFIX}] roleHelper: ${roleHelper}`);
  const roleTripsitter = interaction.guild.roles.cache.find((role) => role.id === env.ROLE_TRIPSITTER) as Role;
  logger.debug(`[${PREFIX}] roleTripsitter: ${roleTripsitter}`);

  // Get the channels we'll be referencing
  // const channelHowToTripsit = interaction.client.channels.cache
  //     .find((channel) => channel.id === env.CHANNEL_HOWTOTRIPSIT) as TextChannel;
  // logger.debug(`[${PREFIX}] channelHowToTripsit: ${channelHowToTripsit}`);

  // const channelOpenTripsit = interaction.guild.channels.cache
  //     .find((chan) => chan.id === env.CHANNEL_OPENTRIPSIT);

  // Determine the actor.
  const actor = interaction.member;
  logger.debug(`[${PREFIX}] actor: ${actor.user.username}#${actor.user.discriminator}`);

  // Determine if this command was started by a Developer
  const actorIsAdmin = (actor as GuildMember).permissions.has(PermissionsBitField.Flags.Administrator);
  const showMentions = actorIsAdmin ? [] : ['users', 'roles'] as MessageMentionTypes[];
  logger.debug(`[${PREFIX}] actorIsAdmin: ${actorIsAdmin}`);
  logger.debug(`[${PREFIX}] showMentions: ${showMentions}`);

  // Determine the target.
  // If the user clicked the button, the target is whoever started the interaction.
  // Otherwise, the target is the user mentioned in the /tripsit command.
  const target = (interaction.member || memberInput) as GuildMember;
  logger.debug(`[${PREFIX}] target: ${target}`);

  // Get a list of the target's roles
  const targetRoleNames = (target.roles as GuildMemberRoleManager).cache.map((role) => role.name);
  logger.debug(`[${PREFIX}] targetRoleNames: ${targetRoleNames}`);

  const targetRoleIds = (target.roles as GuildMemberRoleManager).cache.map((role) => role.id);
  logger.debug(`[${PREFIX}] targetRoleIds: ${targetRoleIds}`);

  // Check if the target already needs help
  const targetHasRoleNeedshelp = (target.roles as GuildMemberRoleManager).cache.find(
    (role) => role === roleNeedshelp,
  ) !== undefined;
  logger.debug(`[${PREFIX}] targetHasRoleNeedshelp: ${targetHasRoleNeedshelp}`);

  let targetLastHelpedDate = new Date();
  let targetLastHelpedThreadId = '';
  if (global.db) {
    const ref = db.ref(`${env.FIREBASE_DB_TIMERS}/${target.user.id}/`);
    await ref.once('value', (data) => {
      if (data.val() !== null) {
        Object.keys(data.val()).forEach((key) => {
          // logger.debug(`[${PREFIX}] data.val()[key]: ${JSON.stringify(data.val()[key], null, 2)}`);
          logger.debug(`[${PREFIX}] key: ${key}`);
          if (data.val()[key].type === 'helpthread') {
            targetLastHelpedDate = new Date(parseInt(key));
            targetLastHelpedThreadId = data.val()[key].value.lastHelpedThreadId;
          }
        });
      }
    });
  }

  logger.debug(`[${PREFIX}] targetLastHelpedDate: ${targetLastHelpedDate}`);
  logger.debug(`[${PREFIX}] targetLastHelpedThreadId: ${targetLastHelpedThreadId}`);

  // Get the channel objects for the help thread
  // const threadHelpUser = interaction.client.channels.cache.get(targetLastHelpedThreadId);
  let threadHelpUser = interaction.client.channels.cache.get(targetLastHelpedThreadId) as ThreadChannel;
  logger.debug(`[${PREFIX}] threadHelpUser: ${threadHelpUser}`);

  // ██╗   ██╗██████╗ ██████╗  █████╗ ████████╗███████╗
  // ██║   ██║██╔══██╗██╔══██╗██╔══██╗╚══██╔══╝██╔════╝
  // ██║   ██║██████╔╝██║  ██║███████║   ██║   █████╗
  // ██║   ██║██╔═══╝ ██║  ██║██╔══██║   ██║   ██╔══╝
  // ╚██████╔╝██║     ██████╔╝██║  ██║   ██║   ███████╗
  //  ╚═════╝ ╚═╝     ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚══════╝
  if (targetHasRoleNeedshelp && threadHelpUser !== undefined) {
    logger.debug(`[${PREFIX}] Target already needs help, updating existing threads!`);
    // A user will have the NeedsHelp role when they click the button.
    // After they click the button, their roles are saved and then removed
    // So we need to stop the code below from saving an empty list of roles
    // We trust that the button did it's job and saved the roles and applied the channels,
    // so it assumes that it doesn't need to do anything as long as the user has this role.

    // Remind the user that they have a channel open
    try {
      const message = memberInput ?
        stripIndents`Hey ${interaction.member}, ${target.displayName} is already being helped!

          Check your channel list for '${threadHelpUser.toString()} to help them!'` :
        stripIndents`Hey ${interaction.member}, you are already being helped!

          Check your channel list for '${threadHelpUser.toString()} to get help!`;

      const embed = embedTemplate()
        .setColor(Colors.DarkBlue)
        .setDescription(message);
      interaction.reply({embeds: [embed], ephemeral: true});
      logger.debug(`[${PREFIX}] Rejected need for help`);

      // Send the update message to the thread
      const helpMessage = memberInput ?
        stripIndents`
          Hey ${target}, the team thinks you could still use assistance!
          ${roleHelper} and ${roleTripsitter} will be with you as soon as they're available!
          If this is a medical emergency please contact your local /EMS
          We do not call EMS or ambulance on behalf of anyone.` :
        stripIndents`
          Hey ${target}, thank you for the update!

          You've taken: ${triageInput ? `\n${triageInput}` : '\n*No info given*'}

          Your issue: ${introInput ? `\n${introInput}` : '\n*No info given*'}

          ${roleHelper} and ${roleTripsitter} will be with you as soon as they're available!
          If this is a medical emergency please contact your local /EMS
          We do not call EMS or ambulance on behalf of anyone.`;

      if (threadHelpUser && !memberInput) {
        threadHelpUser.send({
          content: helpMessage,
          allowedMentions: {
            'parse': showMentions,
          },
        });
      }
      logger.debug(`[${PREFIX}] Pinged user in help thread`);

      return;
    } catch (err) {
      logger.debug(`[${PREFIX}] There was an error updating the help thread, it was likely deleted:\n ${err}`);
    }
  }

  // Team check - Cannot be run on team members
  // If this user is a developer then this is a test run and ignore this check,
  // but we'll change the output down below to make it clear this is a test.
  let targetIsTeamMember = false;
  if (!actorIsAdmin) {
    target.roles.cache.forEach(async (role) => {
      if (teamRoles.includes(role.id)) {
        targetIsTeamMember = true;
      }
    });
    if (targetIsTeamMember) {
      logger.debug(`[${PREFIX}] Target is a team member!`);
      const teamMessage = memberInput ?
        stripIndents`Hey ${actor}, ${target.displayName} is a team member!
          Did you mean to do that?` :
        stripIndents`You are a member of the team and cannot be publicly helped!`;
      const embed = embedTemplate()
        .setColor(Colors.DarkBlue)
        .setDescription(teamMessage);
      if (!interaction.replied) {
        await interaction.reply({embeds: [embed], ephemeral: true});
      }
      return;
    }
  }
  logger.debug(`[${PREFIX}] Target is not a team member!`);

  // Remove all roles, except team and vanity, from the target
  target.roles.cache.forEach((role) => {
    logger.debug(`[${PREFIX}] role: ${role.name} - ${role.id}`);
    if (!ignoredRoles.includes(role.id) && !role.name.includes('@everyone') && !role.name.includes('NeedsHelp')) {
      logger.debug(`[${PREFIX}] Removing role ${role.name} from ${target.displayName}`);
      try {
        target.roles.remove(role);
      } catch (err) {
        logger.debug(`[${PREFIX}] There was an error removing the role ${role.name} from ${target.displayName}\n${err}`);
      }
    }
  });

  // Add the needsHelp role to the target
  try {
    logger.debug(`[${PREFIX}] Adding role ${roleNeedshelp.name} to ${target.displayName}`);
    await target.roles.add(roleNeedshelp);
  } catch (err) {
    logger.error(`[${PREFIX}] Error adding role to target: ${err}`);
    return interaction.reply(stripIndents`There was an error adding the NeedsHelp role!
      Make sure the bot's role is higher than NeedsHelp in the Role list!`);
  }

  // ██████╗ ███████╗ ██████╗ ██████╗ ███████╗███╗   ██╗
  // ██╔══██╗██╔════╝██╔═══██╗██╔══██╗██╔════╝████╗  ██║
  // ██████╔╝█████╗  ██║   ██║██████╔╝█████╗  ██╔██╗ ██║
  // ██╔══██╗██╔══╝  ██║   ██║██╔═══╝ ██╔══╝  ██║╚██╗██║
  // ██║  ██║███████╗╚██████╔╝██║     ███████╗██║ ╚████║
  // ╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚═╝     ╚══════╝╚═╝  ╚═══╝
  // If the user has been helped in the last week, direct them to the existing thread
  if (targetLastHelpedDate) {
    const lastWeek = Date.now() - (1000 * 60 * 60 * 24 * 7);
    logger.debug(`[${PREFIX}] lastHelp: ${targetLastHelpedDate.valueOf()}`);
    logger.debug(`[${PREFIX}] lastWeek: ${lastWeek}`);
    if (targetLastHelpedDate.valueOf() > lastWeek) {
      logger.debug(`[${PREFIX}] Target was last helped within the last week!`);
      // Ping them in the open thread
      try {
        // Respond to the user and remind them they have an open thread
        const message = memberInput ?
          stripIndents`
              Hey ${actor}, thank you for requestiong assistance on the behalf of ${target.user.username}!

              Click here to be taken to their private room: ${threadHelpUser.toString()}

              You can also click in your channel list to see their private room!` :
          stripIndents`
              Hey ${target}, thank you for asking for assistance!

              Click here to be taken to your private room: ${threadHelpUser.toString()}

              You can also click in your channel list to see your private room!`;

        const embed = embedTemplate()
          .setColor(Colors.DarkBlue)
          .setDescription(message);

        interaction.reply({embeds: [embed], ephemeral: true});

        // Send the intro message to the thread
        const firstMessage = memberInput ?
          stripIndents`
            Hey ${target}, the team thinks you could still use assistance!
            ${roleHelper} and ${roleTripsitter} will be with you as soon as they're available!
            If this is a medical emergency please contact your local /EMS
            We do not call EMS or ambulance on behalf of anyone.` :
          stripIndents`
            Hey ${target}, thank you for asking for help!

            You've taken: ${triageInput ? `\n${triageInput}` : '\n*No info given*'}

            Your issue: ${introInput ? `\n${introInput}` : '\n*No info given*'}

            ${roleHelper} and ${roleTripsitter} will be with you as soon as they're available!
            If this is a medical emergency please contact your local /EMS
            We do not call EMS or ambulance on behalf of anyone.`;

        threadHelpUser.send({
          content: firstMessage,
          allowedMentions: {
            'parse': showMentions,
          },
        });
        threadHelpUser.setName(`🧡│${target.displayName}'s channel!`);

        if (global.db) {
          const threadArchiveTime = new Date();
          // define one week in milliseconds
          // const thirtySec = 1000 * 30;
          const tenMins = 1000 * 60 * 10;
          const oneDay = 1000 * 60 * 60 * 24;
          const archiveTime = env.NODE_ENV === 'production' ?
            threadArchiveTime.getTime() + oneDay :
            threadArchiveTime.getTime() + tenMins;
          threadArchiveTime.setTime(archiveTime);
          logger.debug(`[${PREFIX}] threadArchiveTime: ${threadArchiveTime}`);

          await db.ref(`${env.FIREBASE_DB_TIMERS}/${target.user.id}/${targetLastHelpedDate.valueOf()}`).remove();
          const ref = db.ref(`${env.FIREBASE_DB_TIMERS}/${target.user.id}/`);
          ref.set({
            [threadArchiveTime.valueOf()]: {
              type: 'helpthread',
              value: {
                lastHelpedThreadId: threadHelpUser.id,
                roles: targetRoleIds,
                status: 'open',
              },
            },
          });
        }

        logger.debug(`[${PREFIX}] finished!`);

        // Return here so that we don't create the new thread below
        return;
      } catch (err) {
        logger.info(`[${PREFIX}] The previous thread was likely deleted, starting fresh!`);
      }
    }
  }

  // ███╗   ██╗███████╗██╗    ██╗
  // ████╗  ██║██╔════╝██║    ██║
  // ██╔██╗ ██║█████╗  ██║ █╗ ██║
  // ██║╚██╗██║██╔══╝  ██║███╗██║
  // ██║ ╚████║███████╗╚███╔███╔╝
  // ╚═╝  ╚═══╝╚══════╝ ╚══╝╚══╝
  // Get the tripsitters channel from the guild

  // const tripsittersChannel = await interaction.guild?.channels.fetch(channelTripsittersId)! as TextChannel;

  // Get the tripsit channel from the guild
  const tripsitChannel = interaction.channel as TextChannel;

  // Create a new private thread in the channel
  // If we're not in production we need to create a public thread
  threadHelpUser = await tripsitChannel.threads.create({
    name: `🧡│${target.displayName}'s channel!`,
    autoArchiveDuration: 1440,
    type: interaction.guild?.premiumTier > 2 ? ChannelType.GuildPrivateThread : ChannelType.GuildPublicThread,
    reason: `${target.displayName} requested help`,
  }) as ThreadChannel;
  logger.debug(`[${PREFIX}] Created threadHelpUser ${threadHelpUser.id}`);

  // Send the triage info to the thread
  const replyMessage = memberInput ?
    stripIndents`
        Hey ${interaction.member}, we've activated tripsit mode on ${target.user.username}!

        Check your channel list for ${threadHelpUser.toString()} to talk to the user

        **Be sure add some information about the user to the thread!**` :
    stripIndents`
        Hey ${target}, thank you for asking for assistance!

        Click here to be taken to your private room: ${threadHelpUser.toString()}

        You can also click in your channel list to see your private room!`;

  const embed = embedTemplate()
    .setColor(Colors.DarkBlue)
    .setDescription(replyMessage);
  interaction.reply({embeds: [embed], ephemeral: true});
  logger.debug(`[${PREFIX}] Sent response to user`);

  // Send the intro message to the threadHelpUser
  const firstMessage = memberInput ?
    stripIndents`
      Hey ${target}, the team thinks you could use assistance!
      ${roleHelper} and ${roleTripsitter} will be with you as soon as they're available!
      If this is a medical emergency please contact your local /EMS: we do not call EMS on behalf of anyone.` :
    stripIndents`
      Hey ${target}, thank you for asking for assistance!

      You've taken: ${triageInput ? `\n${triageInput}` : '\n*No info given*'}

      Your issue: ${introInput ? `\n${introInput}` : '\n*No info given*'}

      ${roleHelper} and ${roleTripsitter} will be with you as soon as they're available!
      If this is a medical emergency please contact your local /EMS: we do not call EMS on behalf of anyone.
      When you're feeling better you can use the "I'm Good" button to let the team know you're okay.
      If you just would like someone to talk to, check out the warmline directory: https://warmline.org/warmdir.html#directory
      `;

  const row = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`tripsitmeFinish~me~${target.id}~${roleNeedshelp.id}~${channelTripsitters}`)
        .setLabel('I\'m good now!')
        .setStyle(ButtonStyle.Success),
    );

  threadHelpUser.send({
    content: firstMessage,
    components: [row],
    allowedMentions: {
      'parse': showMentions,
    },
    flags: ['SuppressEmbeds'],
  });

  logger.debug(`[${PREFIX}] Sent intro message to threadHelpUser ${threadHelpUser.id}`);

  // Send the intro message to the thread
  // const helperMsg = memberInput ?
  //   stripIndents`
  //     Hey ${roleHelper} and ${roleTripsitter}, ${actor} thinks ${target.displayName} can use some help in ${threadHelpUser.toString()}!

  //     They've taken: ${triageInput ? `\n${triageInput}` : '\n*No info given*'}

  //     Their issue: ${introInput ? `\n${introInput}` : '\n*No info given*'}

  //     Please read the log before interacting and use this thread to coordinate efforts with your fellow Tripsitters/Helpers!

  //     *You're receiving this alert because you're a Tripsitter!*
  //     *Only Tripsitters, Helpers and Moderators can see this thread*!
  //     **Keep in mind: We're not qualified to handle suicidal users here. If the user is considering / talking about suicide, direct them to the suicide hotline!**` :
  //   stripIndents`
  //     Hey ${roleHelper} and ${roleTripsitter}, ${target.displayName} can use some help in ${threadHelpUser.toString()}!

  //     They've taken: ${triageInput ? `\n${triageInput}` : '\n*No info given*'}

  //     Their issue: ${introInput ? `\n${introInput}` : '\n*No info given*'}

  //     Please read the log before interacting and use this thread to coordinate efforts with your fellow Tripsitters/Helpers!

  //     *You're receiving this alert because you're a Tripsitter!*
  //     *Only Tripsitters and Moderators can see this thread*!
  //     **Keep in mind: We're not qualified to handle suicidal users here. If the user is considering / talking about suicide, direct them to the suicide hotline!**`;
  // send a message to the thread

  // const endSession = new ActionRowBuilder<ButtonBuilder>()
  //   .addComponents(
  //     new ButtonBuilder()
  //       .setCustomId(`tripsitmeFinish~them~${target.id}~${threadHelpUser.id}~${roleNeedshelp.id}`)
  //       .setLabel('They\'re good now!')
  //       .setStyle(ButtonStyle.Success),
  //   );

  // Update targetData with how many times they've been helped
  // logger.debug(`[${PREFIX}] Updating target data`);
  // if ('discord' in targetData) {
  //   if ('modActions' in targetData.discord) {
  //     targetData.discord.modActions[targetAction] = (
  //       targetData.discord.modActions[targetAction] || 0) + 1;
  //   } else {
  //     targetData.discord.modActions = {[targetAction]: 1};
  //   }
  // } else {
  //   targetData.discord = {modActions: {[targetAction]: 1}};
  // }

  const threadArchiveTime = new Date();
  // define one week in milliseconds
  // const thirtySec = 1000 * 30;
  const tenMins = 1000 * 60 * 10;
  const oneDay = 1000 * 60 * 60 * 24;
  const archiveTime = env.NODE_ENV === 'production' ?
    threadArchiveTime.getTime() + oneDay :
    threadArchiveTime.getTime() + tenMins;
  threadArchiveTime.setTime(archiveTime);
  logger.debug(`[${PREFIX}] threadArchiveTime: ${threadArchiveTime}`);

  if (global.db) {
    const ref = db.ref(`${env.FIREBASE_DB_TIMERS}/${target.user.id}/`);
    ref.set({
      [threadArchiveTime.valueOf()]: {
        type: 'helpthread',
        value: {
          lastHelpedThreadId: threadHelpUser.id,
          roles: targetRoleIds,
          status: 'open',
        },
      },
    });
  }


  logger.debug(`[${PREFIX}] finished!`);
};

/**
 * Handles removing of the NeedsHelp mode
 * @param {ButtonInteraction} interaction
 */
export async function tripsitmeFinish(
  interaction:ButtonInteraction,
) {
  logger.debug(`[${PREFIX}] Finish starting!`);
  await interaction.deferReply({ephemeral: true});
  if (!interaction.guild) {
    logger.debug(`[${PREFIX}] no guild!`);
    interaction.editReply('This must be performed in a guild!');
    return;
  }
  if (!interaction.member) {
    logger.debug(`[${PREFIX}] no member!`);
    interaction.editReply('This must be performed by a member of a guild!');
    return;
  }

  const meOrThem = interaction.customId.split('~')[1];
  const targetId = interaction.customId.split('~')[2];
  const roleNeedshelpId = interaction.customId.split('~')[3];
  const channelTripsittersId = interaction.customId.split('~')[4];

  const target = await interaction.guild?.members.fetch(targetId)!;
  const actor = interaction.member as GuildMember;

  if (meOrThem === 'me' && targetId !== actor.id) {
    logger.debug(`[${PREFIX}] not the target!`);
    interaction.editReply({content: 'Only the user receiving help can click this button!'});
    return;
  }

  let targetLastHelpedDate = new Date();
  let targetLastHelpedThreadId = '';
  let targetRoles:string[] = [];

  if (global.db) {
    const ref = db.ref(`${env.FIREBASE_DB_TIMERS}/${target.user.id}/`);
    await ref.once('value', (data) => {
      if (data.val() !== null) {
        Object.keys(data.val()).forEach((key) => {
          // logger.debug(`[${PREFIX}] data.val()[key]: ${JSON.stringify(data.val()[key], null, 2)}`);
          logger.debug(`[${PREFIX}] key: ${key}`);
          if (data.val()[key].type === 'helpthread') {
            targetLastHelpedDate = new Date(parseInt(key));
            targetLastHelpedThreadId = data.val()[key].value.lastHelpedThreadId;
            targetRoles = data.val()[key].value.roles;
          }
        });
      }
    });
  }

  logger.debug(`[${PREFIX}] targetLastHelpedDate: ${targetLastHelpedDate}`);
  logger.debug(`[${PREFIX}] targetLastHelpedThreadId: ${targetLastHelpedThreadId}`);

  // const channelOpentripsit = await interaction.client.channels.cache.get(env.CHANNEL_OPENTRIPSIT);
  // const channelSanctuary = await interaction.client.channels.cache.get(env.CHANNEL_SANCTUARY);
  // Get the channel objects for the help thread
  const threadHelpUser = interaction.guild.channels.cache
    .find((chan) => chan.id === targetLastHelpedThreadId) as ThreadChannel;
  logger.debug(`[${PREFIX}] threadHelpUser: ${threadHelpUser.name} = 💚│${target.displayName}'s channel!`);
  threadHelpUser.setName(`💚│${target.displayName}'s channel!`);

  const roleNeedshelp = await interaction.guild.roles.fetch(roleNeedshelpId)!;
  const targetHasNeedsHelpRole = (target.roles as GuildMemberRoleManager).cache.find(
    (role:Role) => role === roleNeedshelp,
  ) !== undefined;
  logger.debug(`[${PREFIX}] targetHasNeedsHelpRole: ${targetHasNeedsHelpRole}`);

  if (!targetHasNeedsHelpRole) {
    const rejectMessage = `Hey ${interaction.member}, ${meOrThem === 'me' ? 'you\'re' : `${target} is`} not currently being taken care of!`;

    const embed = embedTemplate().setColor(Colors.DarkBlue);
    embed.setDescription(rejectMessage);
    logger.debug(`[${PREFIX}] target ${target} does not need help!`);
    interaction.editReply({embeds: [embed]});
    logger.debug(`[${PREFIX}] finished!`);
    return;
  }

  // if (targetLastHelpedDate && meOrThem === 'me') {
  //   const lastHour = Date.now() - (1000 * 60 * 60);
  //   logger.debug(`[${PREFIX}] lastHelp: ${targetLastHelpedDate.valueOf() * 1000}`);
  //   logger.debug(`[${PREFIX}] lastHour: ${lastHour.valueOf()}`);
  //   if (targetLastHelpedDate.valueOf() * 1000 > lastHour.valueOf()) {
  //     const message = stripIndents`Hey ${interaction.member} you just asked for help recently!
  //     Take a moment to breathe and wait for someone to respond =)
  //     Maybe try listening to some lofi music while you wait?`;

  //     const embed = embedTemplate()
  //       .setColor(Colors.DarkBlue)
  //       .setDescription(message);
  //     interaction.editReply({embeds: [embed]});

  //     logger.debug(`[${PREFIX}] finished!`);

  //     logger.debug(`[${PREFIX}] Rejected the "im good" button`);
  //     return;
  //   }
  // }

  // For each role in targetRoles2, add it to the target
  if (targetRoles) {
    targetRoles.forEach((roleId) => {
      logger.debug(`[${PREFIX}] Re-adding roleId: ${roleId}`);
      const roleObj = interaction.guild!.roles.cache.find((r) => r.id === roleId) as Role;
      if (!ignoredRoles.includes(roleObj.id) &&
      roleObj.name !== '@everyone' &&
      roleObj.id !== roleNeedshelp!.id) {
        logger.debug(`[${PREFIX}] Adding role ${roleObj.name} to ${target.displayName}`);
        try {
          target.roles.add(roleObj);
        } catch (err) {
          logger.error(`[${PREFIX}] Error adding role ${roleObj.name} to ${target.displayName}`);
          logger.error(err);
        }
      }
    });
  }

  try {
    target.roles.remove(roleNeedshelp!);
    logger.debug(`[${PREFIX}] Removed ${roleNeedshelp!.name} from ${target.displayName}`);
  } catch (err) {
    logger.error(`[${PREFIX}] Error removing ${roleNeedshelp!.name} from ${target.displayName}`);
    logger.error(err);
  }

  const endHelpMessage = stripIndents`Hey ${target}, we're glad you're doing better!
    We've restored your old roles back to normal <3
    This thread will remain here for a day if you want to follow up tomorrow.
    After 7 days, or on request, it will be deleted to preserve your privacy =)`;

  try {
    threadHelpUser.send(endHelpMessage);
  } catch (err) {
    logger.error(`[${PREFIX}] Error sending end help message to ${threadHelpUser}`);
    logger.error(err);
  }


  let message:Message;
  await threadHelpUser.send(stripIndents`
      ${env.EMOJI_INVISIBLE}
      > **If you have a minute, your feedback is important to us!**
      > Please rate your experience with ${interaction.guild.name}'s service by reacting below.
      > Thank you!
      ${env.EMOJI_INVISIBLE}
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
          ${env.EMOJI_INVISIBLE}
          > Thank you for your feedback, here's a cookie! 🍪
          ${env.EMOJI_INVISIBLE}
          `);
        logger.debug(`[${PREFIX}] Collected ${reaction.emoji.name} from ${threadHelpUser}`);
        const finalEmbed = embedTemplate()
          .setColor(Colors.Blue)
          .setDescription(`Collected ${reaction.emoji.name} from ${threadHelpUser}`);
        try {
          const channelTripsitMeta = interaction.client.channels.cache.get(channelTripsittersId) as TextChannel;
          await channelTripsitMeta.send({embeds: [finalEmbed]});
        } catch (err) {
          logger.debug(`[${PREFIX}] Failed to send message, am i still in the tripsit guild?`);
        }
        msg.delete();
        collector.stop();
      });
    });

  logger.debug(`[${PREFIX}] target ${target} is no longer being helped!`);
  logger.debug(`[${PREFIX}] finished!`);
  await interaction.editReply({content: 'Done!'});
// async submit(interaction) {
//   const feedback = interaction.fields.getTextInputValue('feedbackReport');
//   logger.debug(feedback);
// },
};
