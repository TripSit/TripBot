/* eslint-disable sonarjs/cognitive-complexity */

import type { user_action_type, user_actions, users } from '@prisma/client';
import type {
  AnySelectMenuInteraction,
  APIActionRowComponent,
  APIButtonComponentWithCustomId,
  BaseMessageOptions,
  ButtonInteraction,
  ChatInputCommandInteraction,
  DiscordAPIError,
  DiscordErrorData,
  Guild,
  GuildBan,
  InteractionEditReplyOptions,
  InteractionReplyOptions,
  Message,
  MessageComponentInteraction,
  MessageContextMenuCommandInteraction,
  ModalSubmitInteraction,
  PermissionResolvable,
  Snowflake,
  TextChannel,
  ThreadChannel,
  User,
  UserContextMenuCommandInteraction,
} from 'discord.js';

import { stripIndents } from 'common-tags';
import { ButtonStyle, MessageFlags, TextInputStyle } from 'discord-api-types/v10';
import {
  ActionRowBuilder,
  APIEmbedField,
  ButtonBuilder,
  Colors,
  EmbedBuilder,
  GuildMember,
  ModalBuilder,
  Role,
  TextInputBuilder,
  time,
} from 'discord.js';
import moment from 'moment';

import { last } from '../../global/commands/g.last';
import { parseDuration, validateDurationInput } from '../../global/utils/parseDuration';
// import { last } from '../../../global/commands/g.last';
import { checkGuildPermissions } from './checkPermissions';
import { embedTemplate } from './embedTemplate';
import { getDiscordMember } from './guildMemberLookup';

/* TODO:
add dates to bans
- Need to start recording when bans happened

link accounts to transfer warnings and experience
- eventually
*/

const F = f(__filename);
type ModuleAction = 'ACKN_REPORT' | 'INFO' | 'LINK' | UndoAction | user_action_type;

// type BanAction = 'FULL_BAN' | 'TICKET_BAN' | 'DISCORD_BOT_BAN' | 'BAN_EVASION' | 'UNDERBAN';
type TargetObject = GuildMember | Snowflake | User;
type UndoAction =
  | 'UN-BAN_EVASION'
  | 'UN-CONTRIBUTOR_BAN'
  | 'UN-DISCORD_BOT_BAN'
  | 'UN-FULL_BAN'
  | 'UN-HELPER_BAN'
  | 'UN-TICKET_BAN'
  | 'UN-TIMEOUT'
  | 'UN-UNDERBAN';

const disableButtonTime = env.NODE_ENV === 'production' ? 1000 * 60 * 5 : 1000 * 60 * 1; // 1 minute in dev, 5 minute in prod

const noReason = 'No reason provided';
// const internalNotePlaceholder = 'Tell other moderators why you\'re doing this';
// const descriptionLabel = 'What should we tell the user?';
// const descriptionPlaceholder = 'Tell the user why you\'re doing this';
const mepWarning = 'You cannot use the word "MEP" here.';
const noMessageSent = '*No message sent to user*';
/*
const cooperativeExplanation = stripIndents`This is a suite of moderation tools for guilds to use, \
this includes the ability to ban, warn, report, and more!

Currently these tools are only available to a limited number of partner guilds, \
use /cooperative info for more information.`; */
// const noUserError = 'Could not find that member/user!';
const beMoreSpecific = stripIndents`
Be more specific:
> **Mention:** <@${env.DISCORD_CLIENT_ID}>
> **ID:** ${env.DISCORD_CLIENT_ID}
> **Username:** moonbear
> **Nickname:** Moony`;

const embedVariables = {
  BAN_EVASION: {
    embedColor: Colors.Red,
    embedTitle: 'Ban Evasion!',
    emoji: '🔨',
    pastVerb: 'banned for evasion',
    presentVerb: 'banning for evasion',
  },
  CONTRIBUTOR_BAN: {
    embedColor: Colors.Red,
    embedTitle: 'Contributor Role Banned!',
    emoji: '🧑‍💻',
    pastVerb: 'banned from using the Contributor role',
    presentVerb: 'banning from using the Contributor role',
  },
  DISCORD_BOT_BAN: {
    embedColor: Colors.Red,
    embedTitle: 'Discord Bot Banned!',
    emoji: '🤖',
    pastVerb: 'banned from using the Discord bot',
    presentVerb: 'banning from using the Discord bot',
  },
  FULL_BAN: {
    embedColor: Colors.Red,
    embedTitle: 'Banned!',
    emoji: '🔨',
    pastVerb: 'banned',
    presentVerb: 'banning',
  },
  HELPER_BAN: {
    embedColor: Colors.Red,
    embedTitle: 'Helper Role Banned!',
    emoji: '🐕‍🦺',
    pastVerb: 'banned from using the Helper role',
    presentVerb: 'banning from using the Helper role',
  },
  INFO: {
    embedColor: Colors.Green,
    embedTitle: 'Info!',
    emoji: 'ℹ️',
    pastVerb: 'got info on',
    presentVerb: 'getting info on',
  },
  KICK: {
    embedColor: Colors.Orange,
    embedTitle: 'Kicked!',
    emoji: '👢',
    pastVerb: 'kicked',
    presentVerb: 'kicking',
  },
  NOTE: {
    embedColor: Colors.Yellow,
    embedTitle: 'Note!',
    emoji: '📃',
    pastVerb: 'noted',
    presentVerb: 'noting',
  },
  REPORT: {
    embedColor: Colors.Orange,
    embedTitle: 'Report!',
    emoji: '📝',
    pastVerb: 'reported',
    presentVerb: 'reporting',
  },
  TICKET_BAN: {
    embedColor: Colors.Red,
    embedTitle: 'Ticket Banned!',
    emoji: '🎫',
    pastVerb: 'banned from using tickets',
    presentVerb: 'banning from using tickets',
  },
  TIMEOUT: {
    embedColor: Colors.Yellow,
    embedTitle: 'Timeout!',
    emoji: '⏳',
    pastVerb: 'timed out',
    presentVerb: 'timing out',
  },
  'UN-BAN_EVASION': {
    embedColor: Colors.Green,
    embedTitle: 'Un-Ban Evasion!',
    emoji: '🔨',
    pastVerb: 'un-banned for evasion',
    presentVerb: 'un-banning for evasion',
  },
  'UN-CONTRIBUTOR_BAN': {
    embedColor: Colors.Green,
    embedTitle: 'Un-Contributor Role Banned!',
    emoji: '🧑‍💻',
    pastVerb: 'allowed to use the Contributor role again',
    presentVerb: 'allowing to use the Contributor role again',
  },
  'UN-DISCORD_BOT_BAN': {
    embedColor: Colors.Green,
    embedTitle: 'Un-Discord Bot Banned!',
    emoji: '🤖',
    pastVerb: 'allowed to use the Discord bot again',
    presentVerb: 'allowing to use the Discord bot again',
  },
  'UN-FULL_BAN': {
    embedColor: Colors.Green,
    embedTitle: 'Un-banned!',
    emoji: '🔨',
    pastVerb: 'un-banned',
    presentVerb: 'un-banning',
  },
  'UN-HELPER_BAN': {
    embedColor: Colors.Green,
    embedTitle: 'Un-Helper Role Banned!',
    emoji: '🐕‍🦺',
    pastVerb: 'allowed to use the Helper role again',
    presentVerb: 'allowing to use the Helper role again',
  },
  'UN-TICKET_BAN': {
    embedColor: Colors.Green,
    embedTitle: 'Un-Ticket Banned!',
    emoji: '🎫',
    pastVerb: 'allowed to submit tickets again',
    presentVerb: 'allowing to submit tickets again',
  },
  'UN-TIMEOUT': {
    embedColor: Colors.Green,
    embedTitle: 'Untimeout!',
    emoji: '⏳',
    pastVerb: 'removed from time-out',
    presentVerb: 'removing from time-out',
  },
  'UN-UNDERBAN': {
    embedColor: Colors.Green,
    embedTitle: 'Un-Underban!',
    emoji: '🔨',
    pastVerb: 'un-banned for being underage',
    presentVerb: 'un-banning for being underage',
  },
  UNDERBAN: {
    embedColor: Colors.Red,
    embedTitle: 'Underban!',
    emoji: '🔨',
    pastVerb: 'banned for being underage',
    presentVerb: 'banning for being underage',
  },
  WARNING: {
    embedColor: Colors.Yellow,
    embedTitle: 'Warned!',
    emoji: '🙅',
    pastVerb: 'warned',
    presentVerb: 'warning',
  },
};

const warnButtons = new ActionRowBuilder<ButtonBuilder>().addComponents(
  new ButtonBuilder()
    .setCustomId('acknowledgeButton')
    .setLabel('I understand, it wont happen again!')
    .setStyle(ButtonStyle.Primary),
  new ButtonBuilder()
    .setCustomId('refusalButton')
    .setLabel('Nah, I do what I want!')
    .setStyle(ButtonStyle.Danger),
);

export function msToHuman(ms: number): string {
  const duration = moment.duration(ms);

  const days = duration.days();
  const hours = duration.hours();
  const minutes = duration.minutes();
  const seconds = duration.seconds();

  let humanReadable = '';
  if (days > 0) {
    humanReadable += `${days} days `;
  }
  if (hours > 0) {
    humanReadable += `${hours} hours `;
  }
  if (minutes > 0) {
    humanReadable += `${minutes} minutes `;
  }
  if (seconds > 0) {
    humanReadable += `${seconds} seconds`;
  }

  return humanReadable.trim();
}

function isBan(
  command: ModuleAction,
): command is
  | 'BAN_EVASION'
  | 'CONTRIBUTOR_BAN'
  | 'DISCORD_BOT_BAN'
  | 'FULL_BAN'
  | 'HELPER_BAN'
  | 'TICKET_BAN'
  | 'UNDERBAN' {
  return command === 'FULL_BAN' || command === 'BAN_EVASION' || command === 'UNDERBAN';
}

function isBanEvasion(command: ModuleAction): command is 'BAN_EVASION' {
  return command === 'BAN_EVASION';
}

function isContributorBan(command: ModuleAction): command is 'CONTRIBUTOR_BAN' {
  return command === 'CONTRIBUTOR_BAN';
}

function isDiscordBotBan(command: ModuleAction): command is 'DISCORD_BOT_BAN' {
  return command === 'DISCORD_BOT_BAN';
}

function isDiscussable(
  command: ModuleAction,
): command is 'DISCORD_BOT_BAN' | 'KICK' | 'TICKET_BAN' | 'WARNING' {
  return (
    command === 'DISCORD_BOT_BAN' ||
    command === 'TICKET_BAN' ||
    command === 'WARNING' ||
    command === 'KICK'
  );
}

function isFullBan(command: ModuleAction): command is 'FULL_BAN' {
  return command === 'FULL_BAN';
}

function isHelperBan(command: ModuleAction): command is 'HELPER_BAN' {
  return command === 'HELPER_BAN';
}

function isInfo(command: ModuleAction): command is 'INFO' {
  return command === 'INFO';
}

function isKick(command: ModuleAction): command is 'KICK' {
  return command === 'KICK';
}

