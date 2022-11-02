import env from '../../global/utils/env.config';
import {
  Colors,
  ButtonInteraction,
  Client,
  Role,
  TextChannel,
  GuildMemberRoleManager,
  User,
  ModalBuilder,
  ActionRowBuilder,
  ModalSubmitInteraction,
  TextInputBuilder,
  GuildMember,
  // GuildMember,
  ThreadChannel,
  PermissionsBitField,
  MessageMentionTypes,
} from 'discord.js';
import {
  TextInputStyle,
} from 'discord-api-types/v10';
import {db} from '../../global/utils/knex';
import {
  Users,
  UserTickets,
  // TicketStatus,
} from '../../global/@types/pgdb.d';
import logger from '../../global/utils/logger';
import {stripIndents} from 'common-tags';
import {embedTemplate} from '../utils/embedTemplate';
import {applicationApprove} from '../utils/application';
import {tripSitMe, needsHelpmode, tripsitmeFinish} from '../utils/tripsitme';
import {techHelpClick, techHelpClose, techHelpOwn} from '../utils/techHelp';
import {
  modmailCreate, modmailActions,
} from '../commands/guild/modmail';

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

/**
 * This runs whenever a buttion is clicked
 * @param {ButtonInteraction} interaction The interaction that started this
 * @param {Client} client The client that manages it
 * @return {Promise<void>}
 */
