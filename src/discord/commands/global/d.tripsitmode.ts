import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  // ButtonBuilder,
  ModalSubmitInteraction,
  // TextChannel,
  Colors,
  GuildMember,
  Role,
  ThreadChannel,
  ButtonInteraction,
  // Message,
  // MessageReaction,
  // User,
  // ChatInputCommandInteraction,
  PermissionsBitField,
  // TextChannel,
  // MessageFlags,
  // MessageMentionTypes,
  TextInputStyle,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import { TicketStatus, UserTickets } from '../../../global/@types/pgdb';
import {
  db, getGuild, getOpenTicket, getUser,
} from '../../../global/utils/knex';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
// import {embedTemplate} from '../../utils/embedTemplate';
// import {stripIndents} from 'common-tags';
// import env from '../../../global/utils/env.config';
// import log from '../../../global/utils/log';
import { needsHelpmode, tripSitMe, tripsitmeClose } from '../../utils/tripsitme';

const F = f(__filename);

const guildOnly = 'This must be performed in a guild!';
const memberOnly = 'This must be performed by a member of a guild!';

export default tripsitmode;

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

export const tripsitmode: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('tripsitmode')
    .setDescription(
      'This command will apply the NeedsHelp role onto a user, and remove other roles!',
    )
    .addUserOption(option => option
      .setName('user')
      .setDescription('Member to modify')
      .setRequired(true))
    .addStringOption(option => option
      .setName('enable')
      .setDescription('Turn tripsitmode on/off?')
      .addChoices(
        { name: 'On', value: 'on' },
        { name: 'Off', value: 'off' },
      )
      .setRequired(true)),
  async execute(interaction:ChatInputCommandInteraction) {
    startlog(F, interaction);
    const enable = interaction.options.getString('enable') as 'on' | 'off';

    const target = interaction.options.getMember('user') as GuildMember;

    const actorIsAdmin = target.permissions.has(PermissionsBitField.Flags.Administrator);

    // Team check - Cannot be run on team members
    // If this user is a developer then this is a test run and ignore this check,
    // but we'll change the output down below to make it clear this is a test.
    let targetIsTeamMember = false;
    if (!actorIsAdmin) {
      target.roles.cache.forEach(async role => {
        if (teamRoles.includes(role.id)) {
          targetIsTeamMember = true;
        }
      });
      if (targetIsTeamMember) {
        // log.debug(F, `Target is a team member!`);
        const teamMessage = stripIndents`You are a member of the team and cannot be publicly helped!`;
        const embed = embedTemplate()
          .setColor(Colors.DarkBlue)
          .setDescription(teamMessage);
        if (!interaction.replied) {
          await interaction.reply({ embeds: [embed], ephemeral: true });
        }
        return false;
      }
    }

    if (enable === 'on') {
      if (!interaction.guild) {
        // log.debug(F, `no guild!`);
        await interaction.reply(guildOnly);
        return false;
      }
      if (!interaction.member) {
        // log.debug(F, `no member!`);
        await interaction.reply(memberOnly);
        return false;
      }

      // const showMentions = actorIsAdmin ? [] : ['users', 'roles'] as MessageMentionTypes[];

      const userData = await getUser(target.id, null);

      const ticketData = await getOpenTicket(userData.id, null);

      // If the target already has open ticket data
      if (ticketData !== undefined) {
        let threadHelpUser = {} as ThreadChannel;
        // Try to fetch the thread. If that fails, the thread was likely deleted
        try {
          threadHelpUser = await interaction.guild.channels.fetch(ticketData.thread_id) as ThreadChannel;
        } catch (err) {
          // Update the ticket status to closed
          ticketData.status = 'DELETED' as TicketStatus;
          await db<UserTickets>('user_tickets')
            .insert(ticketData)
            .onConflict('id')
            .merge();
        }

        // If a thread exists, re-apply needsHelp, update the thread, remind the user
        if (threadHelpUser.id) {
          await needsHelpmode(interaction, target);
          const guildData = await getGuild(interaction.guild.id);

          const roleTripsitter = guildData.role_tripsitter
            ? await interaction.guild.roles.fetch(guildData.role_tripsitter) as Role
            : undefined;
          const roleHelper = guildData.role_helper
            ? await interaction.guild.roles.fetch(guildData.role_helper) as Role
            : undefined;
          const roleNeedshelp = guildData.role_needshelp
            ? await interaction.guild.roles.fetch(guildData.role_needshelp) as Role
            : undefined;

          // remind the user they have an open thread
          const embed = embedTemplate()
            .setColor(Colors.DarkBlue)
            .setDescription(stripIndents`Hey ${interaction.member}, ${target.displayName} already has an open ticket!
            I've re-applied the ${roleNeedshelp} role to them, and updated the thread.
            Check your channel list or click '${threadHelpUser.toString()} to see!`);
          await interaction.reply({ embeds: [embed], ephemeral: true });
          // log.debug(F, `Rejected need for help`);

          let helpMessage = stripIndents`Hey ${target}, the team thinks you could still use some help, lets continue talking here!`; // eslint-disable-line max-len
          // If the help ticket was created < 5 mins ago, dont re-ping the teanm
          const createdDate = new Date(ticketData.reopened_at ?? ticketData.created_at);
          const now = new Date();
          const diff = now.getTime() - createdDate.getTime();
          const minutes = Math.floor(diff / 1000 / 60);
          if (minutes > 5) {
            const helperStr = `and/or ${roleHelper}`;
            // log.debug(F, `Target has open ticket, and it was created over 5 minutes ago!`);
            helpMessage += `\n\nSomeone from the ${roleTripsitter} ${guildData.role_helper ? helperStr : ''} team will be with you as soon as they're available!`; // eslint-disable-line max-len
          }
          await threadHelpUser.send({
            content: helpMessage,
            // allowedMentions: {
            //   parse: showMentions,
            // },
          });
          // log.debug(F, `Pinged user in help thread`);

          // If the meta thread exists, update the name and ping the team
          if (ticketData.meta_thread_id) {
            let metaMessage = '';
            if (minutes > 5) {
              const helperString = `and/or ${roleHelper}`;
              metaMessage = `Hey ${roleTripsitter} ${guildData.role_helper ?? helperString} team, ${interaction.member} has indicated that ${target.displayName} needs assistance!`; // eslint-disable-line max-len
            } else {
              metaMessage = `${interaction.member} has indicated that ${target.displayName} needs assistance!`;
            }
            const metaThread = await interaction.guild.channels.fetch(ticketData.meta_thread_id) as ThreadChannel;
            await metaThread.send({
              content: metaMessage,
              // allowedMentions: {
              //   parse: showMentions,
              // },
            });
            await metaThread.setName(`💛│${target.displayName}'s discussion!`);
            // log.debug(F, `Pinged team in meta thread!`);
          }
          return true;
        }
      }

      const modal = new ModalBuilder()
        .setCustomId(`tripsitmeSubmit~${interaction.id}`)
        .setTitle('TripSit Mode Activated!');
      modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder()
        .setCustomId('triageInput')
        .setLabel('What substance did they take, etc?')
        .setPlaceholder('This will be posted in the channel for them to see!')
        .setStyle(TextInputStyle.Short)));
      modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder()
        .setCustomId('introInput')
        .setLabel('What\'s going on with them?')
        .setPlaceholder('This will be posted in the channel for them to see!')
        .setStyle(TextInputStyle.Paragraph)));
      await interaction.showModal(modal);

      const filter = (i:ModalSubmitInteraction) => i.customId.startsWith('tripsitmeSubmit');
      await interaction.awaitModalSubmit({ filter, time: 0 })
        .then(async i => {
          if (i.customId.split('~')[1] !== interaction.id) return;
          await i.deferReply({ ephemeral: true });
          const triage = i.fields.getTextInputValue('triageInput');
          const intro = i.fields.getTextInputValue('introInput');

          const threadHelpUser = await tripSitMe(i, target, triage, intro) as ThreadChannel;

          const replyMessage = stripIndents`
          Hey ${i.member}, you activated tripsit mode on ${target.displayName}!
      
          Click here to be taken to their private room: ${threadHelpUser}
      
          You can also click in your channel list to see your private room!`;
          const embed = embedTemplate()
            .setColor(Colors.DarkBlue)
            .setDescription(replyMessage);
          await i.editReply({ embeds: [embed] });
        });
    }
    if (enable === 'off') {
      const testInteraction = {
        client: interaction.client,
        id: interaction.id,
        customId: `tripsitmodeOff~${target.id}`,
        guild: interaction.guild,
        member: interaction.member,
        user: interaction.user,
        channel: interaction.channel,
        deferReply: () => interaction.deferReply(),
        reply: content => {
          if (interaction.deferred || interaction.replied) {
            return interaction.followUp(content);
          }
          return interaction.reply(content);
        },
        editReply: content => interaction.editReply(content),
        followUp: content => interaction.followUp(content),
        showModal: modal => interaction.showModal(modal),
        awaitModalSubmit: params => interaction.awaitModalSubmit(params),
      } as ButtonInteraction;
      tripsitmeClose(testInteraction);
    }
    return true;
  },
};