function isMention(id: string): boolean {
  return /^<@!?\d{17,19}>$/.test(id);
}

function isNote(command: ModuleAction): command is 'NOTE' {
  return command === 'NOTE';
}

function isRepeatable(command: ModuleAction): command is 'KICK' | 'TIMEOUT' | 'WARNING' {
  return command === 'KICK' || command === 'WARNING' || command === 'TIMEOUT';
}

function isReport(command: ModuleAction): command is 'REPORT' {
  return command === 'REPORT';
}

function isReportAcknowledgement(command: ModuleAction): command is 'ACKN_REPORT' {
  return command === 'ACKN_REPORT';
}

function isSnowflake(id: string): boolean {
  return /^\d{17,19}$/.test(id);
}

function isTicketBan(command: ModuleAction): command is 'TICKET_BAN' {
  return command === 'TICKET_BAN';
}

// Various action type checks
function isTimeout(command: ModuleAction): command is 'TIMEOUT' {
  return command === 'TIMEOUT';
}

function isUnBan(
  command: ModuleAction,
): command is
  | 'UN-BAN_EVASION'
  | 'UN-CONTRIBUTOR_BAN'
  | 'UN-DISCORD_BOT_BAN'
  | 'UN-FULL_BAN'
  | 'UN-HELPER_BAN'
  | 'UN-TICKET_BAN'
  | 'UN-UNDERBAN' {
  return command === 'UN-FULL_BAN' || command === 'UN-BAN_EVASION' || command === 'UN-UNDERBAN';
}

function isUnBanEvasion(command: ModuleAction): command is 'UN-BAN_EVASION' {
  return command === 'UN-BAN_EVASION';
}

function isUnContributorBan(command: ModuleAction): command is 'UN-CONTRIBUTOR_BAN' {
  return command === 'UN-CONTRIBUTOR_BAN';
}

function isUnderban(command: ModuleAction): command is 'UNDERBAN' {
  return command === 'UNDERBAN';
}

function isUnDiscordBotBan(command: ModuleAction): command is 'UN-DISCORD_BOT_BAN' {
  return command === 'UN-DISCORD_BOT_BAN';
}

function isUnFullBan(command: ModuleAction): command is 'UN-FULL_BAN' {
  return command === 'UN-FULL_BAN';
}

function isUnHelperBan(command: ModuleAction): command is 'UN-HELPER_BAN' {
  return command === 'UN-HELPER_BAN';
}

// function isLink(command: ModAction): command is 'LINK' { return command === 'LINK'; }

function isUnTicketBan(command: ModuleAction): command is 'UN-TICKET_BAN' {
  return command === 'UN-TICKET_BAN';
}

function isUnTimeout(command: ModuleAction): command is 'UN-TIMEOUT' {
  return command === 'UN-TIMEOUT';
}

function isUnUnderban(command: ModuleAction): command is 'UN-UNDERBAN' {
  return command === 'UN-UNDERBAN';
}

function isWarning(command: ModuleAction): command is 'WARNING' {
  return command === 'WARNING';
}

function sendsMessageToUser(
  command: ModuleAction,
): command is
  | 'BAN_EVASION'
  | 'DISCORD_BOT_BAN'
  | 'FULL_BAN'
  | 'KICK'
  | 'TICKET_BAN'
  | 'TIMEOUT'
  | 'UNDERBAN'
  | 'WARNING' {
  return (
    command === 'WARNING' ||
    command === 'FULL_BAN' ||
    command === 'TICKET_BAN' ||
    command === 'DISCORD_BOT_BAN' ||
    command === 'BAN_EVASION' ||
    command === 'UNDERBAN' ||
    command === 'TIMEOUT' ||
    command === 'KICK'
  );
}

export const modButtonNote = (discordId: string) =>
  new ButtonBuilder()
    .setCustomId(`moderate~NOTE~${discordId}`)
    .setLabel('Note')
    .setEmoji('🗒️')
    .setStyle(ButtonStyle.Success);

export const modButtonInfo = (discordId: string) =>
  new ButtonBuilder()
    .setCustomId(`moderate~INFO~${discordId}`)
    .setLabel('Info')
    .setEmoji('ℹ️')
    .setStyle(ButtonStyle.Primary);

export const modButtonReport = (discordId: string) =>
  new ButtonBuilder()
    .setCustomId(`moderate~REPORT~${discordId}`)
    .setLabel('Report')
    .setEmoji('📝')
    .setStyle(ButtonStyle.Primary);

export const modButtonAcknowledgeReport = (discordId: string) =>
  new ButtonBuilder()
    .setCustomId(`moderate~ACKN_REPORT~${discordId}`)
    .setLabel('Acknowledge')
    .setEmoji('✅')
    .setStyle(ButtonStyle.Primary);

export const modButtonWarn = (discordId: string) =>
  new ButtonBuilder()
    .setCustomId(`moderate~WARNING~${discordId}`)
    .setLabel('Warn')
    .setEmoji('⚠️')
    .setStyle(ButtonStyle.Primary);

export const modButtonTimeout = (discordId: string) =>
  new ButtonBuilder()
    .setCustomId(`moderate~TIMEOUT~${discordId}`)
    .setLabel('Mute')
    .setEmoji('⏳')
    .setStyle(ButtonStyle.Secondary);

export const modButtonBan = (discordId: string) =>
  new ButtonBuilder()
    .setCustomId(`moderate~FULL_BAN~${discordId}`)
    .setLabel('Ban')
    .setEmoji('🔨')
    .setStyle(ButtonStyle.Danger);

export const modButtonUnBan = (discordId: string) =>
  new ButtonBuilder()
    .setCustomId(`moderate~UN-FULL_BAN~${discordId}`)
    .setLabel('Unban')
    .setEmoji('🔨')
    .setStyle(ButtonStyle.Success);

export const modButtonUnTimeout = (discordId: string) =>
  new ButtonBuilder()
    .setCustomId(`moderate~UN-TIMEOUT~${discordId}`)
    .setLabel('Unmute')
    .setEmoji('⏳')
    .setStyle(ButtonStyle.Success);

export async function acknowledgeButton(interaction: ButtonInteraction) {
  const targetData = await db.users.upsert({
    create: {
      discord_id: interaction.user.id,
    },
    update: {},
    where: {
      discord_id: interaction.user.id,
    },
  });
  let targetChan: null | TextChannel = null;
  try {
    targetChan = targetData.mod_thread_id
      ? ((await discordClient.channels.fetch(targetData.mod_thread_id)) as TextChannel)
      : null;
  } catch {
    log.info(F, 'Failed to fetch mod thread. It was likely deleted.');
  }
  if (targetChan) {
    await targetChan.send({
      embeds: [
        embedTemplate()
          .setColor(Colors.Green)
          .setDescription(`${interaction.user.username} has acknowledged their warning.`),
      ],
    });
  }
  // remove the components from the message
  try {
    await interaction.update({ components: [] });
  } catch {
    log.debug(F, 'Failed to remove warning components for moderation acknowledgement');
  }
}

export async function acknowledgeReportButton(buttonInt: ButtonInteraction) {
  if (!buttonInt.guild) {
    return;
  }
  const targetId = (buttonInt.customId.split('~') as [string, ModuleAction, Snowflake])[2];

  // Fetch db data for the person who was reported
  const reporteeData = await db.users.upsert({
    create: {
      discord_id: targetId,
    },
    update: {},
    where: {
      discord_id: targetId,
    },
  });

  let moduleActorMember = null as GuildMember | null;
  let targetChan: null | TextChannel = null;
  let reporteeMember: GuildMember | null = null;
  let reporteeUser: null | User = null;
  let reporterUser: null | User = null;

  try {
    // Fetch the mod thread
    if (reporteeData.mod_thread_id) {
      targetChan = (await discordClient.channels.fetch(reporteeData.mod_thread_id)) as TextChannel;
    }

    if (!targetChan) {
      log.info(F, 'Failed to fetch mod thread. It was likely deleted.');
      return;
    }

    try {
      moduleActorMember = await buttonInt.guild.members.fetch(buttonInt.user.id);
    } catch {
      log.info(F, 'Failed to fetch mod actor. They are likely no longer in the server.');
      return;
    }

    // Fetch the reportee member or user
    try {
      reporteeMember = await buttonInt.guild.members.fetch(targetId);
    } catch {
      log.info(
        F,
        'Failed to fetch reportee member. They are likely no longer in the server. Fetching user.',
      );
      try {
        reporteeUser = await discordClient.users.fetch(targetId);
      } catch (error) {
        log.error(
          F,
          `Failed to fetch reportee user. Account likely deleted or no access: ${error}`,
        );
      }
      log.info(F, 'Reportee user successfully fetched!');
    }

    // Fetch the reporter from message mentions
    const reporterId = buttonInt.message.mentions.users.first()?.id;
    if (reporterId) {
      reporterUser = await discordClient.users.fetch(reporterId);
    }

    if (!reporterUser) {
      await targetChan.send({
        embeds: [
          embedTemplate()
            .setColor(Colors.DarkOrange)
            .setDescription('The original reporter of this user has left the server.'),
        ],
      });
      log.info(F, 'Could not determine the reporter user.');
      return;
    }
  } catch (error) {
    log.info(F, `An unexpected error occurred: ${error}`);
    return;
  }

  if (!reporteeMember && !reporteeUser) {
    await targetChan.send({
      embeds: [
        embedTemplate()
          .setColor(Colors.DarkOrange)
          .setDescription('The user this mod thread is for has deleted their Discord account.'),
      ],
    });
    return;
  }

  // Determine reportee name
  // Determine reportee name
  let reporteeName = reporteeMember?.displayName ?? reporteeUser?.username ?? 'Unknown User';

  // If reporteeUser and reporteeMember are not found, try fetching the mod thread name
  if (!reporteeMember && !reporteeUser && reporteeData.mod_thread_id) {
    try {
      const moduleThread = (await buttonInt.guild.channels.fetch(
        reporteeData.mod_thread_id,
      )) as TextChannel;
      if (moduleThread) {
        reporteeName = moduleThread.name; // Use the thread name as the reportee's name
      }
    } catch (error) {
      log.info(F, `Failed to fetch mod thread channel name: ${error}`);
      log.error(F, `Failed to fetch reporteeMember, user, and modthread name. ${error}`);
    }
  }

  // Send a DM to the user who triggered the report
  try {
    await reporterUser.send(stripIndents`
      Thank you for your report. Users that break our server rules disrupt the server for everyone, and your reports help us identify them.

      While we can't provide specific details about the specific actions taken, your recent report has been acknowledged and action taken. Your reports make TripSit a friendlier place for everyone.

      If you come across more bad behavior, we hope you'll continue to assist the Tripsit community by reporting it to us.

      This was for your report on ${reporteeName}, submitted on <t:${Math.floor(buttonInt.message.createdTimestamp / 1000)}:F>.

      Regards,
      Team TripSit
    `);

    const successEmbed = embedTemplate()
      .setColor(Colors.Green)
      .setDescription(
        `${moduleActorMember.displayName} has acknowledged the report on ${reporteeMember ?? reporteeUser?.username ?? reporteeName}.`,
      );

    await targetChan.send({
      embeds: [successEmbed],
    });

    const guildData = await db.discord_guilds.upsert({
      create: {
        id: buttonInt.guild.id,
      },
      update: {},
      where: {
        id: buttonInt.guild.id,
      },
    });

    if (guildData.channel_mod_log) {
      const moduleLog = (await buttonInt.guild.channels.fetch(
        guildData.channel_mod_log,
      )) as TextChannel;
      successEmbed.setDescription(
        `${moduleActorMember.displayName} has acknowledged the report on ${reporteeMember ?? reporteeUser?.username ?? reporteeName}.`,
      );
      await moduleLog.send({
        embeds: [successEmbed],
      });
      return;
    }

    log.info(F, 'Failed to send report acknowledgement to mod log. No mod log channel set.');
  } catch (error) {
    log.error(F, `Failed to send DM to ${buttonInt.user.username}: ${error}`);
    await targetChan.send({
      embeds: [
        embedTemplate()
          .setColor(Colors.Red)
          .setDescription(
            `${buttonInt.user.username} tried to acknowledged ${reporteeData.username}'s report, but there was an error.`,
          ),
      ],
    });
  }
}

