/* eslint-disable sonarjs/no-duplicate-string */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable max-len */
import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  // Colors,
  GuildMember,
  ModalBuilder,
  TextInputBuilder,
  ActionRowBuilder,
  ModalSubmitInteraction,
  Colors,
  User,

  time,
  ButtonBuilder,
  TextChannel,
  Role,
  InteractionReplyOptions,
  EmbedBuilder,
  ThreadChannel,
  MessageComponentInteraction,
  PermissionResolvable,
  DiscordAPIError,
  GuildBan,
  Guild,
  Message,
  ButtonInteraction,
  ContextMenuCommandBuilder,
  UserContextMenuCommandInteraction,
  MessageContextMenuCommandInteraction,
  Interaction,
  InteractionResponse,
  APIEmbedField,
  UserSelectMenuInteraction,
  ContextMenuCommandInteraction,
} from 'discord.js';
import {
  TextInputStyle,
  ButtonStyle,
} from 'discord-api-types/v10';
import { stripIndents } from 'common-tags';
import { user_action_type, user_actions, users } from '@prisma/client';
import ms from 'ms';
import { SlashCommand } from '../../@types/commandDef';
import { parseDuration } from '../../../global/utils/parseDuration';
import commandContext from '../../utils/context'; // eslint-disable-line
import { getDiscordMember, getDiscordUser } from '../../utils/guildMemberLookup';
import { embedTemplate } from '../../utils/embedTemplate';

// import { last } from '../../../global/commands/g.last';
import { botBannedUsers } from '../../utils/populateBotBans';
import { checkGuildPermissions } from '../../utils/checkPermissions';
import { last } from '../../../global/commands/g.last';

/* TODO:
Add unban messages

replace all .env stuff

Motion to <action> users with votes
*/

const F = f(__filename);
type UndoAction = 'UN-FULL_BAN' | 'UN-TICKET_BAN' | 'UN-DISCORD_BOT_BAN' | 'UN-BAN_EVASION' | 'UN-UNDERBAN' | 'UN-TIMEOUT' | 'UN-HELPER_BAN' | 'UN-CONTRIBUTOR_BAN';

type ModAction = user_action_type | UndoAction | 'LINK';
// type BanAction = 'FULL_BAN' | 'TICKET_BAN' | 'DISCORD_BOT_BAN' | 'BAN_EVASION' | 'UNDERBAN';

const noReason = 'No reason provided';
const internalNotePlaceholder = 'Tell other moderators why you\'re doing this';
const descriptionLabel = 'What should we tell the user?';
const descriptionPlaceholder = 'Tell the user why you\'re doing this';
const mepWarning = 'You cannot use the word "MEP" here.';
const noMessageSent = '*No message sent to user*';
const cooperativeExplanation = stripIndents`This is a suite of moderation tools for guilds to use, \
this includes the ability to ban, warn, report, and more!

Currently these tools are only available to a limited number of partner guilds, \
use /cooperative info for more information.`;
const noUserError = 'Could not find that member/user!';