export async function buttonClick(interaction:ButtonInteraction, client:Client) {
  logger.debug(stripIndents`[${PREFIX}] started | \
user: ${interaction.user.tag} (${interaction.user.id}) \
guild: ${interaction.guild?.name} (${interaction.guild?.id}) \
customId: ${interaction.customId}
  `);
  const buttonID = interaction.customId;
  const command = client.commands.get(interaction.customId);
  if (command) {
    logger.debug(`[${PREFIX}] command: ${command}`);
  }
  if (buttonID.startsWith('modmailIssue')) {
    await modmailActions(interaction);
    return;
  }

  if (buttonID.startsWith('tripsitmeClick')) {
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
    const target = interaction.member as GuildMember;
    const actorIsAdmin = (target as GuildMember).permissions.has(PermissionsBitField.Flags.Administrator);
    const showMentions = actorIsAdmin ? [] : ['users', 'roles'] as MessageMentionTypes[];

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
        const teamMessage = stripIndents`You are a member of the team and cannot be publicly helped!`;
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

    // Get the target's ticket data
    const userUniqueId = await db
      .select(db.ref('id'))
      .from<Users>('users')
      .where('discord_id', target.id)
      .first();

    const ticketData = await db
      .select(
        db.ref('id').as('id'),
        db.ref('user_id').as('user_id'),
        db.ref('description').as('description'),
        db.ref('thread_id').as('thread_id'),
        db.ref('type').as('type'),
        db.ref('status').as('status'),
        db.ref('first_message_id').as('first_message_id'),
        db.ref('closed_by').as('closed_by'),
        db.ref('closed_at').as('closed_at'),
        db.ref('archived_at').as('archived_at'),
        db.ref('deleted_at').as('deleted_at'),
        db.ref('created_at').as('created_at'),
      )
      .from<UserTickets>('user_tickets')
      .where('user_id', userUniqueId?.id)
      .where('type', 'TRIPSIT')
      .andWhereNot('status', 'CLOSED')
      .andWhereNot('status', 'RESOLVED')
      .first();

    if (ticketData !== undefined) {
      logger.debug(`[${PREFIX}] Target has open ticket!`);
      logger.debug(`[${PREFIX}] ticketData: ${JSON.stringify(ticketData, null, 2)}`);
      await needsHelpmode(interaction, interaction.member as GuildMember);
      let threadHelpUser = {} as ThreadChannel;
      try {
        threadHelpUser = await interaction.guild.channels.fetch(ticketData.thread_id) as ThreadChannel;
      } catch (err) {
        logger.debug(`[${PREFIX}] There was an error updating the help thread, it was likely deleted:\n ${err}`);
      }

      if (threadHelpUser.id) {
        logger.debug(`[${PREFIX}] threadHelpUser: ${threadHelpUser.name} = 💚│${target.displayName}'s channel!`);
        threadHelpUser.setName(`💚│${target.displayName}'s channel!`);

        // Remind the user that they have a channel open

        const message = stripIndents`Hey ${interaction.member}, you have an open session!
  
        Check your channel list or click > '${threadHelpUser.toString()} to get help!`;

        const embed = embedTemplate()
          .setColor(Colors.DarkBlue)
          .setDescription(message);
        interaction.reply({embeds: [embed], ephemeral: true});
        logger.debug(`[${PREFIX}] Rejected need for help`);

        // Send the update message to the thread
        const helpMessage = stripIndents`Hey ${target}, you already have an open session, what's the update?`;

        if (threadHelpUser) {
          threadHelpUser.send({
            content: helpMessage,
            allowedMentions: {
              'parse': showMentions,
            },
          });
        }
        logger.debug(`[${PREFIX}] Pinged user in help thread`);
        return;
      }
    }

    const roleNeedshelpId = interaction.customId.split('~')[1];
    const roleTripsitterId = interaction.customId.split('~')[2];
    const channelTripsittersId = interaction.customId.split('~')[3];

    const modal = new ModalBuilder()
      .setCustomId(`tripsitmeSubmit~${roleNeedshelpId}~${roleTripsitterId}~${channelTripsittersId}~${interaction.id}`)
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

    const filter = (interaction:ModalSubmitInteraction) => interaction.customId.startsWith(`tripsitmeSubmit`);
    interaction.awaitModalSubmit({filter, time: 0})
      .then(async (i) => {
        logger.debug(`[${PREFIX}] i.customId.split('~')[4]: ${i.customId.split('~')[4]}`);
        logger.debug(`[${PREFIX}] interaction.id: ${interaction.id}`);
        if (i.customId.split('~')[4] !== interaction.id) {
          return;
        };

        // Otherwise get the input from the modal, if it was submitted
        const triage = i.fields.getTextInputValue('triageInput');
        const intro = i.fields.getTextInputValue('introInput');

        tripSitMe(i, null, triage, intro);
      });
  }
  if (buttonID.startsWith('tripsitmeFinish')) {
    tripsitmeFinish(interaction);
    return;
  }

  if (buttonID.startsWith('applicationApprove')) {
    applicationApprove(interaction);
    return;
  }
  if (buttonID.startsWith('techHelpOwn')) {
    techHelpOwn(interaction);
    return;
  };
  if (buttonID.startsWith('techHelpClose')) {
    techHelpClose(interaction);
    return;
  };
  if (buttonID.startsWith('techHelpClick')) {
    techHelpClick(interaction);
    return;
  };
  if (buttonID === 'modmailTripsitter') {
    modmailCreate(interaction, 'TRIPSIT');
    return;
  }
  if (buttonID === 'modmailFeedback') {
    modmailCreate(interaction, 'FEEDBACK');
    return;
  }
  if (buttonID === 'modmailTechIssue') {
    modmailCreate(interaction, 'TECH');
    return;
  }
  if (buttonID === 'modmailBanAppeal') {
    modmailCreate(interaction, 'APPEAL');
    return;
  }
  if (buttonID === 'memberbutton') {
    const member = await interaction.guild?.members.fetch(interaction.user.id);
    const memberRole = interaction.guild?.roles.cache.find((role:Role) => role.id === env.ROLE_MEMBER);
    let colorValue = 1;

    logger.debug(`[${PREFIX}] member: ${member?.roles.cache}`);


    logger.debug(`Verified button clicked by ${interaction.user.username}#${interaction.user.discriminator}`);
    const channelTripbotlogs = global.client.channels.cache.get(env.CHANNEL_BOTLOG) as TextChannel;
    channelTripbotlogs.send({
      content: `Verified button clicked by ${interaction.user.username}#${interaction.user.discriminator}`});

    if (member && memberRole) {
      member.roles.add(memberRole);

      // NOTE: Can be simplified with luxon
      const diff = Math.abs(Date.now() - Date.parse(member.user.createdAt.toString()));
      const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365));
      const months = Math.floor(diff / (1000 * 60 * 60 * 24 * 30));
      const weeks = Math.floor(diff / (1000 * 60 * 60 * 24 * 7));
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      // logger.debug(`[${PREFIX}] diff: ${diff}`);
      // logger.debug(`[${PREFIX}] years: ${years}`);
      // logger.debug(`[${PREFIX}] months: ${months}`);
      // logger.debug(`[${PREFIX}] weeks: ${weeks}`);
      // logger.debug(`[${PREFIX}] days: ${days}`);
      // logger.debug(`[${PREFIX}] hours: ${hours}`);
      // logger.debug(`[${PREFIX}] minutes: ${minutes}`);
      // logger.debug(`[${PREFIX}] seconds: ${seconds}`);
      if (years > 0) {
        colorValue = Colors.White;
      } else if (years === 0 && months > 0) {
        colorValue = Colors.Purple;
      } else if (months === 0 && weeks > 0) {
        colorValue = Colors.Blue;
      } else if (weeks === 0 && days > 0) {
        colorValue = Colors.Green;
      } else if (days === 0 && hours > 0) {
        colorValue = Colors.Yellow;
      } else if (hours === 0 && minutes > 0) {
        colorValue = Colors.Orange;
      } else if (minutes === 0 && seconds > 0) {
        colorValue = Colors.Red;
      }
      // logger.debug(`[${PREFIX}] coloValue: ${colorValue}`);
      const channelStart = member.client.channels.cache.get(env.CHANNEL_START.toString());
      const channelTechhelp = member.client.channels.cache.get(env.CHANNEL_HELPDESK);
      const channelBotspam = interaction.client.channels.cache.get(env.CHANNEL_BOTSPAM);
      // const channelTripsit = member.client.channels.cache.get(CHANNEL_TRIPSIT);
      const embed = embedTemplate()
        .setAuthor(null)
        .setColor(colorValue)
        .setThumbnail(member.user.displayAvatarURL())
        .setFooter(null)
        .setDescription(stripIndents`
              **Please welcome ${member.toString()} to the guild!**
              We're glad you're here and hope you enjoy your stay!
              Check out ${channelStart} set your color and icon
              Stay safe, be chill, have fun!`);

      const channelGeneral = member.client.channels.cache.get(env.CHANNEL_GENERAL.toString()) as TextChannel;
      if (channelGeneral) {
        interaction.reply({
          content: stripIndents`
        Awesome! This channel will disappear when you click away, before you go:
        If you want to talk to the team about /anything/ you can start a new thread in ${channelTechhelp}
        Go ahead and test out the bot in the ${channelBotspam} channel!
        Check out ${channelStart} set your color and icon!
        Or go say hi in ${channelGeneral}!
        That's all, have fun!
        `,
          ephemeral: true,
        });
        if (member?.roles.cache.has(memberRole?.id as string)) {
          logger.debug(`[${PREFIX}] Member already has role!`);
          return;
        }
        channelGeneral.send({embeds: [embed]});
      }
    }
  }
  if (buttonID === 'underban') {
    const roleUnderban = interaction.guild?.roles.cache.find(
      (role:Role) => role.id === env.ROLE_UNDERBAN.toString()) as Role;
    (interaction.member?.roles as GuildMemberRoleManager).add(roleUnderban);
  }
  const modChan = interaction.client.channels.cache.get(env.CHANNEL_MODERATORS) as TextChannel;
  if (buttonID === 'acknowledgebtn') {
    const embed = embedTemplate()
      .setColor(Colors.Green)
      .setDescription(`${interaction.user.username} has acknowledged their warning.`);
    if (modChan) {
      modChan.send({embeds: [embed]});
    }
    interaction.reply('Thanks for understanding!');
    return;
  }
  if (buttonID === 'refusalbtn') {
    const guild = interaction.client.guilds.resolve(env.DISCORD_GUILD_ID.toString());
    logger.debug(guild);
    if (guild) {
      guild.members.ban(interaction.user, {deleteMessageDays: 7, reason: 'Refused warning'});
    }
    const embed = embedTemplate()
      .setColor(Colors.Red)
      .setDescription(`${interaction.user.username} has refused their warning and was banned.`);
    modChan.send({embeds: [embed]});
    interaction.reply('Thanks for making this easy!');
    return;
  }
  if (buttonID === 'guildacknowledgebtn') {
    // Get the owner of the client
    await interaction.client?.application?.fetch();
    const botOwner = interaction.client?.application?.owner as User;
    logger.debug(`[${PREFIX}] bot_owner: ${botOwner}`);
    const embed = embedTemplate()
      .setColor(Colors.Green)
      .setDescription(`${interaction.user.username} has acknowledged their warning.`);
    if (botOwner) {
      botOwner.send({embeds: [embed]});
    }
    interaction.reply('Thanks for understanding!');
    return;
  }
  if (buttonID === 'warnbtn') {
    const embed = embedTemplate()
      .setColor(Colors.Red)
      .setDescription(`${interaction.user.username} has refused their warning and was banned.`);
    modChan.send({embeds: [embed]});
    interaction.reply('Thanks for making this easy!');
    return;
  }

  if (!command) return;

  try {
    logger.debug(`[${PREFIX}] Executing command: ${command.name}`);
    command.execute(interaction);
  } catch (error) {
    logger.error(error);
    interaction.reply({content: 'There was an error while executing this command!', ephemeral: true});
  }
  logger.debug(`[${PREFIX}] finished!`);
};