export async function linkThread(
  discordId: string,
  threadId: string,
  override: boolean | null,
): Promise<null | string> {
  // Get the targetData from the db
  const userData = await db.users.upsert({
    create: {
      discord_id: discordId,
    },
    update: {},
    where: {
      discord_id: discordId,
    },
  });

  if (userData.mod_thread_id === null || override) {
    // log.debug(F, `targetData.mod_thread_id is null, updating it`);
    await db.users.update({
      data: {
        mod_thread_id: threadId,
      },
      where: {
        id: userData.id,
      },
    });
    return null;
  }
  // log.debug(F, `targetData.mod_thread_id is not null, not updating it`);
  return userData.mod_thread_id;
}

export async function moderate(
  buttonInt: ButtonInteraction,
  modalInt: ModalSubmitInteraction,
  ignoreRecentActions = false,
): Promise<InteractionReplyOptions> {
  if (!buttonInt.guild) {
    return { content: 'This command can only be used in a guild!' };
  }
  const actor = buttonInt.member as GuildMember;

  const [, command, targetId]: [string, ModuleAction, Snowflake] = buttonInt.customId.split(
    '~',
  ) as [string, ModuleAction, Snowflake];
  if (
    !isUnFullBan(command) &&
    !isUnTimeout(command) &&
    !isNote(command) &&
    !isReport(command) &&
    !ignoreRecentActions &&
    (await wasActionedRecently(command))
  ) {
    await onActionedRecently(buttonInt, modalInt);
    return {
      components: [],
      content: 'This action was cancelled due to another taken recently. Proceed or cancel below.',
    }; // Ensure the function returns something
  }

  const moduleEmbedObject = buttonInt.message.embeds[0].toJSON();

  let targetMember = null as GuildMember | null;
  let targetUser = null as null | User;
  try {
    targetMember = await actor.guild.members.fetch(targetId);
  } catch {
    try {
      targetUser = await discordClient.users.fetch(targetId);
    } catch {
      // Ignore
    }
  }

  let targetName = targetId;
  let targetObject = targetId as TargetObject;
  if (targetMember) {
    targetName = targetMember.displayName;
    targetObject = targetMember;
  } else if (targetUser) {
    targetName = targetUser.username;
    targetObject = targetUser;
  }

  let description = '';
  if (!isNote(command) && !isReport(command)) {
    description = modalInt.fields.getTextInputValue('description');
  }
  let internalNote = modalInt.fields.getTextInputValue('internalNote');

  // Check if this is a vendor ban
  const vendorBan = internalNote?.toLowerCase().includes('vendor') && isFullBan(command);

  // Don't allow people to mention MEP
  if (internalNote?.includes('MEP') || description?.includes('MEP')) {
    return {
      content: mepWarning,
    };
  }

  try {
    const messageField = moduleEmbedObject.fields!.find((field) => field.name === 'Message');
    // If the modEmbed contains a message field, add it to the internal note
    if (messageField) {
      internalNote = stripIndents`
      ${internalNote}`;
    }
  } catch {
    // Ignore
  }

  // Process duration time for ban and timeouts
  let banEndTime = null;
  let actionDuration = 0 as null | number;
  let durationString = '';
  if (isTimeout(command)) {
    // log.debug(F, 'Parsing timeout duration');
    let durationValue = modalInt.fields.getTextInputValue('duration');

    if (durationValue === '') {
      durationValue = '7d';
    } // else {
    // durationVal = await makeValid(durationVal);
    // }

    if (!validateDurationInput(durationValue)) {
      return {
        content:
          'Timeout duration must include at least one of the following units: seconds, minutes, hours, days, or weeks. Examples of valid formats include: 1 days 23 hours 59 minutes 59 seconds, or just 1 day, etc.',
      };
    }

    actionDuration = await parseDuration(durationValue);
    if (actionDuration && (actionDuration < 0 || actionDuration > 7 * 24 * 60 * 60 * 1000)) {
      return { content: 'Timeout must be between 0 and 7 days!' };
    }

    // convert the milliseconds into a human readable string
    const humanTime = msToHuman(actionDuration);

    durationString = ` for ${humanTime}. It will expire ${time(new Date(Date.now() + actionDuration), 'R')}`;
    // log.debug(F, `duration: ${duration}`);
  }
  if (isFullBan(command)) {
    const durationValue = modalInt.fields.getTextInputValue('ban_duration');

    if (durationValue !== '') {
      // durationVal = await makeValid(durationVal);
      let temporaryBanDuration = Number.parseInt(durationValue, 10);

      if (Number.isNaN(temporaryBanDuration)) {
        return { content: 'Ban duration must be a number!' };
      }

      if (!validateDurationInput(durationValue)) {
        return {
          content:
            'Ban duration must include at least one of the following units: seconds, minutes, hours, days, weeks, months, or years. Examples of valid formats include: 1 year 1 month 1 week 1 day 23 hours 59 minutes 59 seconds, or just 1 year, 1 month, etc.',
        };
      }

      temporaryBanDuration = await parseDuration(durationValue);
      if (temporaryBanDuration && temporaryBanDuration < 0) {
        return { content: 'Ban duration must be at least 1 second!' };
      }

      durationString = time(new Date(Date.now() + temporaryBanDuration), 'R');
      const currentTime = new Date();
      banEndTime =
        temporaryBanDuration === 0 ? null : new Date(currentTime.getTime() + temporaryBanDuration);
    }
  }

  // Display all properties we're going to use
  log.info(
    F,
    `[moderate]
  actor: ${actor}
  command: ${command}
  targetId: ${targetId}
  internalNote: ${internalNote}
  description: ${description}
  duration: ${actionDuration}
  durationStr: ${durationString}
  `,
  );

  // Get the actor and target data from the db
  const actorData = await db.users.upsert({
    create: { discord_id: actor.id },
    update: {},
    where: { discord_id: actor.id },
  });
  const targetData = await db.users.upsert({
    create: { discord_id: targetId },
    update: {},
    where: { discord_id: targetId },
  });
  const guildData = await db.discord_guilds.upsert({
    create: { id: actor.guild.id },
    update: {},
    where: { id: actor.guild.id },
  });

  // log.debug(F, `TargetData: ${JSON.stringify(targetData, null, 2)}`);
  // If this is a Warn, ban, timeout or kick, send a message to the user
  // Do this first cuz you can't do this if they're not in the guild
  if (
    sendsMessageToUser(command) &&
    !vendorBan &&
    description !== '' &&
    description !== null &&
    (targetMember || targetUser)
  ) {
    log.debug(F, `[moderate] Sending message to ${targetName}`);
    let body = stripIndents`I regret to inform you that you've been ${embedVariables[command as keyof typeof embedVariables].pastVerb}${durationString} by Team TripSit. 

      > ${description}

      **Do not message a moderator to talk about this or argue about the rules in public channels!**
    `;

    const appealString =
      '\nYou can send an email to appeals@tripsit.me to appeal this ban! Evasion bans are permanent, and underban bans are permanent until you turn 18.';
    const evasionString =
      '\nEvasion bans are permanent, you can appeal the ban on your main account by sending an email, but evading will extend the ban';

    // if (guildData.channel_helpdesk) {
    //   // const channel = await discordClient.channels.fetch(guildData.channel_helpdesk);
    //   // const discussString = `\nYou can discuss this with the mods in ${channel}.`; // eslint-disable-line max-len
    //   // const timeoutDiscussString = `\nYou can discuss this with the mods in ${channel} once the timeout expires.`; // eslint-disable-line max-len
    // }

    if (isBan(command)) {
      body = stripIndents`${body}\n\n${appealString}`;
      if (isBanEvasion(command)) {
        body = stripIndents`${body}\n\n${evasionString}`;
      }
      if (isFullBan(command)) {
        const response = await last(targetUser ?? targetMember?.user!, buttonInt.guild);
        const extraMessage = `${targetName}'s last ${response.messageCount} (out of ${response.totalMessages}) messages before being banned :\n${response.messageList}`;
        body = stripIndents`${body}\n\n${extraMessage}`;
      }
    }

    if (isDiscussable(command) && guildData.channel_helpdesk) {
      const channel = await discordClient.channels.fetch(guildData.channel_helpdesk);
      const discussString = `\nYou can discuss this with the mods in ${channel}.`;
      body = stripIndents`${body}\n\n${discussString}`;
    }

    if (isTimeout(command) && guildData.channel_helpdesk) {
      const channel = await discordClient.channels.fetch(guildData.channel_helpdesk);
      const timeoutDiscussString = `\nYou can discuss this with the mods in ${channel} once the timeout expires.`;
      body = stripIndents`${body}\n\n${timeoutDiscussString}`;
    }

    if (isRepeatable(command)) {
      body = stripIndents`${body}\n\nPlease review the [TripSit Terms](https://wiki.tripsit.me/wiki/Terms_of_Service) so this doesn't happen again!\n`;
    }

    if (isKick(command)) {
      body = stripIndents`${body}\n\nIf you feel you can follow the rules you can rejoin here: https://discord.gg/tripsit`;
    }

    log.debug(F, `Sending message to ${targetName}`);
    await messageUser(
      targetUser ?? targetMember?.user!,
      buttonInt.guild,
      command,
      body,
      isTimeout(command) || isWarning(command),
    );
  }

  if (command === 'FULL_BAN') {
    internalNote += `\n **Actioned by:** ${actor.displayName}`;
    internalNote += `\n **Ban Ends:** ${durationString || 'Never'}`;
  }

  let actionData = {
    ban_evasion_related_user: null as null | string,
    created_at: new Date(),
    created_by: actorData.id,
    description,
    expires_at: null as Date | null,
    guild_id: actor.guild.id,
    internal_note: internalNote,
    repealed_at: null as Date | null,
    repealed_by: null as null | string,
    target_discord_id: targetData.discord_id,
    type: command.includes('UN-') ? command.slice(3) : command,
    user_id: targetData.id,
  } as user_actions;

  log.debug(F, `[moderate] performing actions for ${targetName}`);
  let extraMessage = '';
  if (isBan(command)) {
    if (isFullBan(command) || isUnderban(command) || isBanEvasion(command)) {
      targetData.removed_at = new Date();

      let deleteMessageValue = modalInt.fields.getTextInputValue('days');
      let deleteDuration = 0;

      if (deleteMessageValue !== '') {
        // If input is just a number, append 'd' to treat it as days
        if (/^\d+$/.test(deleteMessageValue)) {
          deleteMessageValue += 'd';
        }

        // deleteMessageValue = await makeValid(deleteMessageValue);
        deleteDuration = Number.parseInt(deleteMessageValue, 10);

        if (Number.isNaN(deleteDuration)) {
          return { content: 'Delete duration must be a number!' };
        }

        if (!validateDurationInput(deleteMessageValue)) {
          return {
            content:
              'Delete duration must include at least one of the following units: seconds, minutes, hours, days, or weeks, with a maximum duration of 7 days. Examples of valid formats include: 1 day 23 hours 59 minutes 59 seconds, or just 1 day, etc.',
          };
        }

        deleteDuration = await parseDuration(deleteMessageValue);
        if (deleteDuration && deleteDuration < 0) {
          return { content: 'Delete duration must be at least 1 second!' };
        }
      }

      try {
        if (deleteDuration > 0 && targetMember) {
          // log.debug(F, `I am deleting ${deleteMessageValue} days of messages!`);
          const response = await last(targetMember.user, buttonInt.guild);
          extraMessage = `${targetName}'s last ${response.messageCount} (out of ${response.totalMessages}) messages before being banned :\n${response.messageList}`;
        }
        log.debug(F, `Days to delete: ${deleteMessageValue}`);
      } catch (error) {
        log.error(F, `Error: ${error}`);
      }
      log.info(
        F,
        `target: ${targetId} | deleteMessageValue: ${deleteMessageValue} | internalNote: ${internalNote ?? noReason}`,
      );

      try {
        log.info(F, `Message delete duration in milliseconds: ${deleteDuration}`);
        targetObject = await buttonInt.guild.bans.create(targetId, {
          deleteMessageSeconds: deleteDuration / 1000,
          reason: internalNote ?? noReason,
        });
        // Set ban duration if present
        if (banEndTime !== null) {
          actionData.expires_at = banEndTime;
        }
      } catch (error) {
        log.error(F, `Error: ${error}`);
      }
    } else if (isTicketBan(command)) {
      targetData.ticket_ban = true;
    } else if (isDiscordBotBan(command)) {
      targetData.discord_bot_ban = true;
    } else if (isHelperBan(command)) {
      targetData.helper_role_ban = true;
    } else if (isContributorBan(command)) {
      targetData.contributor_role_ban = true;
    }
  } else if (isUnBan(command)) {
    if (isUnFullBan(command) || isUnUnderban(command) || isUnBanEvasion(command)) {
      targetData.removed_at = null;
      try {
        await buttonInt.guild.bans.fetch();
        await buttonInt.guild.bans.remove(targetId, internalNote ?? noReason);
      } catch (error) {
        log.error(F, `Error: ${error}`);
      }
    } else if (isUnTicketBan(command)) {
      targetData.ticket_ban = false;
    } else if (isUnDiscordBotBan(command)) {
      targetData.discord_bot_ban = false;
    } else if (isUnHelperBan(command)) {
      targetData.helper_role_ban = false;
    } else if (isUnContributorBan(command)) {
      targetData.contributor_role_ban = false;
    }

    const record = await db.user_actions.findFirst({
      orderBy: {
        created_at: 'desc',
      },
      where: {
        repealed_at: null,
        type: (command.includes('UN-') ? command.slice(3) : command) as user_action_type,
        user_id: targetData.id,
      },
    });

    if (record) {
      actionData = record;
    } else {
      log.error(F, 'There is no record of this ban, but i will try to do it anyway');
    }
    actionData.repealed_at = new Date();
    actionData.repealed_by = actorData.id;
    actionData.expires_at = null;
  } else if (isTimeout(command)) {
    if (targetMember) {
      actionData.expires_at = new Date(Date.now() + actionDuration!);
      try {
        await targetMember.timeout(actionDuration, internalNote ?? noReason);
      } catch (error) {
        log.error(F, `Error: ${error}`);
      }
    } else {
      return { content: 'User is not in the guild!' };
    }
  } else if (isUnTimeout(command)) {
    if (targetMember) {
      const record = await db.user_actions.findMany({
        orderBy: {
          created_at: 'desc',
        },
        where: {
          repealed_at: null,
          type: 'TIMEOUT',
          user_id: targetData.id,
        },
      });

      if (record.length > 0) {
        [actionData] = record;
      }

      actionData.repealed_at = new Date();
      actionData.repealed_by = actorData.id;

      try {
        await targetMember.timeout(null, internalNote ?? noReason);
        // log.debug(F, `I untimeout ${target.displayName} because\n '${internalNote}'!`);
      } catch (error) {
        log.error(F, `Error: ${error}`);
      }
    } else {
      return { content: 'User is not in the guild!' };
    }
  } else if (isKick(command)) {
    if (targetMember) {
      actionData.type = 'KICK' as user_action_type;
      try {
        await targetMember.kick();
      } catch (error) {
        log.error(F, `Error: ${error}`);
      }
    } else {
      return { content: 'User is not in the guild!' };
    }
  }

  // This needs to happen before creating the modlog embed
  // await userActionsSet(actionData);
  log.debug(F, `Updating user actions: ${JSON.stringify(actionData, null, 2)}`);
  await (actionData.id
    ? db.user_actions.upsert({
        create: actionData,
        update: actionData,
        where: { id: actionData.id },
      })
    : db.user_actions.create({ data: actionData }));

  log.debug(F, `Updating target data: ${JSON.stringify(targetData, null, 2)}`);
  await db.users.update({
    data: targetData,
    where: { id: targetData.id },
  });

  const anonSummary = `${targetName} was ${embedVariables[command as keyof typeof embedVariables].pastVerb}${durationString}!`;

  log.debug(F, 'Sending message to mod thread');
  const moduleThread = await messageModuleThread(
    buttonInt,
    actor,
    targetObject,
    command,
    internalNote,
    description,
    extraMessage,
    durationString,
  );

  // Records the action taken on the action field of the modlog embed
  const embed = buttonInt.message.embeds[0].toJSON();
  const actionField = embed.fields?.find((field) => field.name === 'Actions');
  if (actionField) {
    // Add the action to the list of actions
    const newActionFiled = actionField?.value.concat(`
    
    ${buttonInt.user.toString()} muted this user:
    > ${modalInt.fields.getTextInputValue('internalNote')}
    
    Message sent to user:
    > ${modalInt.fields.getTextInputValue('description')}`);
    // log.debug(F, `newActionFiled: ${newActionFiled}`);

    // Replace the action field with the new one
    embed.fields?.splice(
      embed.fields?.findIndex((field) => field.name === 'Actions'),
      1,
      {
        inline: true,
        name: 'Actions',
        value: newActionFiled,
      },
    );
  } else {
    embed.fields?.push({
      inline: true,
      name: 'Actions',
      value: stripIndents`${buttonInt.user.toString()} muted this user:
      > ${modalInt.fields.getTextInputValue('internalNote')}
  
      Message sent to user:
      > ${!isNote(command) && !isReport(command) ? modalInt.fields.getTextInputValue('description') : ''}`,
    });
  }

  // Return a message to the user who started this, confirming the user was acted on
  // log.debug(F, `${target.displayName} has been ${embedVariables[command as keyof typeof embedVariables].verb}!`);
  // log.info(F, `response: ${JSON.stringify(desc, null, 2)}`);
  // Take the existing description from response and add to it:'
  const desc = stripIndents`
    ${anonSummary}
    **Reason:** ${internalNote ?? noReason}
     ${description !== '' && description !== null && !vendorBan && targetMember ? `\n\n**Note sent to user: ${description}**` : ''}
  `;

  const response = embedTemplate()
    .setAuthor(null)
    .setColor(Colors.Yellow)
    .setDescription(desc)
    .setFooter(null);

  if (!isReport(command) && moduleThread) {
    response.setDescription(
      `${response.data.description}\nYou can access their thread here: ${moduleThread}`,
    );
  }

  log.debug(F, `Returning embed: ${JSON.stringify(response, null, 2)}`);
  return { embeds: [response] };
}