const embedVariables = {
  NOTE: {
    embedColor: Colors.Yellow,
    embedTitle: 'Note!',
    pastVerb: 'noted',
    presentVerb: 'noting',
  },
  WARNING: {
    embedColor: Colors.Yellow,
    embedTitle: 'Warned!',
    pastVerb: 'warned',
    presentVerb: 'warning',
  },
  FULL_BAN: {
    embedColor: Colors.Red,
    embedTitle: 'Banned!',
    pastVerb: 'banned',
    presentVerb: 'banning',
  },
  'UN-FULL_BAN': {
    embedColor: Colors.Green,
    embedTitle: 'Un-banned!',
    pastVerb: 'un-banned',
    presentVerb: 'un-banning',
  },
  TICKET_BAN: {
    embedColor: Colors.Red,
    embedTitle: 'Ticket Banned!',
    pastVerb: 'banned from using tickets',
    presentVerb: 'banning from using tickets',
  },
  'UN-TICKET_BAN': {
    embedColor: Colors.Green,
    embedTitle: 'Un-Ticket Banned!',
    pastVerb: 'allowed to submit tickets again',
    presentVerb: 'allowing to submit tickets again',
  },
  DISCORD_BOT_BAN: {
    embedColor: Colors.Red,
    embedTitle: 'Discord Bot Banned!',
    pastVerb: 'banned from using the Discord bot',
    presentVerb: 'banning from using the Discord bot',
  },
  'UN-DISCORD_BOT_BAN': {
    embedColor: Colors.Green,
    embedTitle: 'Un-Discord Bot Banned!',
    pastVerb: 'allowed to use the Discord bot again',
    presentVerb: 'allowing to use the Discord bot again',
  },
  HELPER_BAN: {
    embedColor: Colors.Red,
    embedTitle: 'Helper Role Banned!',
    pastVerb: 'banned from using the Helper role',
    presentVerb: 'banning from using the Helper role',
  },
  'UN-HELPER_BAN': {
    embedColor: Colors.Green,
    embedTitle: 'Un-Helper Role Banned!',
    pastVerb: 'allowed to use the Helper role again',
    presentVerb: 'allowing to use the Helper role again',
  },
  CONTRIBUTOR_BAN: {
    embedColor: Colors.Red,
    embedTitle: 'Contributor Role Banned!',
    pastVerb: 'banned from using the Contributor role',
    presentVerb: 'banning from using the Contributor role',
  },
  'UN-CONTRIBUTOR_BAN': {
    embedColor: Colors.Green,
    embedTitle: 'Un-Contributor Role Banned!',
    pastVerb: 'allowed to use the Contributor role again',
    presentVerb: 'allowing to use the Contributor role again',
  },
  BAN_EVASION: {
    embedColor: Colors.Red,
    embedTitle: 'Ban Evasion!',
    pastVerb: 'banned for evasion',
    presentVerb: 'banning for evasion',
  },
  'UN-BAN_EVASION': {
    embedColor: Colors.Green,
    embedTitle: 'Un-Ban Evasion!',
    pastVerb: 'un-banned for evasion',
    presentVerb: 'un-banning for evasion',
  },
  UNDERBAN: {
    embedColor: Colors.Red,
    embedTitle: 'Underban!',
    pastVerb: 'banned for being underage',
    presentVerb: 'banning for being underage',
  },
  'UN-UNDERBAN': {
    embedColor: Colors.Green,
    embedTitle: 'Un-Underban!',
    pastVerb: 'un-banned for being underage',
    presentVerb: 'un-banning for being underage',
  },
  TIMEOUT: {
    embedColor: Colors.Yellow,
    embedTitle: 'Timeout!',
    pastVerb: 'timed out',
    presentVerb: 'timing out',
  },
  'UN-TIMEOUT': {
    embedColor: Colors.Green,
    embedTitle: 'Untimeout!',
    pastVerb: 'removed from time-out',
    presentVerb: 'removing from time-out',
  },
  KICK: {
    embedColor: Colors.Orange,
    embedTitle: 'Kicked!',
    pastVerb: 'kicked',
    presentVerb: 'kicking',
  },
  REPORT: {
    embedColor: Colors.Orange,
    embedTitle: 'Report!',
    pastVerb: 'reported',
    presentVerb: 'reporting',
  },
  INFO: {
    embedColor: Colors.Green,
    embedTitle: 'Info!',
    pastVerb: 'got info on',
    presentVerb: 'getting info on',
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

// Various action type checks
function isTimeout(command: ModAction): command is 'TIMEOUT' { return command === 'TIMEOUT'; }

function isUnTimeout(command: ModAction): command is 'UN-TIMEOUT' { return command === 'UN-TIMEOUT'; }

function isWarning(command: ModAction): command is 'WARNING' { return command === 'WARNING'; }

function isBan(command: ModAction): command is 'FULL_BAN' | 'BAN_EVASION' | 'UNDERBAN' | 'TICKET_BAN' | 'DISCORD_BOT_BAN' | 'HELPER_BAN' | 'CONTRIBUTOR_BAN' {
  return command === 'FULL_BAN' || command === 'BAN_EVASION' || command === 'UNDERBAN';
}

function isUnBan(command: ModAction): command is 'UN-FULL_BAN' | 'UN-BAN_EVASION' | 'UN-UNDERBAN' | 'UN-TICKET_BAN' | 'UN-DISCORD_BOT_BAN' | 'UN-HELPER_BAN' | 'UN-CONTRIBUTOR_BAN' {
  return command === 'UN-FULL_BAN' || command === 'UN-BAN_EVASION' || command === 'UN-UNDERBAN';
}

function sendsMessageToUser(command: ModAction): command is 'WARNING' | 'FULL_BAN' | 'TICKET_BAN' | 'DISCORD_BOT_BAN' | 'BAN_EVASION' | 'UNDERBAN' | 'TIMEOUT' | 'KICK' {
  return command === 'WARNING' || command === 'FULL_BAN' || command === 'TICKET_BAN' || command === 'DISCORD_BOT_BAN' || command === 'BAN_EVASION' || command === 'UNDERBAN' || command === 'TIMEOUT' || command === 'KICK';
}

function isFullBan(command: ModAction): command is 'FULL_BAN' { return command === 'FULL_BAN'; }

function isUnFullBan(command: ModAction): command is 'UN-FULL_BAN' { return command === 'UN-FULL_BAN'; }

function isUnderban(command: ModAction): command is 'UNDERBAN' { return command === 'UNDERBAN'; }

function isUnUnderban(command: ModAction): command is 'UN-UNDERBAN' { return command === 'UN-UNDERBAN'; }

function isTicketBan(command: ModAction): command is 'TICKET_BAN' { return command === 'TICKET_BAN'; }

function isUnTicketBan(command: ModAction): command is 'UN-TICKET_BAN' { return command === 'UN-TICKET_BAN'; }

function isDiscordBotBan(command: ModAction): command is 'DISCORD_BOT_BAN' { return command === 'DISCORD_BOT_BAN'; }

function isUnDiscordBotBan(command: ModAction): command is 'UN-DISCORD_BOT_BAN' { return command === 'UN-DISCORD_BOT_BAN'; }

function isHelperBan(command: ModAction): command is 'HELPER_BAN' { return command === 'HELPER_BAN'; }

function isUnHelperBan(command: ModAction): command is 'UN-HELPER_BAN' { return command === 'UN-HELPER_BAN'; }

function isContributorBan(command: ModAction): command is 'CONTRIBUTOR_BAN' { return command === 'CONTRIBUTOR_BAN'; }

function isUnContributorBan(command: ModAction): command is 'UN-CONTRIBUTOR_BAN' { return command === 'UN-CONTRIBUTOR_BAN'; }

function isBanEvasion(command: ModAction): command is 'BAN_EVASION' { return command === 'BAN_EVASION'; }

function isUnBanEvasion(command: ModAction): command is 'UN-BAN_EVASION' { return command === 'UN-BAN_EVASION'; }

function isKick(command: ModAction): command is 'KICK' { return command === 'KICK'; }

function isReport(command: ModAction): command is 'REPORT' { return command === 'REPORT'; }

function isNote(command: ModAction): command is 'NOTE' { return command === 'NOTE'; }

function isDiscussable(command: ModAction): command is 'DISCORD_BOT_BAN' | 'TICKET_BAN' | 'WARNING' | 'KICK' {
  return command === 'DISCORD_BOT_BAN' || command === 'TICKET_BAN' || command === 'WARNING' || command === 'KICK';
}

function isRepeatable(command: ModAction): command is 'KICK' | 'WARNING' | 'TIMEOUT' {
  return command === 'KICK' || command === 'WARNING' || command === 'TIMEOUT';
}

function isAcknowledgeable(command: ModAction): command is 'WARNING' | 'TIMEOUT' {
  return command === 'WARNING';
}

export const modButtons = (discordId: string) => new ActionRowBuilder<ButtonBuilder>().addComponents(
  new ButtonBuilder()
    .setCustomId(`moderate~note~${discordId}`)
    .setLabel('Note')
    .setEmoji('🗒️')
    .setStyle(ButtonStyle.Success),
  new ButtonBuilder()
    .setCustomId(`moderate~warn~${discordId}`)
    .setLabel('Warn')
    .setEmoji('⚠️')
    .setStyle(ButtonStyle.Primary),
  new ButtonBuilder()
    .setCustomId(`moderate~timeout~${discordId}`)
    .setLabel('Mute')
    .setEmoji('⏳')
    .setStyle(ButtonStyle.Secondary),
  new ButtonBuilder()
    .setCustomId(`moderate~ban~${discordId}`)
    .setLabel('Ban')
    .setEmoji('🔨')
    .setStyle(ButtonStyle.Danger),
);

export async function linkThread(
  discordId: string,
  threadId: string,
  override: boolean | null,
): Promise<string | null> {
  // Get the targetData from the db
  const userData = await db.users.upsert({
    where: {
      discord_id: discordId,
    },
    create: {
      discord_id: discordId,
    },
    update: {},
  });

  if (userData.mod_thread_id === null || override) {
    // log.debug(F, `targetData.mod_thread_id is null, updating it`);
    await db.users.update({
      where: {
        id: userData.id,
      },
      data: {
        mod_thread_id: threadId,
      },
    });
    return null;
  }
  // log.debug(F, `targetData.mod_thread_id is not null, not updating it`);
  return userData.mod_thread_id;
}

export async function userInfoEmbed(
  targetId: string,
  guildId: string,
): Promise<EmbedBuilder> {
  const targetActionList = {
    NOTE: [] as string[],
    WARNING: [] as string[],
    REPORT: [] as string[],
    TIMEOUT: [] as string[],
    KICK: [] as string[],
    FULL_BAN: [] as string[],
    UNDERBAN: [] as string[],
    TICKET_BAN: [] as string[],
    DISCORD_BOT_BAN: [] as string[],
    HELPER_BAN: [] as string[],
    CONTRIBUTOR_BAN: [] as string[],
  };

  const targetData = await db.users.upsert({
    where: {
      discord_id: targetId,
    },
    create: {
      discord_id: targetId,
    },
    update: {},
  });

  // Populate targetActionList from the db

  const targetActionListRaw = await db.user_actions.findMany({
    where: {
      user_id: targetData.id,
    },
    orderBy: {
      created_at: 'desc',
    },
  });

  // log.debug(F, `targetActionListRaw: ${JSON.stringify(targetActionListRaw, null, 2)}`);

  // for (const action of targetActionListRaw) {
  targetActionListRaw.forEach(action => {
    // log.debug(F, `action: ${JSON.stringify(action, null, 2)}`);
    const actionString = `${action.type} (${time(action.created_at, 'R')}) - ${action.internal_note
      ?? 'No note provided'}`;
    // log.debug(F, `actionString: ${actionString}`);
    targetActionList[action.type as keyof typeof targetActionList].push(actionString);
  });

  let targetMember = null as null | GuildMember;
  try {
    const targetGuild = await discordClient.guilds.fetch(guildId);
    targetMember = await targetGuild.members.fetch(targetId);
  } catch (err) {
    // Ignore
  }
  let targetUser = null as null | User;
  try {
    targetUser = await discordClient.users.fetch(targetId);
  } catch (err) {
    // Ignore
  }

  let displayName = '';
  let tag = '';
  let iconUrl = '';
  let created = '' as string;
  let joined = '' as string;
  if (targetMember) {
    displayName = targetMember.displayName;
    tag = targetMember.user.tag;
    iconUrl = targetMember.user.displayAvatarURL();
    created = time(targetMember.user.createdAt as Date, 'R');
    joined = time(targetMember.joinedAt as Date, 'R');
  } else if (targetUser) {
    displayName = targetUser.username;
    tag = targetUser.tag;
    iconUrl = targetUser.displayAvatarURL();
    created = time(targetUser.createdAt as Date, 'R');
    joined = 'Unknown';
  }

  // log.debug(F, `targetActionList: ${JSON.stringify(targetActionList, null, 2)}`);
  const modlogEmbed = embedTemplate()
    // eslint-disable-next-line
    .setFooter(null)
    .setAuthor({ name: `${displayName} (${tag})`, iconURL: iconUrl })
    .addFields(
      { name: 'Created', value: `${created}`, inline: true },
      { name: 'Joined', value: `${joined}`, inline: true },
      { name: 'ID', value: `${targetId}`, inline: true },
    );
  if (targetActionList.NOTE.length > 0) {
    modlogEmbed.addFields({ name: '# of Notes', value: `${targetActionList.NOTE.length}`, inline: true });
  }
  if (targetActionList.WARNING.length > 0) {
    modlogEmbed.addFields({ name: '# of Warns', value: `${targetActionList.WARNING.length}`, inline: true });
  }
  if (targetActionList.REPORT.length > 0) {
    modlogEmbed.addFields({ name: '# of Reports', value: `${targetActionList.REPORT.length}`, inline: true });
  }
  if (targetActionList.TIMEOUT.length > 0) {
    modlogEmbed.addFields({ name: '# of Timeouts', value: `${targetActionList.TIMEOUT.length}`, inline: true });
  }
  if (targetActionList.KICK.length > 0) {
    modlogEmbed.addFields({ name: '# of Kicks', value: `${targetActionList.KICK.length}`, inline: true });
  }
  if (targetActionList.FULL_BAN.length > 0) {
    modlogEmbed.addFields({ name: '# of Bans', value: `${targetActionList.FULL_BAN.length}`, inline: true });
  }
  if (targetActionList.UNDERBAN.length > 0) {
    modlogEmbed.addFields({ name: '# of Underbans', value: `${targetActionList.UNDERBAN.length}`, inline: true });
  }

  // if (command === 'INFO') {
  //   let infoString = stripIndents`
  //     ${targetActionList.FULL_BAN.length > 0 ? `**Bans**\n${targetActionList.FULL_BAN.join('\n')}` : ''}
  //     ${targetActionList.UNDERBAN.length > 0 ? `**Underbans**\n${targetActionList.UNDERBAN.join('\n')}` : ''}
  //     ${targetActionList.KICK.length > 0 ? `**Kicks**\n${targetActionList.KICK.join('\n')}` : ''}
  //     ${targetActionList.TIMEOUT.length > 0 ? `**Timeouts**\n${targetActionList.TIMEOUT.join('\n')}` : ''}
  //     ${targetActionList.WARNING.length > 0 ? `**Warns**\n${targetActionList.WARNING.join('\n')}` : ''}
  //     ${targetActionList.REPORT.length > 0 ? `**Reports**\n${targetActionList.REPORT.join('\n')}` : ''}
  //     ${targetActionList.NOTE.length > 0 ? `**Notes**\n${targetActionList.NOTE.join('\n')}` : ''}
  //   `;
  //   if (infoString.length === 0) {
  //     infoString = 'Squeaky clean!';
  //   }
  //   // log.debug(F, `infoString: ${infoString}`);
  //   modlogEmbed.setDescription(infoString);
  // }

  return modlogEmbed;
}

export async function tripSitTrollScore(
  targetId: string,
): Promise<{
    trollScore: number;
    tsReasoning: string;
  }> {
  let trollScore = 0;
  let tsReasoning = '';
  const errorUnknown = 'unknown-error';
  // const errorMember = 'unknown-member';
  const errorPermission = 'no-permission';

  const target = await discordClient.users.fetch(targetId);

  // Calculate how like it is that this user is a troll.
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
    trollScore += 0;
    tsReasoning += '+0 | Account was created at least a year ago\n';
  } else if (years === 0 && months > 0) {
    trollScore += 1;
    tsReasoning += '+1 | Account was created months ago\n';
  } else if (months === 0 && weeks > 0) {
    trollScore += 2;
    tsReasoning += '+2 | Account was created weeks ago\n';
  } else if (weeks === 0 && days > 0) {
    trollScore += 3;
    tsReasoning += '+3 | Account was created days ago\n';
  } else if (days === 0 && hours > 0) {
    trollScore += 4;
    tsReasoning += '+4 | Account was created hours ago\n';
  } else if (hours === 0 && minutes > 0) {
    trollScore += 5;
    tsReasoning += '+5 | Account was created minutes ago\n';
  } else if (minutes === 0 && seconds > 0) {
    trollScore += 6;
    tsReasoning += '+6 | Account was created seconds ago\n';
  }

  if (target.avatarURL()) {
    trollScore += 0;
    tsReasoning += '+0 | Account has a profile picture\n';
  } else {
    trollScore += 1;
    tsReasoning += '+1 | Account does not have a profile picture\n';
  }

  if (target.bannerURL() !== null) {
    trollScore += 0;
    tsReasoning += '+0 | Account has a banner\n';
  } else {
    trollScore += 1;
    tsReasoning += '+1 | Account does not have a banner\n';
  }

  // let member = {} as GuildMember;
  // try {
  //   member = await interaction.guild?.members.fetch(target.id) as GuildMember;
  // } catch (err:unknown) {
  //   // if ((err as DiscordAPIError).code === 10007) {
  //   //   // log.debug(F, 'User is not in guild');
  //   // } else {
  //   //   // log.error(F, `Error: ${err}`);
  //   // }
  // }

  // if (member.premiumSince) {
  //   trollScore -= 1;
  //   tsReasoning += '-1 | Account is boosting the guild\n';
  // } else {
  //   trollScore += 0;
  //   tsReasoning += '+0 | Account is not boosting the guild\n';
  // }

  // Check how many guilds the member is in
  await discordClient.guilds.fetch();
  const targetInGuilds = await Promise.all(discordClient.guilds.cache.map(async guild => {
    try {
      await guild.members.fetch(target.id);
      // log.debug(F, `User is in guild: ${guild.name}`);
      return guild;
    } catch (err: unknown) {
      return null;
    }
  }));
  const mutualGuilds = targetInGuilds.filter(item => item !== null);

  if (mutualGuilds.length > 0) {
    trollScore += 0;
    tsReasoning += `+0 | I currently share ${mutualGuilds.length} guilds with them\n`;
  } else {
    trollScore += mutualGuilds.length;
    tsReasoning += `+1 | Account is only in this guild, that i can tell
      `;
  }

  const bannedTest = await Promise.all(discordClient.guilds.cache.map(async guild => {
    const guildPerms = await checkGuildPermissions(guild, [
      'BanMembers' as PermissionResolvable,
    ]);

    if (!guildPerms) {
      return errorPermission;
    }

    try {
      return await guild.bans.fetch(target.id);
      // log.debug(F, `User is banned in guild: ${guild.name}`);
      // return guild.name;
    } catch (err: unknown) {
      if ((err as DiscordAPIError).code === 10026) {
        // log.debug(F, `Ban not found for ${target.user.tag} in ${guild.name}`);
        return 'not-found';
      }
      // return nothing
      return errorUnknown;
    }
  }));

  // count how many 'banned' appear in the array
  const bannedGuilds = bannedTest.filter(
    item => item !== errorPermission
      && item !== 'not-found'
      && item !== errorUnknown,
  ) as GuildBan[];
  // log.debug(F, `Banned Guilds: ${bannedGuilds.join(', ')}`);

  // count how many i didn't have permission to check
  const noPermissionGuilds = bannedTest.filter(item => item === errorPermission);
  const checkedGuildNumber = bannedTest.length - noPermissionGuilds.length;

  if (bannedGuilds.length === 0) {
    trollScore += 0;
    tsReasoning += stripIndents`+0 | Not banned in ${checkedGuildNumber} other guilds that I have permission to check.`;
  } else {
    trollScore += (bannedGuilds.length * 5);
    // eslint-disable-next-line max-len
    tsReasoning += stripIndents`+${(bannedGuilds.length * 5)} | Account is banned in at least ${bannedGuilds.length} of the ${checkedGuildNumber} guilds I can check.
    ${bannedGuilds.map(banData => `**${banData.guild.name}**: ${banData.reason}`).join('\n')}
    `;
  }

  return {
    trollScore,
    tsReasoning,
  };
}

async function messageModThread(
  actor: GuildMember,
  target: string | GuildMember | User,
  command: ModAction,
  internalNote: string,
  description?: string,
  extraMessage?: string,
): Promise<ThreadChannel> {
  let modThread = {} as ThreadChannel;
  const targetId = (target as User | GuildMember).id ?? target;
  const targetName = (target as GuildMember).displayName ?? (target as User).username ?? target;
  const targetData = await db.users.upsert({
    where: {
      discord_id: targetId,
    },
    create: {
      discord_id: targetId,
    },
    update: {
    },
  });
  const guildData = await db.discord_guilds.upsert({
    where: {
      id: actor.guild.id,
    },
    create: {
      id: actor.guild.id,
    },
    update: {
    },
  });

  const guild = await discordClient.guilds.fetch(guildData.id);
  if (targetData.mod_thread_id) {
    log.debug(F, `Mod thread id exists: ${targetData.mod_thread_id}`);
    try {
      modThread = await guild.channels.fetch(targetData.mod_thread_id) as ThreadChannel;
      log.debug(F, 'Mod thread exists');
    } catch (err) {
      modThread = {} as ThreadChannel;
      log.debug(F, 'Mod thread does not exist');
    }
  }

  // log.debug(F, `Mod thread: ${JSON.stringify(modThread, null, 2)}`);

  let newModThread = false;
  if (!modThread.id) {
    // If the mod thread doesn't exist for whatever reason, `maybe it got deleted, make a new one
    // If the user we're banning is a vendor, don't make a new one
    // Create a new thread in the mod channel
    log.debug(F, 'creating mod thread');
    if (guildData.mod_room_id === null) {
      throw new Error('Moderator room id is null');
    }
    const modChan = await discordClient.channels.fetch(guildData.mod_room_id) as TextChannel;
    modThread = await modChan.threads.create({
      name: `${targetName}`,
      autoArchiveDuration: 60,
    });
    // log.debug(F, 'created mod thread');
    // Save the thread id to the user
    targetData.mod_thread_id = modThread.id;
    await db.users.update({
      where: {
        discord_id: targetId,
      },
      data: {
        mod_thread_id: modThread.id,
      },
    });
    log.debug(F, 'saved mod thread id to user');
    newModThread = true;
  }

  const modlogEmbed = await userInfoEmbed(targetId, command);

  const { pastVerb } = embedVariables[command as keyof typeof embedVariables];
  const summary = `${actor.displayName} ${pastVerb} ${targetName}!`;

  if (!guildData.mod_role_id) {
    throw new Error('Moderator role id is null');
  }
  const roleModerator = await guild.roles.fetch(guildData.mod_role_id) as Role;

  await modThread.send({
    content: stripIndents`
    ${summary}
    **Reason:** ${internalNote ?? noReason}
    **Note sent to user:** ${(description !== '' && description !== null) ? description : noMessageSent}
    ${command === 'NOTE' && !newModThread ? '' : roleModerator}
    `,
    embeds: [modlogEmbed],
  });

  if (extraMessage) {
    await modThread.send({ content: extraMessage });
  }

  return modThread;
}

async function messageUser(
  target: User,
  guild: Guild,
  command: ModAction,
  messageToUser: string,
  addButtons?: boolean,
) {
  log.debug(F, `Message user: ${target.username}`);
  const embed = embedTemplate()
    .setColor(embedVariables[command as keyof typeof embedVariables].embedColor)
    .setTitle(embedVariables[command as keyof typeof embedVariables].embedTitle)
    .setDescription(messageToUser);

  let message = {} as Message;
  try {
    if (addButtons) {
      message = await target.send({ embeds: [embed], components: [warnButtons] });
    } else {
      message = await target.send({ embeds: [embed] });
    }
  } catch (error) {
    return;
  }

  if (addButtons) {
    const targetData = await db.users.upsert({
      where: {
        discord_id: target.id,
      },
      create: {
        discord_id: target.id,
      },
      update: {
      },
    });

    const messageFilter = (mi: MessageComponentInteraction) => mi.user.id === target.id;
    const collector = message.createMessageComponentCollector({ filter: messageFilter, time: 0 });

    collector.on('collect', async (mi: MessageComponentInteraction) => {
      if (mi.customId.startsWith('acknowledgeButton')) {
        const targetChan = await discordClient.channels.fetch(targetData.mod_thread_id as string) as TextChannel;
        if (targetChan) {
          await targetChan.send({
            embeds: [embedTemplate()
              .setColor(Colors.Green)
              .setDescription(`${target.username} has acknowledged their warning.`)],
          });
        }
        // remove the components from the message
        await mi.update({ components: [] });
        mi.user.send('Thanks for understanding! We appreciate your cooperation and will consider this in the future!');
      } else if (mi.customId.startsWith('refusalButton')) {
        const targetChan = await discordClient.channels.fetch(targetData.mod_thread_id as string) as TextChannel;
        await targetChan.send({
          embeds: [embedTemplate()
            .setColor(Colors.Red)
            .setDescription(`${target.username} has refused their timeout and was kicked.`)],
        });
        // remove the components from the message
        await mi.update({ components: [] });
        mi.user.send(stripIndents`Thanks for admitting this, you\'ve been removed from the guild.
        You can rejoin if you ever decide to cooperate.`);
        await guild.members.kick(target, 'Refused to acknowledge timeout');
      }
    });
  }
}

async function messageModlog(
  target: string | GuildMember | User,
  command: ModAction,
  internalNote: string,
  description?: string,
) {
  const targetId = (target as User | GuildMember).id ?? target;
  const targetName = (target as GuildMember).displayName ?? (target as User).username ?? target;
  const targetData = await db.users.upsert({
    where: {
      discord_id: targetId,
    },
    create: {
      discord_id: targetId,
    },
    update: {
    },
  });
  const modlogEmbed = await userInfoEmbed(targetId, command);

  const anonSummary = `${targetName} was ${embedVariables[command as keyof typeof embedVariables].pastVerb}!`;

  const modChan = await discordClient.channels.fetch(env.CHANNEL_MODLOG) as TextChannel;
  await modChan.send({
    content: stripIndents`
    ${anonSummary}
    **Reason:** ${internalNote ?? noReason}
    **Note sent to user:** ${(description !== '' && description !== null) ? description : noMessageSent}
    `,
    embeds: [modlogEmbed],
  });
}

export async function acknowledgeButton(
  interaction:ButtonInteraction,
) {
  const targetData = await db.users.upsert({
    where: {
      discord_id: interaction.user.id,
    },
    create: {
      discord_id: interaction.user.id,
    },
    update: {
    },
  });
  const targetChan = await discordClient.channels.fetch(targetData.mod_thread_id as string) as TextChannel;
  if (targetChan) {
    await targetChan.send({
      embeds: [embedTemplate()
        .setColor(Colors.Green)
        .setDescription(`${interaction.user.username} has acknowledged their warning.`)],
    });
  }
  // remove the components from the message
  await interaction.update({ components: [] });
  interaction.user.send('Thanks for understanding! We appreciate your cooperation and will consider this in the future!');
}

export async function refusalButton(
  interaction:ButtonInteraction,
) {
  const targetData = await db.users.upsert({
    where: {
      discord_id: interaction.user.id,
    },
    create: {
      discord_id: interaction.user.id,
    },
    update: {
    },
  });
  const targetChan = await discordClient.channels.fetch(targetData.mod_thread_id as string) as TextChannel;
  if (targetChan) {
    await targetChan.send({
      embeds: [embedTemplate()
        .setColor(Colors.Green)
        .setDescription(`${interaction.user.username} has refused their warning and was kicked.`)],
    });
  }
  // remove the components from the message
  await interaction.update({ components: [] });
  interaction.user.send('Thanks for admitting this, you\'ve been removed from the guild. You can rejoin if you ever decide to cooperate.');
  const guild = await discordClient.guilds.fetch(env.DISCORD_GUILD_ID);
  await guild.members.kick(interaction.user, 'Refused to acknowledge warning');
}

export async function moderate(
  buttonInt: ButtonInteraction,
  modalInt: ModalSubmitInteraction,
): Promise<InteractionReplyOptions> {
  if (!buttonInt.guild) return { content: 'This command can only be used in a guild!' };
  const actor = buttonInt.member as GuildMember;

  const customIdParts: string[] = buttonInt.customId.split('~');
  const [, command] = customIdParts as [string, ModAction];

  const modEmbedObj = buttonInt.message.embeds[0].toJSON();

  const targetField = (modEmbedObj.fields as APIEmbedField[]).find(field => field.name === 'Member') as APIEmbedField;
  const targetId = targetField.value.slice(2, -1);
  let targetMember = null as null | GuildMember;
  try {
    targetMember = await actor.guild.members.fetch(targetId);
  } catch (err) {
    // Ignore
  }
  let targetUser = null as null | User;
  try {
    targetUser = await discordClient.users.fetch(targetId);
  } catch (err) {
    // Ignore
  }
  let targetName = targetId;
  let targetObj = targetId as string | User | GuildMember;
  if (targetMember) {
    targetName = targetMember.displayName;
    targetObj = targetMember;
  }
  if (targetUser) {
    targetName = targetUser.username;
    targetObj = targetUser;
  }

  // Flags come from the AI mod report
  const flagsField = (modEmbedObj.fields as APIEmbedField[]).find(field => field.name === 'Flags');
  const messageField = (modEmbedObj.fields as APIEmbedField[]).find(field => field.name === 'Message');
  const urlField = (modEmbedObj.fields as APIEmbedField[]).find(field => field.name === 'Channel');

  const description = modalInt.fields.getTextInputValue('description');
  let internalNote = modalInt.fields.getTextInputValue('internalNote');

  // Check if this is a vendor ban
  const vendorBan = internalNote?.toLowerCase().includes('vendor') && isFullBan(command);

  // Don't allow people to mention MEP
  if (internalNote?.includes('MEP') || description?.includes('MEP')) {
    return {
      content: mepWarning,
    };
  }

  // If the modEmbed contains a message field, add it to the internal note
  if (messageField && urlField) {
    internalNote = stripIndents`
    ${internalNote}

    **The offending message**
    > ${messageField.value}
    ${urlField.value}
  `;
  }

  // Process duration time for ban and timeouts
  let duration = 0 as null | number;
  let durationStr = '';
  if (isTimeout(command)) {
    let durationVal = modalInt.fields.getTextInputValue('duration');
    if (durationVal === '') durationVal = '7 days';
    if (durationVal.length === 1) {
      // If the input is a single number, assume it's days
      const numberInput = parseInt(durationVal, 10);
      if (Number.isNaN(numberInput)) {
        return { content: 'Timeout must be a number!' };
      }
      if (numberInput < 0 || numberInput > 7) {
        return { content: 'Timeout must be between 0 and 7 days!' };
      }
      durationVal = `${duration} days`;

      durationStr = ` for ${ms(numberInput, { long: true })}`;
    }

    duration = await parseDuration(durationVal);
    if (duration && (duration < 0 || duration > 7 * 24 * 60 * 60 * 1000)) {
      return { content: 'Timeout must be between 0 and 7 days!!' };
    }
  }
  if (isFullBan(command)) {
    // If the command is ban, then the input value exists, so pull that and try to parse it as an int
    let dayInput = parseInt(modalInt.fields.getTextInputValue('days'), 10);

    // If no input was provided, default to 0 days
    if (Number.isNaN(dayInput)) dayInput = 0;

    // If the input is a string, or outside the bounds, tell the user and return
    if (dayInput && (dayInput < 0 || dayInput > 7)) {
      return { content: 'Ban days must be at least 0 and at most 7!' };
    }

    // Get the millisecond value of the input
    duration = await parseDuration(`${dayInput} days`);
  }

  // Display all properties we're going to use
  log.info(F, `
  actor: ${actor}
  command: ${command}
  targetId: ${targetId}
  internalNote: ${internalNote}
  description: ${description}
  duration: ${duration}
  durationStr: ${durationStr}
  `);

  // Get the actor and target data from the db
  const actorData = await db.users.upsert({
    where: {
      discord_id: actor.id,
    },
    create: {
      discord_id: actor.id,
    },
    update: {},
  });
  const targetData = await db.users.upsert({
    where: {
      discord_id: targetId,
    },
    create: {
      discord_id: targetId,
    },
    update: {},
  });

  // log.debug(F, `TargetData: ${JSON.stringify(targetData, null, 2)}`);
  // If this is a Warn, ban, timeout or kick, send a message to the user
  // Do this first cuz you can't do this if they're not in the guild
  if (sendsMessageToUser(command)
    && !vendorBan
    && (description !== '' && description !== null)
    && targetUser) {
    const embed = embedTemplate()
      .setColor(embedVariables[command as keyof typeof embedVariables].embedColor)
      .setTitle(embedVariables[command as keyof typeof embedVariables].embedTitle);

    let body = stripIndents`
      Hey ${targetUser}, I'm sorry to inform that you've been ${embedVariables[command as keyof typeof embedVariables].pastVerb}${durationStr} by Team TripSit:

      ${description}

      **Do not message a moderator to talk about this!**
    `;

    const appealString = '\n\nYou can send an email to appeals@tripsit.me to appeal this ban! Evasion bans are permanent, and underban bans are permanent until you turn 18.'; // eslint-disable-line max-len
    const evasionString = '\n\nEvasion bans are permanent, you can appeal the ban on your main account by sending an email, but evading will extend the ban'; // eslint-disable-line max-len
    const channel = await discordClient.channels.fetch(env.CHANNEL_HELPDESK);
    const discussString = `\n\nYou can discuss this with the mods in ${channel}. Do not argue the rules in public channels!`; // eslint-disable-line max-len
    const timeoutDiscussString = `\n\nYou can discuss this with the mods in ${channel}. Do not argue the rules in public channels!`; // eslint-disable-line max-len

    if (isBan(command)) {
      body = stripIndents`${body}\n\n${appealString}`;
      if (isBanEvasion(command)) {
        body = stripIndents`${body}\n\n${evasionString}`;
      }
      if (isFullBan(command)) {
        const response = await last(
          targetUser,
          buttonInt.guild as Guild,
        );
        const extraMessage = `${targetUser.username}'s last ${response.messageCount} (out of ${response.totalMessages}) messages before being banned :\n${response.messageList}`; // eslint-disable-line max-len
        body = stripIndents`${body}\n\n${extraMessage}`;
      }
    }

    if (isDiscussable(command)) {
      body = stripIndents`${body}\n\n${discussString}`;
    }

    if (isTimeout(command)) {
      body = stripIndents`${body}\n\n${timeoutDiscussString}`;
    }

    if (isRepeatable(command)) {
      body = stripIndents`${body}\n\nPlease review the rules so this doesn't happen again!\nhttps:// wiki.tripsit.me/wiki/Terms_of_Service`;
    }

    if (isKick(command)) {
      body = stripIndents`${body}\n\nIf you feel you can follow the rules you can rejoin here: https://discord.gg/tripsit`;
    }

    embed.setDescription(body);

    await targetUser.send({ embeds: [embed] });
  }

  let actionData = {
    user_id: targetData.id,
    type: command.includes('UN-') ? command.slice(3) : command,
    ban_evasion_related_user: null as string | null,
    description,
    internal_note: internalNote,
    expires_at: null as Date | null,
    repealed_by: null as string | null,
    repealed_at: null as Date | null,
    created_by: actorData.id,
    created_at: new Date(),
  } as user_actions;

  const userData = {} as users;
  let extraMessage = '';
  if (isBan(command)) {
    if (isFullBan(command) || isUnderban(command) || isBanEvasion(command)) {
      userData.removed_at = new Date();
      const deleteMessageValue = duration ?? 0;
      try {
        if (deleteMessageValue > 0 && targetMember) {
        // log.debug(F, `I am deleting ${deleteMessageValue} days of messages!`);
          const response = await last(targetMember.user, buttonInt.guild);
          extraMessage = `${targetName}'s last ${response.messageCount} (out of ${response.totalMessages}) messages before being banned :\n${response.messageList}`;
        }
        log.debug(F, `Days to delete: ${deleteMessageValue}`);
      } catch (err) {
        log.error(F, `Error: ${err}`);
      }
      log.info(F, `target: ${targetId} | deleteMessageValue: ${deleteMessageValue} | internalNote: ${internalNote ?? noReason}`);

      try {
        targetObj = await buttonInt.guild.bans.create(targetId, { deleteMessageSeconds: deleteMessageValue / 1000, reason: internalNote ?? noReason });
      } catch (err) {
        log.error(F, `Error: ${err}`);
      }
    } else if (isTicketBan(command)) {
      userData.ticket_ban = true;
    } else if (isDiscordBotBan(command)) {
      userData.discord_bot_ban = true;
    } else if (isHelperBan(command)) {
      userData.helper_role_ban = true;
    } else if (isContributorBan(command)) {
      userData.contributor_role_ban = true;
    }
  } else if (isUnBan(command)) {
    if (isUnFullBan(command) || isUnUnderban(command) || isUnBanEvasion(command)) {
      userData.removed_at = null;
      try {
        await buttonInt.guild.bans.fetch();
        await buttonInt.guild.bans.remove(targetId, internalNote ?? noReason);
      } catch (err) {
        log.error(F, `Error: ${err}`);
      }
    } else if (isUnTicketBan(command)) {
      userData.ticket_ban = false;
    } else if (isUnDiscordBotBan(command)) {
      userData.discord_bot_ban = false;
    } else if (isUnHelperBan(command)) {
      userData.helper_role_ban = false;
    } else if (isUnContributorBan(command)) {
      userData.contributor_role_ban = false;
    }

    const record = await db.user_actions.findFirst({
      where: {
        user_id: targetData.id,
        repealed_at: null,
        type: (command.includes('UN-') ? command.slice(3) : command) as user_action_type,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    if (record) {
      actionData = record;
    } else {
      log.error(F, 'There is no record of this ban, but i will try to do it anyway');
    }
    actionData.repealed_at = new Date();
    actionData.repealed_by = actorData.id;
  }

  if (isTimeout(command)) {
    if (targetMember) {
      actionData.expires_at = new Date(Date.now() + (duration as number));
      try {
        await targetMember.timeout(duration, internalNote ?? noReason);
      } catch (err) {
        log.error(F, `Error: ${err}`);
      }
    } else {
      return { content: 'User is not in the guild!' };
    }
  } else if (isUnTimeout(command)) {
    if (targetMember) {
      const record = await db.user_actions.findMany({
        where: {
          user_id: targetData.id,
          repealed_at: null,
          type: 'TIMEOUT',
        },
        orderBy: {
          created_at: 'desc',
        },
      });

      if (record.length > 0) {
        [actionData] = record;
      }

      actionData.repealed_at = new Date();
      actionData.repealed_by = actorData.id;

      try {
        await targetMember.timeout(0, internalNote ?? noReason);
        // log.debug(F, `I untimeouted ${target.displayName} because\n '${internalNote}'!`);
      } catch (err) {
        log.error(F, `Error: ${err}`);
      }
    } else {
      return { content: 'User is not in the guild!' };
    }
  } else if (isKick(command)) {
    if (targetMember) {
      actionData.type = 'KICK' as user_action_type;
      try {
        await targetMember.kick();
      } catch (err) {
        log.error(F, `Error: ${err}`);
      }
    } else {
      return { content: 'User is not in the guild!' };
    }
  }

  // This needs to happen before creating the modlog embed
  // await useractionsSet(actionData);
  if (actionData.id) {
    await db.user_actions.upsert({
      where: {
        id: actionData.id,
      },
      create: actionData,
      update: actionData,
    });
  } else {
    await db.user_actions.create({
      data: actionData,
    });
  }

  const tripsitGuild = await discordClient.guilds.fetch(env.DISCORD_GUILD_ID);
  const roleModerator = await tripsitGuild.roles.fetch(env.ROLE_MODERATOR) as Role;
  // const modPing = `Hey ${roleModerator}`;

  const summary = `${actor.displayName} ${embedVariables[command as keyof typeof embedVariables].pastVerb} ${targetName}${durationStr}!`;
  const anonSummary = `${targetName} was ${embedVariables[command as keyof typeof embedVariables].pastVerb}${durationStr}!`;

  let modThread = {} as ThreadChannel;
  let newModThread = false;
  if (!vendorBan) {
    modThread = await messageModThread(
      actor,
      targetObj,
      command,
      internalNote,
      description,
      extraMessage,
    );
    newModThread = true;
  }

  await messageModlog(
    targetObj,
    command,
    internalNote,
    description,
  );

  // Return a message to the user who started this, confirming the user was acted on
  // log.debug(F, `${target.displayName} has been ${embedVariables[command as keyof typeof embedVariables].verb}!`);

  // log.info(F, `response: ${JSON.stringify(desc, null, 2)}`);
  // Take the existing description from response and add to it:'

  const desc = stripIndents`
    ${anonSummary}
    **Reason:** ${internalNote ?? noReason}
     ${(description !== '' && description !== null && !vendorBan && targetMember) ? `\n\n**Note sent to user: ${description}**` : ''}
  `;

  const response = embedTemplate()
    .setAuthor(null)
    .setColor(Colors.Yellow)
    .setDescription(desc)
    .setFooter(null);

  if (command !== 'REPORT') response.setDescription(`${response.data.description}\nYou can access their thread here: ${modThread}`);
  return { embeds: [response] };
}

export async function modModal(
  interaction: ButtonInteraction,
): Promise<void> {
  const [, command] = interaction.customId.split('~');

  let modalInternal = '';
  let modalDescription = '';
  const embed = interaction.message.embeds[0].toJSON();
  const flagsField = (embed.fields as APIEmbedField[]).find(field => field.name === 'Flags');
  if (flagsField) {
    if (command === 'NOTE') {
      modalInternal = `This user's message was flagged by the AI for ${flagsField.value}`;
    }
    if (command === 'FULL_BAN') {
      const messageField = (embed.fields as APIEmbedField[]).find(field => field.name === 'Message') as APIEmbedField;
      const urlField = (embed.fields as APIEmbedField[]).find(field => field.name === 'Channel') as APIEmbedField;
      modalInternal = `This user breaks TripSit's policies regarding ${flagsField.value} topics.`;
      modalDescription = stripIndents`
        Your recent messages have broken TripSit's policies regarding ${flagsField.value} topics.
        
        The offending message
        > ${messageField.value}
        ${urlField.value}`;
    }
  }

  let verb = '';
  if (command === 'NOTE') verb = 'noting';
  // else if (command === 'REPORT') verb = 'reporting';
  else if (command === 'INFO') verb = 'getting info on';
  else if (command === 'WARNING') verb = 'warning';
  else if (command === 'KICK') verb = 'kicking';
  else if (command === 'TIMEOUT') verb = 'timing out';
  else if (command === 'FULL_BAN') verb = 'banning';
  else if (command === 'TICKET_BAN') verb = 'ticket banning';
  else if (command === 'DISCORD_BOT_BAN') verb = 'discord bot banning';
  else if (command === 'BAN_EVASION') verb = 'evasion banning';
  else if (command === 'UNDERBAN') verb = 'underbanning';
  else if (command === 'CONTRIBUTOR_BAN') verb = 'banning from Contributor on';
  else if (command === 'HELPER_BAN') verb = 'banning from Helper on';
  else if (command === 'UN-HELPER_BAN') verb = 'allowing Helper on ';
  else if (command === 'UN-CONTRIBUTOR_BAN') verb = 'allowing Contributor on ';
  else if (command === 'UN-TIMEOUT') verb = 'removing timeout on';
  else if (command === 'UN-FULL_BAN') verb = 'removing ban on';
  else if (command === 'UN-TICKET_BAN') verb = 'removing ticket ban on';
  else if (command === 'UN-DISCORD_BOT_BAN') verb = 'removing bot ban on';
  else if (command === 'UN-BAN_EVASION') verb = 'removing ban evasion on';
  else if (command === 'UN-UNDERBAN') verb = 'removing underban on';

  // log.debug(F, `Verb: ${verb}`);

  const modal = new ModalBuilder()
    .setCustomId(`modModal~${command}~${interaction.id}`)
    .setTitle(`Tripbot ${command}`)
    .addComponents(new ActionRowBuilder<TextInputBuilder>()
      .addComponents(new TextInputBuilder()
        .setLabel(`Why are you ${verb} this user?`)
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Tell other moderators why you\'re doing this')
        .setValue(modalInternal)
        .setMaxLength(1000)
        .setRequired(true)
        .setCustomId('internalNote')));

  // All commands except INFO, NOTE and REPORT can have a public reason sent to the user
  if (!'INFO NOTE REPORT'.includes(command)) {
    modal.addComponents(new ActionRowBuilder<TextInputBuilder>()
      .addComponents(new TextInputBuilder()
        .setLabel('What should we tell the user?')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Tell the user why you\'re doing this')
        .setValue(modalDescription)
        .setMaxLength(1000)
        .setRequired(command === 'WARNING')
        .setCustomId('description')));
  }
  // Only timeout and full ban can have a duration, but they're different, so separate.
  if (command === 'TIMEOUT') {
    modal.addComponents(new ActionRowBuilder<TextInputBuilder>()
      .addComponents(new TextInputBuilder()
        .setLabel('Timeout for how long?')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('4 days 3hrs 2 mins 30 seconds (Max 7 days, Default 7 days)')
        .setRequired(false)
        .setCustomId('duration')));
  }
  if (command === 'FULL_BAN') {
    modal.addComponents(new ActionRowBuilder<TextInputBuilder>()
      .addComponents(new TextInputBuilder()
        .setLabel('How many days of msg to remove?')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('4 days 3hrs 2 mins 30 seconds (Max 7 days, Default 0 days)')
        .setRequired(false)
        .setCustomId('days')));
  }

  await interaction.showModal(modal);

  const filter = (i: ModalSubmitInteraction) => i.customId.startsWith('modModal');
  interaction.awaitModalSubmit({ filter, time: 0 })
    .then(async i => {
      if (i.customId.split('~')[2] !== interaction.id) return;
      await i.deferReply({ ephemeral: true });
      const internalNote = i.fields.getTextInputValue('internalNote'); // eslint-disable-line

      // Only these commands actually have the description input, so only pull it if it exists
      const description = 'WARNING, KICK, TIMEOUT, FULL_BAN'.includes(command)  // eslint-disable-line
        ? i.fields.getTextInputValue('description')
        : null;

      let duration = null;
      if ('FULL_BAN, BAN_EVASION, UNDERBAN'.includes(command)) {
        // If the command is ban, then the input value exists, so pull that and try to parse it as an int
        let dayInput = parseInt(i.fields.getTextInputValue('days'), 10);

        // If no input was provided, default to 0 days
        if (Number.isNaN(dayInput)) dayInput = 0;

        // If the input is a string, or outside the bounds, tell the user and return
        if (dayInput && (dayInput < 0 || dayInput > 7)) {
          await i.editReply({ content: 'Ban days must be at least 0 and at most 7!' });
          return;
        }

        // Get the millisecond value of the input
        const days = await parseDuration(`${dayInput} days`);
        // log.debug(F, `days: ${days}`);
        duration = days;
      }

      if (command === 'TIMEOUT') {
        // If the command is timeout get the value
        let timeoutInput = i.fields.getTextInputValue('duration');

        // If the value is blank, set it to 7 days, the maximum
        if (timeoutInput === '') timeoutInput = '7 days';

        if (timeoutInput.length === 1) {
          // If the input is a single number, assume it's days
          const numberInput = parseInt(timeoutInput, 10);
          if (Number.isNaN(numberInput)) {
            await i.editReply({ content: 'Timeout must be a number!' });
            return;
          }
          if (numberInput < 0 || numberInput > 7) {
            await i.editReply({ content: 'Timeout must be between 0 and 7 days' });
            return;
          }
          timeoutInput = `${timeoutInput} days`;
        }

        // log.debug(F, `timeoutInput: ${timeoutInput}`);

        const timeout = timeoutInput !== null
          ? await parseDuration(timeoutInput)
          : null;

        // If timeout is not null, but is outside the bounds, tell the user and return
        if (timeout && (timeout < 0 || timeout > 7 * 24 * 60 * 60 * 1000)) {
          await i.editReply({ content: 'Timeout must be between 0 and 7 days' });
          return;
        }

        // log.debug(F, `timeout: ${timeout}`);
        duration = timeout;
      }

      await i.editReply(await moderate(interaction, i));
    });
}

export async function modEmbed(
  interaction: ChatInputCommandInteraction | MessageContextMenuCommandInteraction | UserContextMenuCommandInteraction,
): Promise<void> {
  let targetString = '';
  let targets = [] as GuildMember[];

  if (interaction.isChatInputCommand()) {
    targetString = interaction.options.getString('target', true);
    targets = await getDiscordMember(interaction, targetString);
  }

  if (interaction.isUserContextMenuCommand() || interaction.isMessageContextMenuCommand()) {
    targetString = interaction.targetId;
    targets = await getDiscordMember(interaction, targetString);
  }

  if (targets.length > 1) {
    await interaction.reply({
      embeds: [embedTemplate()
        .setColor(Colors.Red)
        .setTitle(`${targetString}" returned ${targets.length} results!`)
        .setDescription(stripIndents`
          Be more specific:
          > **Mention:** @Moonbear
          > **Tag:** moonbear#1234
          > **ID:** 9876581237
          > **Nickname:** MoonBear`)],
      ephemeral: true,
    });
    return;
  }

  if (targets.length === 0) {
    // If we didn't find a member, the likely left the guild already
    // If so, we can only ban or note them
    // We can only do that if the discordID was provided

    const embed = embedTemplate()
      .setColor(Colors.Red)
      .setTitle(`${targetString}" returned no results!`)
      .setDescription(stripIndents`
    Be more specific:
    > **Mention:** @Moonbear
    > **Tag:** moonbear#1234
    > **ID:** 9876581237
    > **Nickname:** MoonBear`);

    if ((targetString.startsWith('<@') && targetString.endsWith('>'))
      || targetString.match(/^\d+$/)) { // TODO maybe check that @ mentions are handled correctly
      const userId = targetString.match(/^\d+$/) ? targetString : targetString.replace(/[<@!>]/g, '');

      const userActions = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`moderate~note~${userId}`)
          .setLabel('Note')
          .setEmoji('🗒️')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(`moderate~ban~${userId}`)
          .setLabel('Ban')
          .setEmoji('🔨')
          .setStyle(ButtonStyle.Danger),
      );

      embed.setDescription(stripIndents`
      User ID '${userId}' is not in the guild, but I can still Note or Ban them!`);

      await interaction.reply({
        embeds: [embed],
        components: [userActions],
        ephemeral: true,
      });
      return;
    }

    await interaction.reply({
      embeds: [embedTemplate()
        .setColor(Colors.Red)
        .setTitle(`${targetString}" returned no results!`)
        .setDescription(stripIndents`
          Be more specific:
          > **Mention:** @Moonbear
          > **Tag:** moonbear#1234
          > **ID:** 9876581237
          > **Nickname:** MoonBear
          
          If you want to ban a user who is not on the guild you must provide their ID!
          `)],
      ephemeral: true,
    });
    return;
  }

  const trollScore = await tripSitTrollScore(targets[0].user.id);

  const modlogEmbed = await userInfoEmbed(targets[0].user.id, 'INFO' as ModAction);

  modlogEmbed.setDescription(`**TripSit TrollScore: ${trollScore.trollScore}**\n\`\`\`${trollScore.tsReasoning}\`\`\`
  ${modlogEmbed.data.description}`);

  await interaction.reply({
    embeds: [modlogEmbed],
    ephemeral: true,
    components: [modButtons(targets[0].id)],
  });
}

