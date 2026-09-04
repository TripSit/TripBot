import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
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
  EmbedBuilder,
  ThreadChannel,
  MessageComponentInteraction,
  Message,
  Guild,
  DiscordAPIError,
  UserContextMenuCommandInteraction,
  MessageContextMenuCommandInteraction,
  PermissionResolvable,
  GuildBan,
  ButtonInteraction,
  APIEmbedField,
} from 'discord.js';
import {
  ButtonStyle,
  TextInputStyle,
} from 'discord-api-types/v10';
import { stripIndents } from 'common-tags';
import { user_action_type, user_actions, users } from '@db/tripbot';
import { SlashCommand } from '../../../discord/@types/commandDef';
import { parseDuration } from '../../utils/parseDuration';
import commandContext from '../../../discord/utils/context'; // eslint-disable-line
import { getDiscordMember, getDiscordUser } from '../../../discord/utils/guildMemberLookup';
import { last } from '../g.last';
import { botBannedUsers } from '../../../discord/utils/populateBotBans';
import { embedTemplate } from '../../../discord/utils/embedTemplate';
import { checkGuildPermissions } from '../../../discord/utils/checkPermissions';

const F = f(__filename);

type ModAction = 'INFO' | 'BAN' | 'WARNING' | 'REPORT' | 'NOTE' | 'TIMEOUT' | 'UN-CONTRIBUTOR_BAN' | 'UN-HELPER_BAN' |
'FULL_BAN' | 'TICKET_BAN' | 'DISCORD_BOT_BAN' | 'BAN_EVASION' | 'UNDERBAN' | 'HELPER_BAN' | 'CONTRIBUTOR_BAN' | 'LINK' |
'UN-FULL_BAN' | 'UN-TICKET_BAN' | 'UN-DISCORD_BOT_BAN' | 'UN-BAN_EVASION' | 'UN-UNDERBAN' | 'UN-TIMEOUT' | 'KICK';

type BanAction = 'FULL_BAN' | 'TICKET_BAN' | 'DISCORD_BOT_BAN' | 'BAN_EVASION' | 'UNDERBAN';
type UnBanAction = 'UN-FULL_BAN' | 'UN-TICKET_BAN' | 'UN-DISCORD_BOT_BAN' | 'UN-BAN_EVASION' | 'UN-UNDERBAN';
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

/* TODO:
Add unban messages

replace all .env stuff

Motion to <action> users with votes
*/

const noReason = 'No reason provided';
const internalNotePlaceholder = 'Tell other moderators why you\'re doing this';
const descriptionLabel = 'What should we tell the user?';
const descriptionPlaceholder = 'Tell the user why you\'re doing this';
const mepWarning = 'You cannot use the word "MEP" here.';
const cooperativeExplanation = stripIndents`This is a suite of moderation tools for guilds to use, \
this includes the ability to ban, warn, report, and more!

Currently these tools are only available to a limited number of partner guilds, \
use /cooperative info for more information.`;
const noUserError = 'Could not find that member/user!';