export async function modModal(interaction: ButtonInteraction): Promise<void> {
  if (!interaction.guild) {
    return;
  }
  const [, cmd, userId] = interaction.customId.split('~');
  const command: ModuleAction = cmd.toUpperCase() as ModuleAction;

  let target: string = userId;

  try {
    target = (await interaction.guild.members.fetch(userId)).displayName;
  } catch {
    try {
      target = (await discordClient.users.fetch(userId)).username;
    } catch {
      // Ignore
    }
  }

  if (isReportAcknowledgement(command)) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    await acknowledgeReportButton(interaction);
    await interaction.editReply({
      embeds: [
        embedTemplate()
          .setColor(Colors.Green)
          .setDescription(`You have acknowledged the report on ${target}.`),
      ],
    });
    return;
  }

  if (isInfo(command)) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const targetData = await db.users.upsert({
      create: {
        discord_id: userId,
      },
      update: {},
      where: {
        discord_id: userId,
      },
    });

    // const guildData = await db.discord_guilds.upsert({
    //   where: {
    //     id: interaction.guild.id,
    //   },
    //   create: {
    //     id: interaction.guild.id,
    //   },
    //   update: {},
    // });

    let targetObject = userId as TargetObject;
    try {
      targetObject = await interaction.guild.members.fetch(userId);
    } catch {
      try {
        targetObject = await discordClient.users.fetch(userId);
      } catch {
        // Ignore
      }
    }

    log.debug(F, '[modModal] generating user info embed');
    const modlogEmbed = await userInfoEmbed(
      interaction.member as GuildMember,
      targetObject,
      targetData,
      'INFO',
      true,
    );

    await interaction.editReply({
      embeds: [modlogEmbed],
    });
    return;
  }

  let modalInternal = '';
  let modalDescription = '';
  const embed = interaction.message.embeds[0].toJSON();

  // Try to handle AI mod stuff
  try {
    const flagsField = embed.fields!.find((field) => field.name === 'Flags');
    if (flagsField) {
      if (isNote(command)) {
        modalInternal = `This user's message was flagged by the AI for ${flagsField.value}`;
      }
      if (isFullBan(command)) {
        const messageField = embed.fields!.find((field) => field.name === 'Message')!;
        const urlField = embed.fields!.find((field) => field.name === 'Channel')!;
        modalInternal = `This user breaks TripSit's policies regarding ${flagsField.value} topics.`;
        modalDescription = stripIndents`
          Your recent messages have broken TripSit's policies regarding ${flagsField.value} topics.
          
          The offending message
          > ${urlField.value}
          - ${messageField.value}
          `;
      }
    }
  } catch {
    // log.error(F, `Error: ${err}`);
  }

  try {
    const messageField = embed.fields!.find((field) => field.name === 'Message')!;
    modalInternal = stripIndents`This user breaks ${interaction.guild.name}'s policies.
      
      The offending message
      ${messageField.value}`;
    modalDescription = stripIndents`
      Your recent messages have broken ${interaction.guild.name}'s policies.
      
      The offending message
      ${messageField.value}`;
  } catch {
    // log.error(F, `Error: ${err}`);
  }

  let verb = '';
  switch (command) {
    case 'BAN_EVASION': {
      verb = 'evasion banning';

      break;
    }
    case 'CONTRIBUTOR_BAN': {
      verb = 'banning from Contributor on';

      break;
    }
    case 'DISCORD_BOT_BAN': {
      verb = 'discord bot banning';

      break;
    }
    case 'FULL_BAN': {
      verb = 'banning';

      break;
    }
    case 'HELPER_BAN': {
      verb = 'banning from Helper on';

      break;
    }
    case 'KICK': {
      verb = 'kicking';

      break;
    }
    case 'NOTE': {
      verb = 'noting';

      break;
    }
    case 'REPORT': {
      verb = 'reporting';

      break;
    }
    case 'TICKET_BAN': {
      verb = 'ticket banning';

      break;
    }
    case 'TIMEOUT': {
      verb = 'timing out';

      break;
    }
    case 'UN-BAN_EVASION': {
      verb = 'removing ban evasion on';

      break;
    }
    case 'UN-CONTRIBUTOR_BAN': {
      verb = 'allowing Contributor on ';

      break;
    }
    case 'UN-DISCORD_BOT_BAN': {
      verb = 'removing bot ban on';

      break;
    }
    case 'UN-FULL_BAN': {
      verb = 'removing ban on';

      break;
    }
    case 'UN-HELPER_BAN': {
      verb = 'allowing Helper on ';

      break;
    }
    case 'UN-TICKET_BAN': {
      verb = 'removing ticket ban on';

      break;
    }
    case 'UN-TIMEOUT': {
      verb = 'removing timeout on';

      break;
    }
    case 'UN-UNDERBAN': {
      verb = 'removing underban on';

      break;
    }
    case 'UNDERBAN': {
      verb = 'underbanning';

      break;
    }
    case 'WARNING': {
      verb = 'warning';

      break;
    }
    // No default
  }

  // log.debug(F, `Verb: ${verb}`);

  const modalInputComponent = new TextInputBuilder()
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder("Tell moderators why you're doing this")
    .setValue(modalInternal)
    .setMaxLength(1000)
    .setRequired(true)
    .setCustomId('internalNote');

  try {
    // Ensure the label text is within the limit
    const label = `Why are you ${verb} ${target}?`;
    const truncatedLabelText = label.length > 45 ? `${label.slice(0, 41)}...?` : label;

    modalInputComponent.setLabel(truncatedLabelText);
  } catch (error) {
    log.error(F, `Error: ${error}`);
    log.error(F, `Verb: ${verb}, Target: ${target}`);
  }

  // log.debug(F, `Verb: ${verb}`);
  const modal = new ModalBuilder()
    .setCustomId(`modModal~${command}~${interaction.id}`)
    .setTitle(`${interaction.guild.name} member ${command.toLowerCase()}`)
    .addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(modalInputComponent));

  // All commands except INFO, NOTE and REPORT can have a public reason sent to the user
  if (!isNote(command) && !isReport(command)) {
    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setLabel('What should we tell the user?')
          .setStyle(TextInputStyle.Paragraph)
          .setPlaceholder("Tell the user why you're doing this")
          .setValue(modalDescription)
          .setMaxLength(1000)
          .setRequired(command === 'WARNING')
          .setCustomId('description'),
      ),
    );
  }
  // Only timeout and full ban can have a duration, but they're different, so separate.
  if (isTimeout(command)) {
    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setLabel('Timeout for how long?')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('7 days or 1 week, etc. (Max 7 days, Default 7 days)')
          .setRequired(false)
          .setCustomId('duration'),
      ),
    );
  }
  if (isFullBan(command)) {
    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setLabel('How far back should messages be removed?')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('7 days or 1 week, etc. (Max 7 days, Default 0 days)')
          .setRequired(false)
          .setCustomId('days'),
      ),
    );
    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setLabel('How long should they be banned for?')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('1 year or 365 days, etc. (Empty = Permanent)')
          .setRequired(false)
          .setCustomId('ban_duration'),
      ),
    );
  }

  // When the modal is opened, disable the button on the embed

  const buttonRows = interaction.message.components.map((row) =>
    row.toJSON(),
  ) as APIActionRowComponent<APIButtonComponentWithCustomId>[];

  const updatedRows = buttonRows.map((row) => {
    const buttonIndex = row.components.findIndex(
      (field) => field.custom_id.split('~')[1] === command,
    );
    if (buttonIndex !== -1) {
      const buttonData = row.components[buttonIndex];

      const updatedButton = {
        ...buttonData,
        disabled: true,
      };

      row.components.splice(buttonIndex, 1, updatedButton);
    }
    return row;
  });

  try {
    await interaction.message.edit({
      components: updatedRows,
    });
  } catch {
    // This will happen on the initial ephemeral message and idk why
    // log.error(F, `Error: ${err}`);
  }

  await interaction.showModal(modal);

  const filter = (index: ModalSubmitInteraction) => index.customId.startsWith('modModal');
  await interaction
    .awaitModalSubmit({ filter, time: disableButtonTime })
    .then(async (index) => {
      if (index.customId.split('~')[2] !== interaction.id) {
        return;
      }
      await index.deferReply({ flags: MessageFlags.Ephemeral });
      try {
        if (command === 'REPORT' || command === 'NOTE') {
          await moderate(interaction, index);
          const reportResponseEmbed = embedTemplate()
            .setColor(command === 'REPORT' ? Colors.Yellow : Colors.Green)
            .setTitle(command === 'REPORT' ? 'Your report was sent!' : 'Your note was added!')
            .setDescription(
              command === 'REPORT'
                ? 'The moderators have received your report and will look into it. Thanks!'
                : `Your note was successfully added to ${target}'s thread.`,
            );
          await index.editReply({
            embeds: [reportResponseEmbed],
          });
        }
      } catch (error) {
        log.info(F, `[modModal ModalSubmitInteraction]: ${error}`);
      }
      // const internalNote = i.fields.getTextInputValue('internalNote'); // eslint-disable-line

      // // Only these commands actually have the description input, so only pull it if it exists
      // const description = isWarning(command) || isKick(command) || isTimeout(command) || isFullBan(command)  // eslint-disable-line
      //   ? i.fields.getTextInputValue('description')
      //   : null;

      // let duration = null;
      // if (isBan(command)) {
      //   // If the command is ban, then the input value exists, so pull that and try to parse it as an int
      //   let dayInput = parseInt(i.fields.getTextInputValue('days'), 10);

      //   // If no input was provided, default to 0 days
      //   if (Number.isNaN(dayInput)) dayInput = 0;

      //   // If the input is a string, or outside the bounds, tell the user and return
      //   if (dayInput && (dayInput < 0 || dayInput > 7)) {
      //     await i.editReply({ content: 'Message remove days must be at least 0 and at most 7!' });
      //     return;
      //   }

      //   // Get the millisecond value of the input
      //   const days = await parseDuration(`${dayInput} days`);
      //   // log.debug(F, `days: ${days}`);
      //   duration = days;
      // }

      // if (isTimeout(command)) {
      //   // If the command is timeout get the value
      //   let timeoutInput = i.fields.getTextInputValue('duration');

      //   // If the value is blank, set it to 7 days, the maximum
      //   if (timeoutInput === '') timeoutInput = '7 days';

      //   if (timeoutInput.length === 1) {
      //     // If the input is a single number, assume it's days
      //     const numberInput = parseInt(timeoutInput, 10);
      //     if (Number.isNaN(numberInput)) {
      //       await i.editReply({ content: 'Timeout must be a number!' });
      //       return;
      //     }
      //     if (numberInput < 0 || numberInput > 7) {
      //       await i.editReply({ content: 'Timeout must be between 0 and 7 days' });
      //       return;
      //     }
      //     timeoutInput = `${timeoutInput} days`;
      //   }

      //   // log.debug(F, `timeoutInput: ${timeoutInput}`);

      //   const timeout = timeoutInput !== null
      //     ? await parseDuration(timeoutInput)
      //     : null;

      //   // If timeout is not null, but is outside the bounds, tell the user and return
      //   if (timeout && (timeout < 0 || timeout > 7 * 24 * 60 * 60 * 1000)) {
      //     await i.editReply({ content: 'Timeout must be between 0 and 7 days' });
      //     return;
      //   }

      //   // log.debug(F, `timeout: ${timeout}`);
      //   duration = timeout;
      // }

      // When the modal is submitted, re-enable the button on the embed
      const buttonRow1 =
        interaction.message.components[0].toJSON() as APIActionRowComponent<APIButtonComponentWithCustomId>;
      const buttonData1 = buttonRow1.components.find(
        (field) => field.custom_id.split('~')[1] === command,
      );
      if (buttonData1) {
        // log.debug(F, `buttonData: ${JSON.stringify(buttonData1, null, 2)}`);

        const updatedButton = {
          custom_id: buttonData1.custom_id,
          disabled: false,
          emoji: buttonData1.emoji,
          label: buttonData1.label,
          style: buttonData1.style,
          type: buttonData1.type,
        };

        const index = buttonRow1.components.findIndex(
          (field) => field.custom_id.split('~')[1] === command,
        );
        buttonRow1.components.splice(index, 1, updatedButton);

        try {
          await interaction.message.edit({
            components: [buttonRow1],
          });
        } catch {
          // This will happen on the initial ephemeral message and idk why
          // log.error(F, `Error: ${err}`);
        }
      }
      if (!isNote(command) && !isReport(command)) {
        await index.editReply((await moderate(interaction, index)) as InteractionEditReplyOptions);
      }
    })
    .catch(async (error) => {
      // log.error(F, `Error: ${JSON.stringify(err as DiscordErrorData, null, 2)}`);
      // log.error(F, `Error: ${JSON.stringify((err as DiscordErrorData).code, null, 2)}`);
      // log.error(F, `Error: ${JSON.stringify((err as DiscordErrorData).message, null, 2)}`);

      if ((error as DiscordErrorData).message.includes('time')) {
        // When the modal is closed, re-enable the button on the embed
        const buttonRow1 =
          interaction.message.components[0].toJSON() as APIActionRowComponent<APIButtonComponentWithCustomId>;
        const buttonData1 = buttonRow1.components.find(
          (field) => field.custom_id.split('~')[1] === command,
        );
        if (buttonData1) {
          // log.debug(F, `buttonData: ${JSON.stringify(buttonData1, null, 2)}`);

          const updatedButton = {
            custom_id: buttonData1.custom_id,
            disabled: false,
            emoji: buttonData1.emoji,
            label: buttonData1.label,
            style: buttonData1.style,
            type: buttonData1.type,
          };

          const index = buttonRow1.components.findIndex(
            (field) => field.custom_id.split('~')[1] === command,
          );
          buttonRow1.components.splice(index, 1, updatedButton);
          try {
            await interaction.message.edit({
              components: [buttonRow1],
            });
          } catch {
            // This will happen on the initial ephemeral message and idk why
            // log.error(F, `Error: ${error}`);
          }
        }
      }
    });
}