export const mod: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('mod')
    .setDescription('Moderation actions!')
    .addSubcommand(subcommand => subcommand
      .setDescription('Act on a user.')
      .addStringOption(option => option
        .setName('target')
        .setDescription('User to warn!')
        .setRequired(true))
      .setName('user'))
    .addSubcommand(subcommand => subcommand
      .setDescription('Link one user to another.')
      .addStringOption(option => option
        .setName('target')
        .setDescription('User to link!')
        .setRequired(true))
      .addBooleanOption(option => option
        .setName('override')
        .setDescription('Override existing threads in the DB.'))
      .setName('link')),
  async execute(interaction: ChatInputCommandInteraction) {
    log.info(F, await commandContext(interaction));
    const command = interaction.options.getSubcommand();

    if (!interaction.guild) {
      await interaction.reply({
        embeds: [embedTemplate()
          .setColor(Colors.Red)
          .setTitle('This command can only be used in a server!')],
        ephemeral: true,
      });
      return false;
    }

    // Check if the guild is a partner (or the home guild)
    const guildData = await db.discord_guilds.upsert({
      where: {
        id: interaction.guild.id,
      },
      create: {
        id: interaction.guild.id,
      },
      update: {
      },
    });

    if (interaction.guild.id !== env.DISCORD_GUILD_ID
      && !guildData.cooperative) {
      await interaction.reply({
        embeds: [
          embedTemplate()
            .setDescription(cooperativeExplanation)
            .setColor(Colors.Red),
        ],
        ephemeral: true,
      });
      return false;
    }

    if (command === 'link') {
      const targetString = interaction.options.getString('target', true);
      const targets = await getDiscordMember(interaction, targetString) as GuildMember[];
      const override = interaction.options.getBoolean('override');
      if (targets.length > 1) {
        const embed = embedTemplate()
          .setColor(Colors.Red)
          .setTitle('Found more than one user with with that value!')
          .setDescription(stripIndents`
          "${targetString}" returned ${targets.length} results!
  
          Be more specific:
          > **Mention:** @Moonbear
          > **Tag:** moonbear#1234
          > **ID:** 9876581237
          > **Nickname:** MoonBear`);
        await interaction.reply({
          embeds: [embed],
          ephemeral: true,
        });
        return false;
      }
      if (targets.length === 0) {
        const embed = embedTemplate()
          .setColor(Colors.Red)
          .setTitle(`${targetString}" returned no results!`)
          .setDescription(stripIndents`
      Be more specific:
      > **Mention:** @Moonbear
      > **Tag:** moonbear#1234
      > **ID:** 9876581237
      > **Nickname:** MoonBear`);
        await interaction.reply({
          embeds: [embed],
          ephemeral: true,
        });
        return false;
      }

      const target = targets[0];

      let result: string | null;
      if (!target) {
        const userData = await db.users.upsert({
          where: {
            discord_id: targetString,
          },
          create: {
            discord_id: targetString,
          },
          update: {
          },
        });

        if (!userData) {
          await interaction.reply({
            content: stripIndents`Failed to link thread, I could not find this user in the guild, \
    and they do not exist in the database!`,
            ephemeral: true,
          });
          return false;
        }
        result = await linkThread(targetString, interaction.channelId, override);
      } else {
        result = await linkThread(target.id, interaction.channelId, override);
      }

      if (result === null) {
        await interaction.editReply({ content: 'Successfully linked thread!' });
      } else {
        const existingThread = await interaction.client.channels.fetch(result);
        await interaction.reply({
          content: stripIndents`Failed to link thread, this user has an existing thread: ${existingThread}
          Use the override parameter if you're sure!`,
          ephemeral: true,
        });
      }
    }

    await modEmbed(interaction);

    return true;
  },
};

export default mod;