export async function linkThread(
  discordId: string,
  threadId: string,
  override: boolean | null,
):Promise<string | null> {
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
  target:GuildMember | User,
  targetData:users,
  command?: ModAction,
):Promise<EmbedBuilder> {
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
  // Populate targetActionList from the db

  // const targetActionListRaw = await database.actions.get(targetData.id);
  const targetActionListRaw = await db.user_actions.findMany({
    where: {
      user_id: targetData.id,
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

  // log.debug(F, `targetActionList: ${JSON.stringify(targetActionList, null, 2)}`);
  const displayName = (target as GuildMember).displayName ?? (target as User).username;
  const tag = (target as GuildMember).user ? (target as GuildMember).user.tag : (target as User).tag;
  const userAvatar = (target as GuildMember).user
    ? (target as GuildMember).user.displayAvatarURL()
    : (target as User).displayAvatarURL();
  const modlogEmbed = new EmbedBuilder()
    .setFooter(null)
    .setAuthor({ name: displayName })
    .setThumbnail(userAvatar)
    .setColor(embedVariables[command as keyof typeof embedVariables].embedColor)
    .addFields(
      { name: tag, value: `${target.id}`, inline: true },
      {
        name: 'Created',
        value: `${time(((target as GuildMember).user
        ?? (target as User)).createdAt, 'R')}`,
        inline: true,
      },
      {
        name: 'Joined',
        value: `${(target as GuildMember).joinedAt
          ? time((target as GuildMember).joinedAt as Date, 'R')
          : 'Unknown'}`,
        inline: true,
      },
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
  // log.debug(F, `infoString: ${infoString}`);
  modlogEmbed.setDescription(infoString);

  return modlogEmbed;
}

export async function tripSitTrollScore(
  target:User,
):Promise<{
    trollScore: number;
    tsReasoning: string;
  }> {
  let trollScore = 0;
  let tsReasoning = '';
  const errorUnknown = 'unknown-error';
  // const errorMember = 'unknown-member';
  const errorPermission = 'no-permission';

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
    } catch (err:unknown) {
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
    } catch (err:unknown) {
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
  target: User,
  command: ModAction,
  internalNote: string,
  description?: string,
  extraMessage?: string,
):Promise<ThreadChannel> {
  let modThread = {} as ThreadChannel;

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
    // If the mod thread doesn't exist for whatever reason, maybe it got deleted, make a new one
    // If the user we're banning is a vendor, don't make a new one
    // Create a new thread in the mod channel
    log.debug(F, 'creating mod thread');
    if (guildData.channel_moderators === null) {
      throw new Error('Moderator room id is null');
    }
    const modChan = await discordClient.channels.fetch(guildData.channel_moderators) as TextChannel;
    modThread = await modChan.threads.create({
      name: `${target.username}`,
      autoArchiveDuration: 60,
    });
    // log.debug(F, 'created mod thread');
    // Save the thread id to the user
    targetData.mod_thread_id = modThread.id;
    await db.users.update({
      where: {
        discord_id: target.id,
      },
      data: {
        mod_thread_id: modThread.id,
      },
    });
    log.debug(F, 'saved mod thread id to user');
    newModThread = true;
  }

  const modlogEmbed = await userInfoEmbed(target, targetData, command);

  const { pastVerb } = embedVariables[command as keyof typeof embedVariables];
  const summary = `${actor.displayName} ${pastVerb} ${target.username}!`;

  if (!guildData.role_moderator) {
    throw new Error('Moderator role id is null');
  }
  const roleModerator = await guild.roles.fetch(guildData.role_moderator) as Role;

  await modThread.send({
    content: stripIndents`
    ${summary}
    **Reason:** ${internalNote ?? noReason}
    **Note sent to user:** ${(description !== '' && description !== null) ? description : '*No message sent to user*'}
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
  target: User,
  command: ModAction,
  internalNote: string,
  description?: string,
) {
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
  const modlogEmbed = await userInfoEmbed(target, targetData, command);

  const anonSummary = `${target.username} was ${embedVariables[command as keyof typeof embedVariables].pastVerb}!`;

  const modChan = await discordClient.channels.fetch(env.CHANNEL_MODLOG) as TextChannel;
  await modChan.send({
    content: stripIndents`
    ${anonSummary}
    **Reason:** ${internalNote ?? noReason}
    **Note sent to user:** ${(description !== '' && description !== null) ? description : '*No message sent to user*'}
    `,
    embeds: [modlogEmbed],
  });
}

export async function ban(
  interaction: ChatInputCommandInteraction | UserContextMenuCommandInteraction | ButtonInteraction,
  targetString: string,
) {
  if (!interaction.guild) return;
  let command = '' as BanAction | UnBanAction;
  let modalDescription = descriptionPlaceholder;
  let modalInternal = internalNotePlaceholder;
  if (interaction.isChatInputCommand()) {
    command = interaction.options.getString('toggle') === 'ON'
      ? interaction.options.getString('type', true) as BanAction
      : `UN-${interaction.options.getString('type', true) as ModAction}` as UnBanAction;
  } else if (interaction.isContextMenuCommand()) {
    command = 'FULL_BAN';
  } else if (interaction.isButton()) {
    command = 'FULL_BAN';
    const embed = interaction.message.embeds[0].toJSON();
    const flagsField = (embed.fields as APIEmbedField[]).find(field => field.name === 'Flags');
    const messageField = (embed.fields as APIEmbedField[]).find(field => field.name === 'Message') as APIEmbedField;
    const urlField = (embed.fields as APIEmbedField[]).find(field => field.name === 'Channel') as APIEmbedField;
    if (flagsField) {
      modalInternal = `This user breaks TripSit's policies regarding ${flagsField.value} topics.`;
      modalDescription = stripIndents`
      Your recent messages have broken TripSit's policies regarding ${flagsField.value} topics.
      
      The offending message
      > ${messageField.value}
      ${urlField.value}`;
    }
  }

  let target: GuildMember | User;
  const [targetMember] = await getDiscordMember(interaction, targetString) as GuildMember[];

  const actor = interaction.member as GuildMember;
  if (targetMember) {
    target = targetMember;
  } else {
    // Look up the user and use that as the target
    const discordUserData = await getDiscordUser(targetString);
    if (!discordUserData) {
      const embed = embedTemplate()
        .setColor(Colors.Red)
        .setTitle(noUserError)
        .setDescription(stripIndents`
          "${targetString}" returned no results!

          Try again with:
          > **Mention:** @Moonbear
          > **Tag:** moonbear#1234
          > **ID:** 9876581237
          > **Nickname:** MoonBear
        `);
      await interaction.reply({
        embeds: [embed],
        ephemeral: true,
      });
      return;
    }
    target = discordUserData;
  }
  log.debug(F, `${actor} ran ${command} on ${target} in ${actor.guild.name}`);

  const modal = new ModalBuilder()
    .setCustomId(`modModal~${command}~${interaction.id}`)
    .setTitle(`Tripbot ${command}`)
    .addComponents(new ActionRowBuilder<TextInputBuilder>()
      .addComponents(new TextInputBuilder()
        .setLabel(`Why are you ${embedVariables[command as keyof typeof embedVariables].presentVerb} this user?`)
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder(internalNotePlaceholder)
        .setValue(modalInternal)
        .setRequired(true)
        .setCustomId('internalNote')));

  modal.addComponents(new ActionRowBuilder<TextInputBuilder>()
    .addComponents(new TextInputBuilder()
      .setLabel(descriptionLabel)
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder(descriptionPlaceholder)
      .setValue(modalDescription)
      .setCustomId('description')));

  if ('FULL_BAN, BAN_EVASION, UNDERBAN'.includes(command)) {
    modal.addComponents(new ActionRowBuilder<TextInputBuilder>()
      .addComponents(new TextInputBuilder()
        .setLabel('How many days of msg to remove?')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('4 days 3hrs 2 mins 30 seconds (Max 7 days, Default 0 days)')
        .setRequired(false)
        .setCustomId('days')));
  }

  await interaction.showModal(modal);

  const filter = (i:ModalSubmitInteraction) => i.customId.startsWith('modModal');
  interaction.awaitModalSubmit({ filter, time: 0 })
    .then(async i => {
      if (i.customId.split('~')[2] !== interaction.id) return;
      if (!i.guild) return;
      await i.deferReply({ ephemeral: true });
      // const internalNote = i.fields.getTextInputValue('internalNote');
      let fullNote = i.fields.getTextInputValue('internalNote');
      const description = i.fields.getTextInputValue('description');

      if (fullNote?.includes('MEP') || description?.includes('MEP')) {
        await interaction.editReply({
          content: mepWarning,
        });
        return;
      }

      if (interaction.isMessageContextMenuCommand()) {
        fullNote = stripIndents`
          ${i.fields.getTextInputValue('internalNote')}`;
      }

      if (interaction.isButton()) {
        const embed = interaction.message.embeds[0].toJSON();

        const messageField = (embed.fields as APIEmbedField[]).find(field => field.name === 'Message') as APIEmbedField;
        const urlField = (embed.fields as APIEmbedField[]).find(field => field.name === 'Channel') as APIEmbedField;

        fullNote = stripIndents`
        ${i.fields.getTextInputValue('internalNote')}
    
        **The offending message**
        > ${messageField.value}
        ${urlField.value}
      `;
      }

      const vendorBan = fullNote?.toLowerCase().includes('vendor')
        && command === 'FULL_BAN';

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
      const duration = await parseDuration(`${dayInput} days`);

      if (!vendorBan && (description !== '' && description !== null)) {
        // if target is the type GuildMember, use the user property

        const appealString = '\n\nYou can send an email to appeals@tripsit.me to appeal this ban! Evasion bans are permanent, and underban bans are permanent until you turn 18.'; // eslint-disable-line max-len
        const evasionString = '\n\nEvasion bans are permanent, you can appeal the ban on your main account by sending an email, but evading will extend the ban'; // eslint-disable-line max-len
        const channel = await discordClient.channels.fetch(env.CHANNEL_HELPDESK);
        const discussString = `\n\nYou can discuss this with the mods in ${channel}. Do not argue the rules in public channels!`; // eslint-disable-line max-len
        const { pastVerb } = embedVariables[command as keyof typeof embedVariables];
        await messageUser(
          (target as GuildMember).user ? (target as GuildMember).user : target as User,
          i.guild,
          command,
          stripIndents`
            Hey ${target}, I'm sorry to inform that you've been ${pastVerb} by Team TripSit:
      
            ${description}
      
            **Do not message a moderator to talk about this!**${'FULL_BAN, BAN_EVASION, UNDERBAN'.includes(command) ? appealString : ''}${'BAN_EVASION'.includes(command) ? evasionString : ''}${'TICKET_BAN, DISCORD_BOT_BAN'.includes(command) ? discussString : ''}`, // eslint-disable-line max-len
        );
      }

      const actorData = await db.users.upsert({
        where: {
          discord_id: actor.id,
        },
        create: {
          discord_id: actor.id,
        },
        update: {
        },
      });
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

      let actionData = {
        id: undefined as string | undefined,
        user_id: targetData.id,
        type: 'TIMEOUT' as user_action_type,
        ban_evasion_related_user: null as string | null,
        description,
        internal_note: fullNote,
        expires_at: null as Date | null,
        repealed_by: null as string | null,
        repealed_at: null as Date | null,
        created_by: actorData.id,
        created_at: new Date(),
      } as user_actions;
      let extraMessage = '';
      if (command === 'FULL_BAN') {
        actionData.type = 'FULL_BAN' as user_action_type;
        targetData.removed_at = new Date();
        await db.users.update({
          where: {
            discord_id: target.id,
          },
          data: {
            removed_at: new Date(),
          },
        });
        try {
          const deleteMessageValue = duration ?? 0;
          if (deleteMessageValue > 0) {
          // log.debug(F, `I am deleting ${deleteMessageValue} days of messages!`);
            const response = await last(
              (target as GuildMember).user ? (target as GuildMember).user : target as User,
              interaction.guild as Guild,
            );
            const username = (target as GuildMember).user ? (target as GuildMember).user.username : (target as User).username; // eslint-disable-line max-len
            extraMessage = `${username}'s last ${response.messageCount} (out of ${response.totalMessages}) messages before being banned :\n${response.messageList}`; // eslint-disable-line max-len
          }
          const targetGuild = await discordClient.guilds.fetch(env.DISCORD_GUILD_ID);
          // log.debug(F, `Days to delete: ${deleteMessageValue}`);
          log.info(F, `target: ${target.id} | deleteMessageValue: ${deleteMessageValue} | internalNote: ${fullNote ?? noReason}`); // eslint-disable-line max-len
          targetGuild.bans.create(
            (target as GuildMember).user ? (target as GuildMember).user : target as User,
            { deleteMessageSeconds: deleteMessageValue / 1000, reason: fullNote ?? noReason },
          );
        } catch (err) {
          log.error(F, `Error: ${err}`);
        }
      } else if (command === 'UN-FULL_BAN') {
        actionData.type = 'FULL_BAN' as user_action_type;

        targetData.removed_at = null;
        await db.users.update({
          where: {
            discord_id: target.id,
          },
          data: {
            removed_at: null,
          },
        });

        const record = await db.user_actions.findMany({
          where: {
            user_id: targetData.id,
            type: 'FULL_BAN',
          },
        });

        if (record.length > 0) {
          [actionData] = record;
        }
        actionData.repealed_at = new Date();
        actionData.repealed_by = actorData.id;

        try {
          const targetGuild = await discordClient.guilds.fetch(env.DISCORD_GUILD_ID);
          await targetGuild.bans.fetch();
          await targetGuild.bans.remove(
            (target as GuildMember).user ? (target as GuildMember).user : target as User,
            fullNote ?? noReason,
          );
        } catch (err) {
          log.error(F, `Error: ${err}`);
        }
      } else if (command === 'UNDERBAN') {
        actionData.type = 'UNDERBAN' as user_action_type;
        targetData.removed_at = new Date();
        await db.users.update({
          where: {
            discord_id: target.id,
          },
          data: {
            removed_at: new Date(),
          },
        });
        try {
          const targetGuild = await discordClient.guilds.fetch(env.DISCORD_GUILD_ID);
          targetGuild.bans.create(
            (target as GuildMember).user ? (target as GuildMember).user : target as User,
            { reason: fullNote ?? noReason },
          );
        } catch (err) {
          log.error(F, `Error: ${err}`);
        }
      } else if (command === 'UN-UNDERBAN') {
        actionData.type = 'UNDERBAN' as user_action_type;
        targetData.removed_at = null;
        await db.users.update({
          where: {
            discord_id: target.id,
          },
          data: {
            removed_at: null,
          },
        });

        const record = await db.user_actions.findMany({
          where: {
            user_id: targetData.id,
            type: 'UNDERBAN',
          },
        });

        if (record.length > 0) {
          [actionData] = record;
        }
        actionData.repealed_at = new Date();
        actionData.repealed_by = actorData.id;

        try {
          const targetGuild = await discordClient.guilds.fetch(env.DISCORD_GUILD_ID);
          await targetGuild.bans.fetch();
          await targetGuild.bans.remove(
            (target as GuildMember).user ? (target as GuildMember).user : target as User,
            fullNote ?? noReason,
          );
        } catch (err) {
          log.error(F, `Error: ${err}`);
        }
      } else if (command === 'TICKET_BAN') {
        actionData.type = 'TICKET_BAN' as user_action_type;
        targetData.ticket_ban = true;
        await db.users.update({
          where: {
            discord_id: target.id,
          },
          data: {
            ticket_ban: true,
          },
        });
      } else if (command === 'UN-TICKET_BAN') {
        actionData.type = 'TICKET_BAN' as user_action_type;
        targetData.ticket_ban = false;

        await db.users.update({
          where: {
            discord_id: target.id,
          },
          data: {
            ticket_ban: false,
          },
        });

        const record = await db.user_actions.findMany({
          where: {
            user_id: targetData.id,
            type: 'TICKET_BAN',
          },
        });
        if (record.length > 0) {
          [actionData] = record;
        }
        actionData.repealed_at = new Date();
        actionData.repealed_by = actorData.id;
      } else if (command === 'DISCORD_BOT_BAN') {
        actionData.type = 'DISCORD_BOT_BAN' as user_action_type;
        targetData.discord_bot_ban = true;
        await db.users.update({
          where: {
            discord_id: target.id,
          },
          data: {
            discord_bot_ban: true,
          },
        });

        botBannedUsers.push(target.id);
      } else if (command === 'UN-DISCORD_BOT_BAN') {
        actionData.type = 'DISCORD_BOT_BAN' as user_action_type;
        targetData.discord_bot_ban = false;
        await db.users.update({
          where: {
            discord_id: target.id,
          },
          data: {
            discord_bot_ban: false,
          },
        });

        const record = await db.user_actions.findMany({
          where: {
            user_id: targetData.id,
            type: 'DISCORD_BOT_BAN',
          },
        });
        if (record.length > 0) {
          [actionData] = record;
        }
        actionData.repealed_at = new Date();
        actionData.repealed_by = actorData.id;

        // Remove the user from the botBannedUsers list
        const index = botBannedUsers.indexOf(target.id);
        if (index > -1) {
          botBannedUsers.splice(index, 1);
        }
      } else if (command === 'BAN_EVASION') {
        actionData.type = 'BAN_EVASION' as user_action_type;
        targetData.removed_at = new Date();
        await db.users.update({
          where: {
            discord_id: target.id,
          },
          data: {
            removed_at: new Date(),
          },
        });
      } else if (command === 'UN-BAN_EVASION') {
        actionData.type = 'BAN_EVASION' as user_action_type;
        targetData.removed_at = null;
        await db.users.update({
          where: {
            discord_id: target.id,
          },
          data: {
            removed_at: null,
          },
        });

        const record = await db.user_actions.findMany({
          where: {
            user_id: targetData.id,
            type: 'BAN_EVASION',
          },
        });
        if (record.length > 0) {
          [actionData] = record;
        }
        actionData.repealed_at = new Date();
        actionData.repealed_by = actorData.id;
      }

      await db.user_actions.create({
        data: actionData,
      });

      let modThread = {} as ThreadChannel;
      if (!vendorBan) {
        modThread = await messageModThread(
          actor,
          (target as GuildMember).user ? (target as GuildMember).user : target as User,
          command,
          fullNote,
          description,
          extraMessage,
        );
      }

      await messageModlog(
        (target as GuildMember).user ? (target as GuildMember).user : target as User,
        command,
        fullNote,
        description,
      );

      const username = (target as GuildMember).user ? (target as GuildMember).user.username : (target as User).username;

      if (interaction.isButton()) {
        const embed = interaction.message.embeds[0].toJSON();
        const actionField = embed.fields?.find(field => field.name === 'Actions');

        if (actionField) {
        // Add the action to the list of actions
          const newActionFiled = actionField?.value.concat(`
        
        ${interaction.user.toString()} muted this user:
        > ${i.fields.getTextInputValue('internalNote')}
        
        Message sent to user:
        > ${i.fields.getTextInputValue('description')}`);
          // log.debug(F, `newActionFiled: ${newActionFiled}`);

          // Replace the action field with the new one
          embed.fields?.splice(embed.fields?.findIndex(field => field.name === 'Actions'), 1, {
            name: 'Actions',
            value: newActionFiled,
            inline: true,
          });
        } else {
          embed.fields?.push(
            {
              name: 'Actions',
              value: stripIndents`${interaction.user.toString()} muted this user:
            > ${i.fields.getTextInputValue('internalNote')}
        
            Message sent to user:
            > ${i.fields.getTextInputValue('description')}`,
              inline: true,
            },
          );
        }

        embed.color = Colors.Green;
        const buttonRows = interaction.message.components.map(row => ActionRowBuilder.from(row.toJSON()));

        await interaction.message.edit({
          embeds: [embed],
          components: buttonRows as ActionRowBuilder<ButtonBuilder>[],
        });
      }

      await i.editReply({
        embeds: [
          embedTemplate()
            .setAuthor(null)
            .setColor(Colors.Yellow)
            .setDescription(stripIndents`
              ${username} was ${embedVariables[command as keyof typeof embedVariables].pastVerb}
              **Reason:** ${fullNote ?? noReason}
              ${(description !== '' && description !== null) ? `\n\n**Note sent to user: ${description}**` : ''}
              ${`You can access their thread here: ${modThread}`}
            `)
            .setFooter(null),
        ],
      });
    });
}

export async function info(
  interaction: ChatInputCommandInteraction | UserContextMenuCommandInteraction,
  targetString: string,
) {
  await interaction.deferReply({ ephemeral: true });
  const command = 'INFO';
  // log.debug(F, `Member: ${JSON.stringify(target)}`);
  // log.debug(F, `User: ${JSON.stringify(target.user)}`);

  let target: GuildMember | User;
  const [targetMember] = await getDiscordMember(interaction, targetString) as GuildMember[];
  if (targetMember) {
    target = targetMember;
  } else {
    // Look up the user and use that as the target
    const discordUserData = await getDiscordUser(targetString);
    if (!discordUserData) {
      const embed = embedTemplate()
        .setColor(Colors.Red)
        .setTitle(noUserError)
        .setDescription(stripIndents`
          "${targetString}" returned no results!

          Try again with:
          > **Mention:** @Moonbear
          > **Tag:** moonbear#1234
          > **ID:** 9876581237
          > **Nickname:** MoonBear
        `);
      await interaction.reply({
        embeds: [embed],
        ephemeral: true,
      });
      return;
    }
    target = discordUserData;
  }
  const actor = interaction.member as GuildMember;
  log.debug(F, `${actor} ran ${command} on ${target} in ${actor.guild.name}`);

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
  const modlogEmbed = await userInfoEmbed(target, targetData, command);
  const trollScoreData = await tripSitTrollScore((target as GuildMember).user ? (target as GuildMember).user : target as User);
  modlogEmbed.setDescription(`**TripSit TrollScore: ${trollScoreData.trollScore}**\n\`\`\`${trollScoreData.tsReasoning}\`\`\`${modlogEmbed.data.description}`);
  await interaction.editReply({ embeds: [modlogEmbed] });
}

export async function kick(
  interaction: ChatInputCommandInteraction | UserContextMenuCommandInteraction,
  target: GuildMember,
) {
  const command = 'KICK';
  const actor = interaction.member as GuildMember;
  log.debug(F, `${actor} ran ${command} on ${target} in ${actor.guild.name}`);
  const modal = new ModalBuilder()
    .setCustomId(`modModal~${command}~${interaction.id}`)
    .setTitle(`Tripbot ${command}`)
    .addComponents(new ActionRowBuilder<TextInputBuilder>()
      .addComponents(new TextInputBuilder()
        .setLabel(`Why are you ${embedVariables[command as keyof typeof embedVariables].presentVerb} this user?`)
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder(internalNotePlaceholder)
        .setRequired(true)
        .setCustomId('internalNote')));

  modal.addComponents(new ActionRowBuilder<TextInputBuilder>()
    .addComponents(new TextInputBuilder()
      .setLabel(descriptionLabel)
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder(descriptionPlaceholder)
      .setCustomId('description')));

  await interaction.showModal(modal);

  const filter = (i:ModalSubmitInteraction) => i.customId.startsWith('modModal');
  interaction.awaitModalSubmit({ filter, time: 0 })
    .then(async i => {
      if (i.customId.split('~')[2] !== interaction.id) return;
      await i.deferReply({ ephemeral: true });
      if (!i.guild) return;
      const internalNote = i.fields.getTextInputValue('internalNote');
      const description = i.fields.getTextInputValue('description');

      if (internalNote?.includes('MEP') || description?.includes('MEP')) {
        await interaction.editReply({
          content: mepWarning,
        });
        return;
      }

      const { pastVerb } = embedVariables[command as keyof typeof embedVariables];
      if ((description !== '' && description !== null)) {
        await messageUser(
          target.user,
          i.guild,
          command,
          `
            Hey ${target}, I'm sorry to inform that you've been ${pastVerb} by Team TripSit:
      
            ${description}
      
            **Do not message a moderator to talk about this!**

            Please review the rules so this doesn't happen again!\nhttps:// wiki.tripsit.me/wiki/Terms_of_Service

            If you feel you can follow the rules you can rejoin here: https://discord.gg/tripsit
          `,
        );
      }

      try {
        await target.kick();
      } catch (err) {
        log.error(F, `Error: ${err}`);
      }

      const actorData = await db.users.upsert({
        where: {
          discord_id: actor.id,
        },
        create: {
          discord_id: actor.id,
        },
        update: {
        },
      });
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

      await db.user_actions.create({
        data: {
          id: undefined as string | undefined,
          user_id: targetData.id,
          guild_id: i.guild.id,
          type: 'KICK' as user_action_type,
          ban_evasion_related_user: null as string | null,
          description,
          internal_note: internalNote,
          expires_at: null as Date | null,
          repealed_by: null as string | null,
          repealed_at: null as Date | null,
          created_by: actorData.id,
          created_at: new Date(),
        },
      });

      const modThread = await messageModThread(
        actor,
        target.user,
        command,
        internalNote,
        description,
      );

      await messageModlog(
        target.user,
        command,
        internalNote,
        description,
      );

      i.editReply({
        embeds: [
          embedTemplate()
            .setAuthor(null)
            .setColor(Colors.Yellow)
            .setDescription(stripIndents`
              ${target.displayName} was ${embedVariables[command as keyof typeof embedVariables].pastVerb}
              **Reason:** ${internalNote ?? noReason}
              ${(description !== '' && description !== null) ? `\n\n**Note sent to user: ${description}**` : ''}
              ${`You can access their thread here: ${modThread}`}
            `)
            .setFooter(null),
        ],
      });
    });

  return false;
}

export async function link(
  interaction: ChatInputCommandInteraction,
  target: GuildMember,
) {
  const guildData = await db.discord_guilds.upsert({
    where: {
      id: (interaction.guild as Guild).id,
    },
    create: {
      id: (interaction.guild as Guild).id,
    },
    update: {
    },
  });
  if (!interaction.channel?.isThread()
  || !interaction.channel.parentId
  || interaction.channel.parentId !== guildData.channel_moderators) {
    await interaction.reply({
      content: `This command can only be run inside a thread under <#${guildData.channel_moderators}>!`,
      ephemeral: true,
    });
    return false;
  }

  const override = interaction.options.getBoolean('override');

  let result: string | null;
  const targetString = interaction.options.getString('target', true);
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

  return true;
}

export async function note(
  interaction: ChatInputCommandInteraction | MessageContextMenuCommandInteraction | ButtonInteraction,
  target: GuildMember | User,
) {
  const command = 'NOTE';
  const actor = interaction.member as GuildMember;

  let modalValue = '';
  log.debug(F, `${actor} ran ${command} on ${target} in ${actor.guild.name}`);

  if (interaction.isButton()) {
    const embed = interaction.message.embeds[0].toJSON();
    const flagsField = (embed.fields as APIEmbedField[]).find(field => field.name === 'Flags');
    if (flagsField) {
      modalValue = `This user's message was flagged by the AI for ${flagsField.value}`;
    }
  }

  const modal = new ModalBuilder()
    .setCustomId(`modModal~${command}~${interaction.id}`)
    .setTitle(`Tripbot ${command}`)
    .addComponents(new ActionRowBuilder<TextInputBuilder>()
      .addComponents(new TextInputBuilder()
        .setLabel(`Why are you ${embedVariables[command as keyof typeof embedVariables].presentVerb} this user?`)
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder(internalNotePlaceholder)
        .setValue(modalValue)
        .setRequired(true)
        .setCustomId('internalNote')));

  await interaction.showModal(modal);

  const filter = (i:ModalSubmitInteraction) => i.customId.startsWith('modModal');
  interaction.awaitModalSubmit({ filter, time: 0 })
    .then(async i => {
      if (i.customId.split('~')[2] !== interaction.id) return;
      await i.deferReply({ ephemeral: true });
      const internalNote = i.fields.getTextInputValue('internalNote');
      if (internalNote?.includes('MEP')) {
        await interaction.editReply({
          content: mepWarning,
        });
        return;
      }

      let fullNote = i.fields.getTextInputValue('internalNote');

      if (interaction.isMessageContextMenuCommand()) {
        fullNote = stripIndents`
          ${i.fields.getTextInputValue('internalNote')}
      
          **The offending message**
          > ${interaction.targetMessage.cleanContent}
          ${interaction.targetMessage.url}
        `;
      }

      if (interaction.isButton()) {
        const embed = interaction.message.embeds[0].toJSON();

        const messageField = (embed.fields as APIEmbedField[]).find(field => field.name === 'Message') as APIEmbedField;
        const urlField = (embed.fields as APIEmbedField[]).find(field => field.name === 'Channel') as APIEmbedField;

        fullNote = stripIndents`
        ${i.fields.getTextInputValue('internalNote')}
    
        **The offending message**
        > ${messageField.value}
        ${urlField.value}
      `;
      }

      const actorData = await db.users.upsert({
        where: {
          discord_id: actor.id,
        },
        create: {
          discord_id: actor.id,
        },
        update: {
        },
      });

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

      await db.user_actions.create({
        data: {
          user_id: targetData.id,
          guild_id: actor.guild.id,
          type: 'NOTE' as user_action_type,
          ban_evasion_related_user: null as string | null,
          description: null,
          internal_note: fullNote,
          expires_at: null as Date | null,
          repealed_by: null as string | null,
          repealed_at: null as Date | null,
          created_by: actorData.id,
          created_at: new Date(),
        },
      });

      const modThread = await messageModThread(
        actor,
        (target as GuildMember).user ? (target as GuildMember).user : target as User,
        command,
        fullNote,
      );

      await messageModlog(
        (target as GuildMember).user ? (target as GuildMember).user : target as User,
        command,
        fullNote,
      );

      if (interaction.isButton()) {
        const embed = interaction.message.embeds[0].toJSON();
        const actionField = embed.fields?.find(field => field.name === 'Actions');

        if (actionField) {
        // Add the action to the list of actions
          const newActionFiled = actionField?.value.concat(`
        
        ${interaction.user.toString()} noted this user:
        > ${i.fields.getTextInputValue('internalNote')}
        
        Message sent to user:
        > **No message sent to user on notes**
        `);
          // log.debug(F, `newActionFiled: ${newActionFiled}`);

          // Replace the action field with the new one
          embed.fields?.splice(embed.fields?.findIndex(field => field.name === 'Actions'), 1, {
            name: 'Actions',
            value: newActionFiled,
            inline: true,
          });
        } else {
          embed.fields?.push(
            {
              name: 'Actions',
              value: stripIndents`${interaction.user.toString()} noted this user:
            > ${i.fields.getTextInputValue('internalNote')}
        
            Message sent to user:
            > ${i.fields.getTextInputValue('description')}`,
              inline: true,
            },
          );
        }

        embed.color = Colors.Green;
        const buttonRows = interaction.message.components.map(row => ActionRowBuilder.from(row.toJSON()));

        await interaction.message.edit({
          embeds: [embed],
          components: buttonRows as ActionRowBuilder<ButtonBuilder>[],
        });
      }

      await i.editReply({
        embeds: [
          embedTemplate()
            .setAuthor(null)
            .setColor(Colors.Yellow)
            .setDescription(stripIndents`
              ${(target as GuildMember).user ? (target as GuildMember).user.username : (target as User).username} was ${embedVariables[command as keyof typeof embedVariables].pastVerb}
              **Reason:** ${fullNote ?? noReason}
              ${`You can access their thread here: ${modThread}`}
            `)
            .setFooter(null),
        ],
      });
    });
}

export async function report(
  interaction: ChatInputCommandInteraction | MessageContextMenuCommandInteraction,
  target: GuildMember,
) {
  const command = 'REPORT';
  const actor = interaction.member as GuildMember;
  log.debug(F, `${actor} ran ${command} on ${target} in ${actor.guild.name}`);
  const modal = new ModalBuilder()
    .setCustomId(`modModal~${command}~${interaction.id}`)
    .setTitle(`Tripbot ${command}`)
    .addComponents(new ActionRowBuilder<TextInputBuilder>()
      .addComponents(new TextInputBuilder()
        .setLabel(`Why are you ${embedVariables[command as keyof typeof embedVariables].presentVerb} this user?`)
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder(internalNotePlaceholder)
        .setRequired(true)
        .setCustomId('internalNote')));

  await interaction.showModal(modal);

  const filter = (i:ModalSubmitInteraction) => i.customId.startsWith('modModal');
  interaction.awaitModalSubmit({ filter, time: 0 })
    .then(async i => {
      if (i.customId.split('~')[2] !== interaction.id) return;
      await i.deferReply({ ephemeral: true });
      const internalNote = i.fields.getTextInputValue('internalNote');
      if (internalNote?.includes('MEP')) {
        await interaction.editReply({
          content: mepWarning,
        });
        return;
      }

      let fullNote = i.fields.getTextInputValue('internalNote');

      if (interaction.isMessageContextMenuCommand()) {
        fullNote = stripIndents`
          ${i.fields.getTextInputValue('internalNote')}
      
          **The offending message**
          > ${interaction.targetMessage.cleanContent}
          ${interaction.targetMessage.url}
        `;
      }

      // const actorData = await database.users.get((interaction.member as GuildMember).id, null, null);
      // const targetData = await database.users.get(target.id, null, null);
      const actorData = await db.users.upsert({
        where: {
          discord_id: actor.id,
        },
        create: {
          discord_id: actor.id,
        },
        update: {
        },
      });
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

      await db.user_actions.create({
        data: {
          user_id: targetData.id,
          guild_id: actor.guild.id,
          type: 'REPORT' as user_action_type,
          ban_evasion_related_user: null as string | null,
          description: null,
          internal_note: fullNote,
          expires_at: null as Date | null,
          repealed_by: null as string | null,
          repealed_at: null as Date | null,
          created_by: actorData.id,
          created_at: new Date(),
        },
      });

      await messageModThread(
        actor,
        target.user,
        command,
        fullNote,
      );

      await messageModlog(
        target.user,
        command,
        fullNote,
      );

      i.editReply({
        embeds: [
          embedTemplate()
            .setAuthor(null)
            .setColor(Colors.Yellow)
            .setDescription(stripIndents`
              ${target.displayName} was ${embedVariables[command as keyof typeof embedVariables].pastVerb}
              **Reason:** ${fullNote ?? noReason}
            `)
            .setFooter(null),
        ],
      });
    });

  return false;
}

export async function timeout(
  interaction: ChatInputCommandInteraction | MessageContextMenuCommandInteraction | ButtonInteraction,
  target: GuildMember,
) {
  let command = '' as 'TIMEOUT' | 'UN-TIMEOUT';
  let modalDescription = descriptionPlaceholder;
  let modalInternal = internalNotePlaceholder;
  if (interaction.isChatInputCommand()) {
    command = interaction.options.getString('toggle', true) === 'ON'
      ? 'TIMEOUT'
      : 'UN-TIMEOUT';
  } else if (interaction.isMessageContextMenuCommand()) {
    command = 'TIMEOUT';
  } else if (interaction.isButton()) {
    command = 'TIMEOUT';
    const embed = interaction.message.embeds[0].toJSON();
    const flagsField = (embed.fields as APIEmbedField[]).find(field => field.name === 'Flags');
    const messageField = (embed.fields as APIEmbedField[]).find(field => field.name === 'Message') as APIEmbedField;
    const urlField = (embed.fields as APIEmbedField[]).find(field => field.name === 'Channel') as APIEmbedField;
    if (flagsField) {
      modalInternal = `This user breaks TripSit's policies regarding ${flagsField.value} topics.`;
      modalDescription = stripIndents`
      Your recent messages have broken TripSit's policies regarding ${flagsField.value} topics.
      
      The offending message
      > ${messageField.value}
      ${urlField.value}`;
    }
  }

  const actor = interaction.member as GuildMember;
  log.debug(F, `${actor} ran ${command} on ${target} in ${actor.guild.name}`);
  const modal = new ModalBuilder()
    .setCustomId(`modModal~${command}~${interaction.id}`)
    .setTitle(`Tripbot ${command}`)
    .addComponents(new ActionRowBuilder<TextInputBuilder>()
      .addComponents(new TextInputBuilder()
        .setLabel(`Why are you ${embedVariables[command].presentVerb} this user?`)
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder(internalNotePlaceholder)
        .setValue(modalInternal)
        .setRequired(true)
        .setCustomId('internalNote')));

  modal.addComponents(new ActionRowBuilder<TextInputBuilder>()
    .addComponents(new TextInputBuilder()
      .setLabel(descriptionLabel)
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder(descriptionPlaceholder)
      .setValue(modalDescription)
      .setCustomId('description')));

  modal.addComponents(new ActionRowBuilder<TextInputBuilder>()
    .addComponents(new TextInputBuilder()
      .setLabel('Timeout for how long?')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('4 days 3hrs 2 mins 30 seconds (Max 7 days, Default 7 days)')
      .setRequired(false)
      .setCustomId('duration')));

  await interaction.showModal(modal);

  const filter = (i:ModalSubmitInteraction) => i.customId.startsWith('modModal');
  interaction.awaitModalSubmit({ filter, time: 0 })
    .then(async i => {
      if (i.customId.split('~')[2] !== interaction.id) return;
      if (!i.guild) return;
      await i.deferReply({ ephemeral: true });
      const internalNote = i.fields.getTextInputValue('internalNote');
      const description = i.fields.getTextInputValue('description');

      if (internalNote?.includes('MEP') || description?.includes('MEP')) {
        await interaction.editReply({
          content: mepWarning,
        });
        return;
      }

      let fullNote = i.fields.getTextInputValue('internalNote');

      if (interaction.isMessageContextMenuCommand()) {
        fullNote = stripIndents`
          ${i.fields.getTextInputValue('internalNote')}
      
          **The offending message**
          > ${interaction.targetMessage.cleanContent}
          ${interaction.targetMessage.url}
        `;
      }

      if (interaction.isButton()) {
        const embed = interaction.message.embeds[0].toJSON();

        const messageField = (embed.fields as APIEmbedField[]).find(field => field.name === 'Message') as APIEmbedField;
        const urlField = (embed.fields as APIEmbedField[]).find(field => field.name === 'Channel') as APIEmbedField;

        fullNote = stripIndents`
        ${i.fields.getTextInputValue('internalNote')}
    
        **The offending message**
        > ${messageField.value}
        ${urlField.value}
      `;
      }

      let duration = i.fields.getTextInputValue('duration');
      if (duration === '') duration = '7 days';
      if (duration.length === 1) {
        // If the input is a single number, assume it's days
        const numberInput = parseInt(duration, 10);
        if (Number.isNaN(numberInput)) {
          await i.editReply({ content: 'Timeout must be a number!' });
          return;
        }
        if (numberInput < 0 || numberInput > 7) {
          await i.editReply({ content: 'Timeout must be between 0 and 7 days!' });
          return;
        }
        duration = `${duration} days`;
      }
      const timeoutDuration = await parseDuration(duration);
      if (timeoutDuration && (timeoutDuration < 0 || timeoutDuration > 7 * 24 * 60 * 60 * 1000)) {
        await i.editReply({ content: 'Timeout must be between 0 and 7 days!!' });
        return;
      }

      const { pastVerb } = embedVariables[command as keyof typeof embedVariables];

      if ((description !== '' && description !== null)) {
        const channel = await discordClient.channels.fetch(env.CHANNEL_HELPDESK);
        await messageUser(
          target.user,
          i.guild,
          command,
          `
            Hey ${target}, I'm sorry to inform that you've been ${pastVerb} by Team TripSit:
      
            ${description}
      
            **Do not message a moderator to talk about this!**

            Please review the rules so this doesn't happen again!\nhttps:// wiki.tripsit.me/wiki/Terms_of_Service

            **Do not argue the rules in public channels!**

            You can discuss this with the mods in ${channel} when this expires. 
          `,
          true,
        );
      }

      if (command === 'TIMEOUT') {
        try {
          await target.timeout(timeoutDuration, fullNote ?? noReason);
        } catch (err) {
          log.error(F, `Error: ${err}`);
        }
      } else {
        try {
          await target.timeout(0, fullNote ?? noReason);
        } catch (err) {
          log.error(F, `Error: ${err}`);
        }
      }

      // const actorData = await database.users.get(actor.id, null, null);
      // const targetData = await database.users.get(target.id, null, null);

      const actorData = await db.users.upsert({
        where: {
          discord_id: actor.id,
        },
        create: {
          discord_id: actor.id,
        },
        update: {
        },
      });

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

      let actionData = {
        id: undefined as string | undefined,
        user_id: targetData.id,
        type: 'TIMEOUT' as user_action_type,
        ban_evasion_related_user: null as string | null,
        description,
        internal_note: fullNote,
        expires_at: null as Date | null,
        repealed_by: null as string | null,
        repealed_at: null as Date | null,
        created_by: actorData.id,
        created_at: new Date(),
      } as user_actions;

      if (command === 'TIMEOUT') {
        actionData.type = 'TIMEOUT' as user_action_type;
        actionData.expires_at = new Date(Date.now() + timeoutDuration);
      } else {
        // const record = await database.actions.get(targetData.id, 'TIMEOUT');
        const record = await db.user_actions.findMany({
          where: {
            user_id: targetData.id,
            type: 'TIMEOUT',
          },
        });
        if (record.length > 0) {
          [actionData] = record;
        }
        actionData.repealed_at = new Date();
        actionData.repealed_by = actorData.id;
      }

      await db.user_actions.create({
        data: actionData,
      });

      const modThread = await messageModThread(
        actor,
        target.user,
        command,
        fullNote,
        description,
      );

      await messageModlog(
        target.user,
        command,
        fullNote,
        description,
      );

      if (interaction.isButton()) {
        const embed = interaction.message.embeds[0].toJSON();
        const actionField = embed.fields?.find(field => field.name === 'Actions');

        if (actionField) {
        // Add the action to the list of actions
          const newActionFiled = actionField?.value.concat(`
        
        ${interaction.user.toString()} muted this user:
        > ${i.fields.getTextInputValue('internalNote')}
        
        Message sent to user:
        > ${i.fields.getTextInputValue('description')}`);
          // log.debug(F, `newActionFiled: ${newActionFiled}`);

          // Replace the action field with the new one
          embed.fields?.splice(embed.fields?.findIndex(field => field.name === 'Actions'), 1, {
            name: 'Actions',
            value: newActionFiled,
            inline: true,
          });
        } else {
          embed.fields?.push(
            {
              name: 'Actions',
              value: stripIndents`${interaction.user.toString()} muted this user:
            > ${i.fields.getTextInputValue('internalNote')}
        
            Message sent to user:
            > ${i.fields.getTextInputValue('description')}`,
              inline: true,
            },
          );
        }

        embed.color = Colors.Green;
        const buttonRows = interaction.message.components.map(row => ActionRowBuilder.from(row.toJSON()));

        await interaction.message.edit({
          embeds: [embed],
          components: buttonRows as ActionRowBuilder<ButtonBuilder>[],
        });
      }

      await i.editReply({
        embeds: [
          embedTemplate()
            .setAuthor(null)
            .setColor(Colors.Yellow)
            .setDescription(stripIndents`
              ${target.displayName} was ${embedVariables[command as keyof typeof embedVariables].pastVerb}
              **Reason:** ${fullNote ?? noReason}
              ${(description !== '' && description !== null) ? `\n\n**Note sent to user: ${description}**` : ''}
              ${`You can access their thread here: ${modThread}`}
            `)
            .setFooter(null),
        ],
      });
    });
}

export async function warn(
  interaction: ChatInputCommandInteraction | MessageContextMenuCommandInteraction,
  target: GuildMember,
) {
  const command = 'WARNING';
  const actor = interaction.member as GuildMember;
  log.debug(F, `${actor} ran ${command} on ${target} in ${actor.guild.name}`);
  const modal = new ModalBuilder()
    .setCustomId(`modModal~${command}~${interaction.id}`)
    .setTitle(`Tripbot ${command}`)
    .addComponents(new ActionRowBuilder<TextInputBuilder>()
      .addComponents(new TextInputBuilder()
        .setLabel(`Why are you ${embedVariables[command as keyof typeof embedVariables].presentVerb} this user?`)
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder(internalNotePlaceholder)
        .setRequired(true)
        .setCustomId('internalNote')));
  modal.addComponents(new ActionRowBuilder<TextInputBuilder>()
    .addComponents(new TextInputBuilder()
      .setLabel(descriptionLabel)
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder(descriptionPlaceholder)
      .setRequired(true)
      .setCustomId('description')));

  await interaction.showModal(modal);

  const filter = (i:ModalSubmitInteraction) => i.customId.startsWith('modModal');
  interaction.awaitModalSubmit({ filter, time: 0 })
    .then(async i => {
      if (i.customId.split('~')[2] !== interaction.id) return;
      if (!i.guild) return;
      await i.deferReply({ ephemeral: true });
      const internalNote = i.fields.getTextInputValue('internalNote');
      const description = i.fields.getTextInputValue('description');

      if (internalNote?.includes('MEP')) {
        await interaction.editReply({
          content: mepWarning,
        });
        return;
      }

      let fullNote = i.fields.getTextInputValue('internalNote');

      if (interaction.isMessageContextMenuCommand()) {
        fullNote = stripIndents`
          ${i.fields.getTextInputValue('internalNote')}
      
          **The offending message**
          > ${interaction.targetMessage.cleanContent}
          ${interaction.targetMessage.url}
        `;
      }

      const channelHelpDesk = await discordClient.channels.fetch(env.CHANNEL_HELPDESK);
      const { pastVerb } = embedVariables[command as keyof typeof embedVariables];
      await messageUser(
        target.user,
        i.guild,
        command,
        `
          Hey ${target}, I'm sorry to inform that you've been ${pastVerb} by ${i.guild.name}:
    
          ${description}
    
          **Do not message a moderator to talk about this!**

          Please review ${i.guild.rulesChannel} so this doesn't happen again!

          You can discuss this with the mods in ${channelHelpDesk}. Do not argue the rules in public channels!
        `,
        true,
      );

      const actorData = await db.users.upsert({
        where: {
          discord_id: actor.id,
        },
        create: {
          discord_id: actor.id,
        },
        update: {
        },
      });

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

      await db.user_actions.create({
        data: {
          user_id: targetData.id,
          guild_id: actor.guild.id,
          type: 'WARNING' as user_action_type,
          ban_evasion_related_user: null as string | null,
          description,
          internal_note: fullNote,
          expires_at: null as Date | null,
          repealed_by: null as string | null,
          repealed_at: null as Date | null,
          created_by: actorData.id,
          created_at: new Date(),
        },
      });

      const modThread = await messageModThread(
        actor,
        target.user,
        command,
        fullNote,
        description,
      );

      await messageModlog(
        target.user,
        command,
        fullNote,
        description,
      );

      i.editReply({
        embeds: [
          embedTemplate()
            .setAuthor(null)
            .setColor(Colors.Yellow)
            .setDescription(stripIndents`
              ${target.displayName} was ${embedVariables[command as keyof typeof embedVariables].pastVerb}
              **Reason:** ${fullNote ?? noReason}
              ${(description !== '' && description !== null) ? `\n\n**Note sent to user: ${description}**` : ''}
              ${`You can access their thread here: ${modThread}`}
            `)
            .setFooter(null),
        ],
      });
    });
}

export const mod: SlashCommand = {
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
      .setDescription('Ban a user')
      .addStringOption(option => option
        .setName('target')
        .setDescription('User to ban!')
        .setRequired(true))
      .addStringOption(option => option
        .setName('type')
        .setDescription('Type of ban')
        .setRequired(true)
        .addChoices(
          { name: 'Full Ban', value: 'FULL_BAN' },
          { name: 'Ticket Ban', value: 'TICKET_BAN' },
          { name: 'Discord Bot Ban', value: 'DISCORD_BOT_BAN' },
          { name: 'Ban Evasion', value: 'BAN_EVASION' },
          { name: 'Underban', value: 'UNDERBAN' },
          { name: 'Helper Ban', value: 'HELPER_BAN' },
          { name: 'Contributor Ban', value: 'CONTRIBUTOR_BAN' },
        ))
      .addStringOption(option => option
        .setName('toggle')
        .setDescription('On or off? (Default: ON)')
        .addChoices(
          { name: 'On', value: 'ON' },
          { name: 'Off', value: 'OFF' },
        ))
      .setName('ban'))
    .addSubcommand(subcommand => subcommand
      .setDescription('Warn a user')
      .addStringOption(option => option
        .setName('target')
        .setDescription('User to warn!')
        .setRequired(true))
      .setName('warning'))
    .addSubcommand(subcommand => subcommand
      .setDescription('Report a user')
      .addStringOption(option => option
        .setName('target')
        .setDescription('User to report!')
        .setRequired(true))
      .setName('report'))
    .addSubcommand(subcommand => subcommand
      .setDescription('Create a note about a user')
      .addStringOption(option => option
        .setName('target')
        .setDescription('User to note about!')
        .setRequired(true))
      .setName('note'))
    .addSubcommand(subcommand => subcommand
      .setDescription('Timeout a user')
      .addStringOption(option => option
        .setName('target')
        .setDescription('User to timeout!')
        .setRequired(true))
      .addStringOption(option => option
        .setName('toggle')
        .setDescription('On or off? (Default: ON)')
        .addChoices(
          { name: 'On', value: 'ON' },
          { name: 'Off', value: 'OFF' },
        ))
      .setName('timeout'))
    .addSubcommand(subcommand => subcommand
      .setDescription('Kick a user')
      .addStringOption(option => option
        .setName('target')
        .setDescription('User to kick!')
        .setRequired(true))
      .setName('kick'))
    .addSubcommand(subcommand => subcommand
      .setDescription('Link user to an existing thread')
      .addStringOption(option => option
        .setName('target')
        .setDescription('User to link!')
        .setRequired(true))
      .addBooleanOption(option => option
        .setName('override')
        .setDescription('Override existing threads in the DB'))
      .setName('link')),
  async execute(interaction:ChatInputCommandInteraction) {
    log.info(F, await commandContext(interaction));

    if (!interaction.guild) {
      await interaction.reply({
        embeds: [embedTemplate()
          .setColor(Colors.Red)
          .setTitle('This command can only be used in a server!')],
        ephemeral: true,
      });
      return false;
    }

    const command = interaction.options.getSubcommand().toUpperCase() as ModAction;

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
          && !guildData.partner
          && !guildData.supporter) {
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

    const actor = interaction.member as GuildMember;
    const targetString = interaction.options.getString('target', true);
    const targets = await getDiscordMember(interaction, targetString) as GuildMember[];

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

    const target = targets[0];
    if (!target && command !== 'FULL_BAN') {
      const embed = embedTemplate()
        .setColor(Colors.Red)
        .setTitle(noUserError)
        .setDescription(stripIndents`
        "${targetString}" returned no results!

        Try again with:
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

    switch (command) {
      case 'BAN':
        await ban(interaction, targetString);
        break;
      case 'INFO':
        await info(interaction, targetString);
        return true;
      case 'KICK':
        await kick(interaction, targets[0]);
        break;
      case 'LINK':
        await link(interaction, targets[0]);
        break;
      case 'NOTE':
        await note(interaction, targets[0]);
        break;
      case 'REPORT':
        await report(interaction, targets[0]);
        break;
      case 'TIMEOUT':
        await timeout(interaction, targets[0]);
        break;
      case 'WARNING':
        await warn(interaction, targets[0]);
        break;
      default:
        break;
    }

    log.debug(F, `${actor} ran ${command} on ${target}`);
    return true;
  },
};

export default mod;