export async function modResponse(
  interaction:
    | ButtonInteraction
    | ChatInputCommandInteraction
    | MessageContextMenuCommandInteraction
    | UserContextMenuCommandInteraction,
  command: ModuleAction,
  showModuleButtons: boolean,
): Promise<BaseMessageOptions> {
  const startTime = Date.now();
  const actionRow = new ActionRowBuilder<ButtonBuilder>();
  if (!interaction.guild || !interaction.member) {
    return {
      embeds: [
        embedTemplate().setColor(Colors.Red).setTitle('This command can only be used in a guild!'),
      ],
    };
  }

  let targetString = '';
  let target = {} as GuildMember | User;
  const moduleEmbedObject = embedTemplate();

  const { embedColor } = embedVariables[command as keyof typeof embedVariables];

  // Get the actor
  const actor = interaction.member as GuildMember;

  // Determine the target
  if (interaction.isChatInputCommand() || interaction.isButton()) {
    if (interaction.isButton()) {
      [, , targetString] = interaction.customId.split('~');
    } else {
      targetString = interaction.options.getString('target', true);
    }
    // log.debug(F, `Target string: ${targetString}`);
    const targets = await getDiscordMember(interaction, targetString);
    if (targets.length > 1) {
      log.debug(F, `Found multiple targets: ${targets}`);
      return {
        embeds: [
          moduleEmbedObject
            .setColor(embedColor)
            .setTitle(`${targetString}" returned ${targets.length} results!`)
            .setDescription(beMoreSpecific),
        ],
      };
    }

    if (targets.length === 0) {
      // If we didn't find a member, the likely left the guild already
      // If so, we can only ban or note them
      // We can only do that if the discordID was provided
      if (isSnowflake(targetString) || isMention(targetString)) {
        const userId = isSnowflake(targetString)
          ? targetString
          : targetString.replaceAll(/[<@!>]/g, '');

        let targetObject = userId as TargetObject;
        try {
          targetObject = await actor.guild.members.fetch(userId);
        } catch {
          try {
            targetObject = await discordClient.users.fetch(userId);
          } catch {
            // Ignore
          }
        }

        const targetData = await db.users.upsert({
          create: { discord_id: userId },
          update: {},
          where: { discord_id: userId },
        });
        let banVerb = 'ban';
        if (showModuleButtons) {
          actionRow.addComponents(modButtonNote(userId));

          let userBan = {} as GuildBan;
          try {
            userBan = await interaction.guild.bans.fetch(userId);
          } catch {
            // log.debug(F, `Error fetching ban: ${err}`);
          }
          if (userBan.guild) {
            actionRow.addComponents(modButtonUnBan(userId));
            banVerb = 'un-ban';
          } else {
            actionRow.addComponents(modButtonBan(userId));
          }

          actionRow.addComponents(modButtonInfo(userId));
        }

        if (isReport(command) && showModuleButtons) {
          moduleEmbedObject.setDescription(stripIndents`
          User ID '${userId}' is not in the guild, but I can still Note or ${banVerb} them!`);
        } else {
          log.debug(F, '[modResponse] generating user info');
          const modlogEmbed = await userInfoEmbed(
            actor,
            targetObject,
            targetData,
            command,
            showModuleButtons,
          );
          log.debug(F, `modlogEmbed: ${JSON.stringify(modlogEmbed, null, 2)}`);
          if (showModuleButtons) {
            actionRow.setComponents([modButtonInfo(userId)]);
          } else {
            actionRow.setComponents([modButtonReport(userId)]);
          }
          if (isBan(command)) {
            actionRow.addComponents(modButtonUnBan(userId));
          }
          return {
            components: [actionRow],
            embeds: [modlogEmbed],
          };
        }
        return {
          components: [actionRow],
          embeds: [moduleEmbedObject],
        };
      }
      moduleEmbedObject
        .setColor(embedColor)
        .setTitle(`"${targetString}" returned no results!`)
        .setDescription(beMoreSpecific);
      return {
        embeds: [moduleEmbedObject],
      };
    }

    // log.debug(F, `Assigning target from string: ${targets}`);
    [target] = targets;
  }

  if (
    interaction.isUserContextMenuCommand() &&
    (interaction.targetMember || interaction.targetUser)
  ) {
    // log.debug(F, `User context target member: ${interaction.targetMember}`);
    target = interaction.targetMember
      ? (interaction.targetMember as GuildMember)
      : interaction.targetUser;
  } else if (interaction.isMessageContextMenuCommand() && interaction.targetMessage) {
    // log.debug(F, `Message context target message member: ${interaction.targetMessage.member}`);
    target = interaction.targetMessage.member
      ? interaction.targetMessage.member
      : interaction.targetMessage.author;
  }

  const targetData = await db.users.upsert({
    create: {
      discord_id: target.id,
    },
    update: {},
    where: {
      discord_id: target.id,
    },
  });

  // Get the guild
  const { guild } = interaction;
  const guildData = await db.discord_guilds.upsert({
    create: {
      id: guild.id,
    },
    update: {},
    where: {
      id: guild.id,
    },
  });

  if (guildData.role_moderator === null) {
    log.error(F, 'No moderator role found');
    return {
      embeds: [
        embedTemplate().setColor(Colors.Red).setTitle('This command can only be used in a guild!'),
      ],
    };
  }

  // Determine if the actor is a mod
  const actorIsModule =
    Boolean(guildData.role_moderator) && actor.roles.cache.has(guildData.role_moderator);

  let timeoutTime = null;
  if (target instanceof GuildMember) {
    timeoutTime = target.communicationDisabledUntilTimestamp;
  }

  if (showModuleButtons) {
    if (isInfo(command) || isReport(command)) {
      actionRow.addComponents(
        modButtonNote(target.id),
        modButtonWarn(target.id),
        modButtonTimeout(target.id),
        modButtonBan(target.id),
        modButtonInfo(target.id),
      );
    } else if (isTimeout(command) || (timeoutTime && timeoutTime > Date.now())) {
      actionRow.addComponents(modButtonUnTimeout(target.id), modButtonInfo(target.id));
    } else if (isBan(command)) {
      actionRow.addComponents(modButtonUnBan(target.id), modButtonInfo(target.id));
    } else {
      actionRow.addComponents(modButtonInfo(target.id));
    }
  } else {
    actionRow.addComponents(modButtonReport(target.id));
  }

  log.debug(F, '[modResponse1] generating user info');
  const modlogEmbed = await userInfoEmbed(actor, target, targetData, 'REPORT', showModuleButtons);

  if (interaction.isMessageContextMenuCommand() && interaction.targetMessage) {
    modlogEmbed.addFields({
      name: 'Message',
      value: stripIndents`> ${interaction.targetMessage.content}
        - ${interaction.targetMessage.url}`,
    });
  }

  log.debug(F, `[modResponse] time: ${Date.now() - startTime}ms`);

  if (showModuleButtons && !actorIsModule && isReport(command)) {
    const actionRowTwo = new ActionRowBuilder<ButtonBuilder>();
    actionRowTwo.addComponents(modButtonAcknowledgeReport(target.id));
    return {
      components: [actionRow, actionRowTwo],
      embeds: [modlogEmbed],
    };
  }

  return {
    components: [actionRow],
    embeds: [modlogEmbed],
  };
}

export async function refusalButton(interaction: ButtonInteraction) {
  const targetData = await db.users.upsert({
    create: {
      discord_id: interaction.user.id,
    },
    update: {},
    where: {
      discord_id: interaction.user.id,
    },
  });

  let targetChan: null | TextChannel = null;
  try {
    targetChan = targetData.mod_thread_id
      ? ((await discordClient.channels.fetch(targetData.mod_thread_id)) as TextChannel)
      : null;
  } catch {
    log.info(F, 'Failed to fetch mod thread. It was likely deleted.');
  }
  if (targetChan) {
    await targetChan.send({
      embeds: [
        embedTemplate()
          .setColor(Colors.Red)
          .setDescription(`${interaction.user.username} has refused their warning and was kicked.`),
      ],
    });
    await targetChan.guild.members.kick(interaction.user, 'Refused to acknowledge warning');
  }
  // remove the components from the message
  await interaction.update({ components: [] });
}

export async function tripSitTrustScore(targetId: string): Promise<{
  trustScore: number;
  tsReasoning: string;
}> {
  // const startTime = Date.now();
  let trustScore = 0;
  let tsReasoning = '';
  const targetPromise = discordClient.users.fetch(targetId);
  const guildsPromise = discordClient.guilds.fetch();

  const target = await targetPromise; // Await here since target is needed for the calculations below
  // Calculate how like it is that this user is a trust.
  // This is based off of factors like, how old is their account, do they have a profile picture, etc.
  const diff = Math.abs(Date.now() - Date.parse(target.createdAt.toString()));
  const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365));
  const months = Math.floor(diff / (1000 * 60 * 60 * 24 * 30));
  const weeks = Math.floor(diff / (1000 * 60 * 60 * 24 * 7));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  if (years > 0) {
    trustScore += 6;
    tsReasoning += '+6 | Account was created at least a year ago\n';
  } else if (years === 0 && months > 0) {
    trustScore += 5;
    tsReasoning += '+5 | Account was created months ago\n';
  } else if (months === 0 && weeks > 0) {
    trustScore += 4;
    tsReasoning += '+4 | Account was created weeks ago\n';
  } else if (weeks === 0 && days > 0) {
    trustScore += 3;
    tsReasoning += '+3 | Account was created days ago\n';
  } else if (days === 0 && hours > 0) {
    trustScore += 2;
    tsReasoning += '+2 | Account was created hours ago\n';
  } else if (hours === 0 && minutes > 0) {
    trustScore += 1;
    tsReasoning += '+1 | Account was created minutes ago\n';
  } else if (minutes === 0 && seconds > 0) {
    trustScore += 0;
    tsReasoning += '+0 | Account was created seconds ago\n';
  }

  if (target.avatarURL()) {
    trustScore += 1;
    tsReasoning += '+1 | Account has a profile picture\n';
  } else {
    trustScore += 0;
    tsReasoning += '+0 | Account does not have a profile picture\n';
  }

  // if (target.bannerURL() !== null) {
  //   trustScore += 1;
  //   tsReasoning += '+1 | Account has a banner\n';
  // } else {
  //   trustScore += 0;
  //   tsReasoning += '+0 | Account does not have a banner\n';
  // }

  // Check how many guilds the member is in
  // await discordClient.guilds.fetch();
  // const targetInGuilds = await Promise.all(discordClient.guilds.cache.map(async guild => {
  //   try {
  //     await guild.members.fetch(target.id);
  //     // log.debug(F, `User is in guild: ${guild.name}`);
  //     return guild;
  //   } catch (err: unknown) {
  //     return null;
  //   }
  // }));

  const [, targetInGuilds] = await Promise.all([
    guildsPromise, // Await the fetched guilds
    Promise.all(
      discordClient.guilds.cache.map(async (guild) => {
        if (guild.members.cache.get(target.id)) {
          return guild;
        }
        return null;
      }),
    ),
  ]);
  const mutualGuilds = targetInGuilds.filter(Boolean);

  if (mutualGuilds.length > 0) {
    trustScore += mutualGuilds.length;
    tsReasoning += `+${mutualGuilds.length} | I currently share ${mutualGuilds.length} guilds with them\n`;
  } else {
    trustScore += 0;
    tsReasoning += '+0 | Account is only in this guild, that i can tell\n';
  }

  await discordClient.guilds.fetch();
  // const noPermissionGuilds = [] as Guild[];
  const notFoundGuilds = [] as Guild[];
  const errorGuilds = [] as Guild[];
  // const bannedTest = await Promise.all(discordClient.guilds.cache.map(async guild => {
  //   // log.debug(F, `Checking guild: ${guild.name}`);
  //   const guildPerms = await checkGuildPermissions(guild, [
  //     'BanMembers' as PermissionResolvable,
  //   ]);

  //   if (!guildPerms) {
  //     // log.debug(F, `No permission to check guild: ${guild.name}`);
  //     noPermissionGuilds.push(guild);
  //     return null;
  //   }

  //   try {
  //     return await guild.bans.fetch(target.id);
  //     // log.debug(F, `User is banned in guild: ${guild.name}`);
  //     // return guild.name;
  //   } catch (err: unknown) {
  //     if ((err as DiscordAPIError).code === 10026) {
  //       // log.debug(F, `User is not banned in guild: ${guild.name}`);
  //       notFoundGuilds.push(guild);
  //       return null;
  //     }
  //     // log.debug(F, `Error checking guild: ${guild.name}`);
  //     errorGuilds.push(guild);
  //     return null;
  //   }
  // }));

  // Separate promises for checking permissions and bans
  const permissionsPromises = discordClient.guilds.cache.map(async (guild) =>
    checkGuildPermissions(guild, ['BanMembers' as PermissionResolvable]),
  );
  const bansPromises = discordClient.guilds.cache.map(async (guild) => {
    try {
      return guild.bans.cache.get(target.id);
    } catch (error: unknown) {
      if ((error as DiscordAPIError).code === 10_026) {
        notFoundGuilds.push(guild);
        return null;
      }
      errorGuilds.push(guild);
      return null;
    }
  });

  const [permissionsResults, bannedTest] = await Promise.all([
    Promise.all(permissionsPromises),
    Promise.all(bansPromises),
  ]);

  // count how many 'banned' appear in the array
  const bannedGuilds = bannedTest.filter(Boolean) as GuildBan[];
  // log.debug(F, `Banned Guilds: ${bannedGuilds.join(', ')}`);

  // log.debug(F, `permissionsResults: ${permissionsResults}`);
  // log.debug(F, `bannedTest: ${bannedTest}`);
  const noPermissionGuilds = permissionsResults.filter((item) => !item.hasPermission);

  // count how many i didn't have permission to check
  // log.debug(F, `No Permission Guilds: ${noPermissionGuilds.map(guild => guild.name).join(', ')}`);
  // log.debug(F, `Not Found Guilds: ${notFoundGuilds.map(guild => guild.name).join(', ')}`);
  // log.debug(F, `Error Guilds: ${errorGuilds.map(guild => guild.name).join(', ')}`);
  const checkedGuildNumber = bannedTest.length - noPermissionGuilds.length;

  if (bannedGuilds.length === 0) {
    trustScore += 0;
    tsReasoning += stripIndents`+0 | Not banned in ${checkedGuildNumber} other guilds that I can see.`;
  } else {
    trustScore -= bannedGuilds.length * 5;

    const tsBanReasons = (
      await Promise.all(
        bannedGuilds.map(async (banData) => {
          if (banData.partial) {
            await banData.fetch();
          }

          let reasonString = ': No reason found.';
          if (banData.reason) {
            reasonString = `: ${banData.reason}`;
          }

          return `${banData.guild.name}${reasonString}`;
        }),
      )
    ).join('\n');

    tsReasoning += stripIndents`-${bannedGuilds.length * 5} | Banned in least ${bannedGuilds.length} of the ${checkedGuildNumber} guilds I can check.
    ${tsBanReasons}
    `;
  }

  // log.debug(F, `[trust score] time: ${Date.now() - startTime}ms`);
  return {
    trustScore,
    tsReasoning,
  };
}

export async function userInfoEmbed(
  actor: GuildMember | null,
  target: GuildMember | string | User,
  targetData: users,
  command: ModuleAction,
  showModuleInfo: boolean,
): Promise<EmbedBuilder> {
  log.debug(
    F,
    `[userInfoEmbed] actor: ${actor} | target: ${target} | targetData: ${JSON.stringify(targetData, null, 2)} | command: ${command}`,
  );
  // const startTime = Date.now();
  const targetActionList = {
    CONTRIBUTOR_BAN: [] as string[],
    DISCORD_BOT_BAN: [] as string[],
    FULL_BAN: [] as string[],
    HELPER_BAN: [] as string[],
    KICK: [] as string[],
    NOTE: [] as string[],
    REPORT: [] as string[],
    TICKET_BAN: [] as string[],
    TIMEOUT: [] as string[],
    UNDERBAN: [] as string[],
    WARNING: [] as string[],
  };
  // Populate targetActionList from the db

  // const targetActionListRaw = await database.actions.get(targetData.id);
  const targetActionListRaw = await db.user_actions.findMany({
    where: {
      user_id: targetData.id,
    },
  });

  // log.debug(F, `targetActionListRaw: ${JSON.stringify(targetActionListRaw, null, 2)}`);

  // for (const action of targetActionListRaw) {
  for (const action of targetActionListRaw) {
    // log.debug(F, `action: ${JSON.stringify(action, null, 2)}`);
    const actionString = `${time(action.created_at, 'R')}: ${action.internal_note ?? 'No note provided'}`;
    targetActionList[action.type as keyof typeof targetActionList].push(actionString);
  }

  // log.debug(F, `targetActionList: ${JSON.stringify(targetActionList, null, 2)}`);

  log.debug(F, `Target: ${JSON.stringify(target, null, 2)}`);

  // const targetDisplayName = (target as GuildMember).displayName ?? null;
  // let targetUserName = null as string | null;
  // if ((target as GuildMember).user) {
  //   targetUserName = (target as GuildMember).user.username;
  // }
  // if ((target as User).username) {
  //   targetUserName = (target as User).username;
  // }

  // log.debug(F, `targetDisplayName: ${targetDisplayName}`);

  const targetId = (target as GuildMember | User).id ?? target;

  // // Construct the author string that includes the display name and username if available
  // let targetString = '';
  // if (targetDisplayName) {
  //   targetString += `${targetDisplayName} `;
  // }
  // if (targetUserName) {
  //   targetString += `(${targetUserName}) `;
  // }
  // targetString += `(${targetId})`;

  // log.debug(F, `targetString: ${targetString}`);
  // const tag = (target as GuildMember).user ? (target as GuildMember).user.tag : (target as User).tag;
  let userAvatar = null;
  try {
    if ((target as GuildMember).user) {
      userAvatar = (target as GuildMember).user.displayAvatarURL();
    }
  } catch {
    try {
      if ((target as User).displayAvatarURL()) {
        userAvatar = (target as User).displayAvatarURL();
      }
    } catch {
      // Ignore
    }
  }

  // log.debug(F, `userAvatar: ${userAvatar}`);
  const modlogEmbed = new EmbedBuilder()
    .setFooter(null)
    // .setAuthor({ name: 'Report a user', iconURL: userAvatar })
    .setThumbnail(userAvatar)
    .setColor(
      command
        ? embedVariables[command as keyof typeof embedVariables].embedColor
        : Colors.DarkOrange,
    );
  // .addFields(
  //   // { name: tag, value: `${target.id}`, inline: true },
  //   {
  //     name: 'Created',
  //     value: `${time(((target as GuildMember).user
  //     ?? (target as User)).createdAt, 'R')}`,
  //     inline: true,
  //   },
  //   {
  //     name: 'Joined',
  //     value: `${(target as GuildMember).joinedAt
  //       ? time((target as GuildMember).joinedAt as Date, 'R')
  //       : 'Unknown'}`,
  //     inline: true,
  //   },
  //   {
  //     name: 'ID',
  //     value: `${(target as User | GuildMember).id ?? target}`,
  //     inline: true,
  //   },
  // );

  const description = `Report <@${targetId}>`;
  if (command === 'REPORT') {
    modlogEmbed.setDescription(`${description}
      
      Click the button below, fill out the form, and a submit the report.
      A moderator will review it as soon as possible.
      While under review, avoid engaging with the user, and consider blocking.
      `);
  }
  if (showModuleInfo) {
    // log.debug(F, `[] actor: ${actor}`);
    // // If the actor is a moderator
    // const guildData = await db.discord_guilds.upsert({
    //   where: {
    //     id: actor.guild.id,
    //   },
    //   create: {
    //     id: actor.guild.id,
    //   },
    //   update: {
    //   },
    // });

    // // If the actor is a moderator
    // if (showModInfo && guildData.role_moderator && actor.roles.cache.has(guildData.role_moderator)) {
    let infoString = stripIndents`
        ${targetActionList.FULL_BAN.length > 0 ? `**Bans**\n${targetActionList.FULL_BAN.join('\n')}` : ''}
        ${targetActionList.UNDERBAN.length > 0 ? `**Underbans**\n${targetActionList.UNDERBAN.join('\n')}` : ''}
        ${targetActionList.KICK.length > 0 ? `**Kicks**\n${targetActionList.KICK.join('\n')}` : ''}
        ${targetActionList.TIMEOUT.length > 0 ? `**Timeouts**\n${targetActionList.TIMEOUT.join('\n')}` : ''}
        ${targetActionList.WARNING.length > 0 ? `**Warns**\n${targetActionList.WARNING.join('\n')}` : ''}
        ${targetActionList.REPORT.length > 0 ? `**Reports**\n${targetActionList.REPORT.join('\n')}` : ''}
        ${targetActionList.NOTE.length > 0 ? `**Notes**\n${targetActionList.NOTE.join('\n')}` : ''}
        `;
    if (infoString.length === 0) {
      infoString = 'Squeaky clean!';
    }
    if (targetActionList.NOTE.length > 0) {
      modlogEmbed.addFields({
        inline: true,
        name: '# of Notes',
        value: `${targetActionList.NOTE.length}`,
      });
    }
    if (targetActionList.WARNING.length > 0) {
      modlogEmbed.addFields({
        inline: true,
        name: '# of Warns',
        value: `${targetActionList.WARNING.length}`,
      });
    }
    if (targetActionList.REPORT.length > 0) {
      modlogEmbed.addFields({
        inline: true,
        name: '# of Reports',
        value: `${targetActionList.REPORT.length}`,
      });
    }
    if (targetActionList.TIMEOUT.length > 0) {
      modlogEmbed.addFields({
        inline: true,
        name: '# of Timeouts',
        value: `${targetActionList.TIMEOUT.length}`,
      });
    }
    if (targetActionList.KICK.length > 0) {
      modlogEmbed.addFields({
        inline: true,
        name: '# of Kicks',
        value: `${targetActionList.KICK.length}`,
      });
    }
    if (targetActionList.FULL_BAN.length > 0) {
      modlogEmbed.addFields({
        inline: true,
        name: '# of Bans',
        value: `${targetActionList.FULL_BAN.length}`,
      });
    }
    if (targetActionList.UNDERBAN.length > 0) {
      modlogEmbed.addFields({
        inline: true,
        name: '# of Underbans',
        value: `${targetActionList.UNDERBAN.length}`,
      });
    }
    modlogEmbed.setDescription(description);
    // modlogEmbed.setDescription(`${description}

    //   **TripSit TrustScore: ${trustScore.trustScore}**
    //   `);
    if (isInfo(command)) {
      log.debug(F, 'Generating trust score');
      const trustScore = await tripSitTrustScore(targetId);
      modlogEmbed.setDescription(`${description}

      ${infoString}
      
      **TripSit TrustScore: ${trustScore.trustScore}**
      \`\`\`${trustScore.tsReasoning}\`\`\`
      `);
    }
  }

  // log.debug(F, `[userInfoEmbed] time: ${Date.now() - startTime}ms`);
  // log.debug(F, `modlogEmbed: ${JSON.stringify(modlogEmbed, null, 2)}`);
  return modlogEmbed;
}

async function messageModuleThread(
  interaction:
    | ButtonInteraction
    | ChatInputCommandInteraction
    | MessageContextMenuCommandInteraction
    | UserContextMenuCommandInteraction,
  actor: GuildMember,
  target: GuildMember | string | User,
  command: ModuleAction,
  internalNote: string,
  description: string,
  extraMessage: string,
  duration: string,
): Promise<null | ThreadChannel> {
  log.debug(
    F,
    `[messageModThread] actor: ${actor} | target: ${target} | command: ${command} | internalNote: ${internalNote} | description: ${description} | extraMessage: ${extraMessage} | duration: ${duration}`,
  );
  const startTime = Date.now();
  const targetId = (target as GuildMember | User).id ?? target;
  const targetName = (target as GuildMember).displayName ?? (target as User).username ?? target;

  const targetData = await db.users.upsert({
    create: { discord_id: targetId },
    update: {},
    where: { discord_id: targetId },
  });
  log.debug(F, `targetData: ${JSON.stringify(targetData, null, 2)}`);
  const guildData = await db.discord_guilds.upsert({
    create: { id: actor.guild.id },
    update: {},
    where: { id: actor.guild.id },
  });
  log.debug(F, `guildData: ${JSON.stringify(guildData, null, 2)}`);

  if (!guildData.channel_moderators) {
    return null;
  }

  if (!guildData.channel_mod_log) {
    return null;
  }

  log.debug(F, 'Values are set, continuing');

  const { emoji, pastVerb } = embedVariables[command as keyof typeof embedVariables];
  let summary = `${actor} ${pastVerb} ${target}`;
  let anonSummary = `${targetName} was ${pastVerb}`;

  if (isTimeout(command)) {
    summary = summary.concat(duration);
    anonSummary = anonSummary.concat(duration);
  }

  // log.debug(F, `summary: ${summary}`);

  log.debug(F, '[messageModThread] generating user info');
  const modlogEmbed = await userInfoEmbed(actor, target, targetData, command, true);

  try {
    const moduleEmbedObject = (interaction as ButtonInteraction).message.embeds[0].toJSON();
    const messageField = moduleEmbedObject.fields!.find((field) => field.name === 'Message');
    if (messageField) {
      modlogEmbed.addFields(messageField);
    }
  } catch {
    // log.debug(F, `No message field found: ${err}`);
  }

  log.debug(F, 'Sending message to mod log');
  const moduleLogChan = (await discordClient.channels.fetch(
    guildData.channel_mod_log,
  )) as TextChannel;
  await moduleLogChan.send({
    content: stripIndents`
    ${anonSummary}
    **Reason:** ${internalNote ?? noReason}
    **Note sent to user:** ${description !== '' && description !== null ? description : noMessageSent}
    `,
    embeds: [modlogEmbed],
  });

  if (extraMessage) {
    await moduleLogChan.send({ content: extraMessage });
  }

  let moduleThread = null as null | ThreadChannel;
  const vendorBan = internalNote?.toLowerCase().includes('vendor') && isFullBan(command);
  if (!vendorBan) {
    const guild = await discordClient.guilds.fetch(guildData.id);
    if (targetData.mod_thread_id) {
      // log.debug(F, `Mod thread id exists: ${targetData.mod_thread_id}`);
      try {
        moduleThread = (await guild.channels.fetch(
          targetData.mod_thread_id,
        )) as null | ThreadChannel;
        // log.debug(F, 'Mod thread exists');
      } catch {
        // log.debug(F, 'Mod thread does not exist');
      }
    }

    // log.debug(F, `Mod thread: ${JSON.stringify(modThread, null, 2)}`);

    let newModuleThread = false;
    if (!moduleThread) {
      // If the mod thread doesn't exist for whatever reason, `maybe it got deleted, make a new one
      // If the user we're banning is a vendor, don't make a new one
      // Create a new thread in the mod channel
      // log.debug(F, 'creating mod thread');
      if (guildData.channel_moderators === null) {
        throw new Error('Moderator room id is null');
      }
      const moduleChan = (await discordClient.channels.fetch(
        guildData.channel_moderators,
      )) as TextChannel;
      moduleThread = await moduleChan.threads.create({
        autoArchiveDuration: 60,
        name: `${emoji}│${targetName}`,
      });
      // log.debug(F, 'created mod thread');
      // Save the thread id to the user
      targetData.mod_thread_id = moduleThread.id;
      await db.users.update({
        data: {
          mod_thread_id: moduleThread.id,
        },
        where: {
          discord_id: targetId,
        },
      });
      log.debug(F, 'saved mod thread id to user');
      newModuleThread = true;
    }

    if (!guildData.role_moderator) {
      throw new Error('Moderator role id is null');
    }
    const roleModerator = (await guild.roles.fetch(guildData.role_moderator))!;

    await moduleThread.send({
      content: stripIndents`
      ${summary}
      **Reason:** ${internalNote ?? noReason}
      **Note sent to user:** ${description !== '' && description !== null ? description : noMessageSent}
      ${command === 'NOTE' && !newModuleThread ? '' : roleModerator}
      `,
      ...(await modResponse(interaction, command, true)),
    });

    await moduleThread.setName(`${emoji}│${targetName}`);

    if (extraMessage) {
      await moduleThread.send({ content: extraMessage });
    }
  }

  log.debug(F, `[messageModThread] time: ${Date.now() - startTime}ms`);
  return moduleThread;
}

async function messageUser(
  target: User,
  guild: Guild,
  command: ModuleAction,
  messageToUser: string,
  addButtons?: boolean,
) {
  // log.debug(F, `Message user: ${target.username}`);
  const startTime = Date.now();
  const embed = embedTemplate()
    .setColor(embedVariables[command as keyof typeof embedVariables].embedColor)
    .setTitle(embedVariables[command as keyof typeof embedVariables].embedTitle)
    .setDescription(messageToUser);

  let message = {} as Message;
  try {
    message = await (addButtons
      ? target.send({ components: [warnButtons], embeds: [embed] })
      : target.send({ embeds: [embed] }));
  } catch {
    return;
  }

  if (addButtons) {
    const targetData = await db.users.upsert({
      create: {
        discord_id: target.id,
      },
      update: {},
      where: {
        discord_id: target.id,
      },
    });

    const messageFilter = (mi: MessageComponentInteraction) => mi.user.id === target.id;
    const collector = message.createMessageComponentCollector({ filter: messageFilter, time: 0 });

    // Fetch the mod thread channel once
    let targetChan: null | TextChannel = null;
    try {
      targetChan = targetData.mod_thread_id
        ? ((await discordClient.channels.fetch(targetData.mod_thread_id)) as TextChannel)
        : null;
    } catch {
      log.info(F, 'Failed to fetch mod thread. It was likely deleted.');
    }

    collector.on('collect', async (mi: MessageComponentInteraction) => {
      if (mi.customId.startsWith('acknowledgeButton')) {
        if (targetChan) {
          await targetChan.send({
            embeds: [
              embedTemplate()
                .setColor(Colors.Green)
                .setDescription(`${target.username} has acknowledged their warning.`),
            ],
          });
        }
        // remove the components from the message
        await mi.update({ components: [] });
        mi.user.send(
          'Thanks for understanding! We appreciate your cooperation and will consider this in the future!',
        );
      } else if (mi.customId.startsWith('refusalButton')) {
        if (targetChan) {
          await targetChan.send({
            embeds: [
              embedTemplate()
                .setColor(Colors.Red)
                .setDescription(`${target.username} has refused their timeout and was kicked.`),
            ],
          });
        }
        // remove the components from the message
        await mi.update({ components: [] });
        mi.user.send(
          stripIndents`Thanks for admitting this, you\'ve been removed from the guild. You can rejoin if you ever decide to cooperate.`,
        );
        await guild.members.kick(target, 'Refused to acknowledge timeout');
      }
    });
  }
  log.debug(F, `[messageUser] time: ${Date.now() - startTime}ms`);
}

async function onActionedRecently(buttonInt: ButtonInteraction, modalInt: ModalSubmitInteraction) {
  const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('proceedButton')
      .setLabel('Proceed')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('nahButton')
      .setLabel("Nah I'm good")
      .setStyle(ButtonStyle.Secondary),
  );

  const replyMessage = await buttonInt.followUp({
    components: [actionRow],
    content: stripIndents`This action has already been taken by another moderator in the last 5 minutes. Would you like to proceed anyways?
    
    NOTE: These buttons will only remain functional for 1 minute.`,
    ephemeral: true,
  });

  // Filter only for ButtonInteraction
  const filter = (index: AnySelectMenuInteraction | ButtonInteraction) =>
    index.isButton() && index.user.id === buttonInt.user.id;
  const collector = replyMessage.createMessageComponentCollector({ filter, time: 60_000 });

  return new Promise((resolve) => {
    collector.on('collect', async (index: ButtonInteraction) => {
      try {
        // Don't call deferUpdate() if you plan to use update()
        if (index.customId === 'proceedButton') {
          await index.update({ components: [], content: 'Proceeding with the action...' });

          await moderate(buttonInt, modalInt, true);
          resolve('proceeded');
        } else if (index.customId === 'nahButton') {
          await index.update({ components: [], content: 'Action cancelled.' });
          resolve('cancelled');
        }
      } catch (error) {
        log.error(F, `Error updating message: ${error}`);
      }
    });
    /*
    collector.on('end', async collected => {
      if (collected.size === 0) {
        try {
          // For timeouts, try to edit the original reply
          // await buttonInt.editReply({ content: 'No response received. Action cancelled.', components: [] });
        } catch (error) {
          log.error(F, `Error updating actioned recently message: ${error}`);
        }
        resolve('timeout');
      }
    });
    */
  });
}

async function wasActionedRecently(actionType: string): Promise<boolean> {
  const oneMinuteAgo = new Date(Date.now() - 300 * 1000);
  const recentAction = await db.user_actions.findFirst({
    where: {
      created_at: {
        gte: oneMinuteAgo,
      },
      type: actionType as user_action_type,
    },
  });
  return recentAction !== null;
}
