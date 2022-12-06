import {
  ActionRowBuilder,
  TextInputBuilder,
  ModalBuilder,
  ButtonInteraction,
  TextChannel,
  ButtonBuilder,
  GuildMember,
  ThreadChannel,
  ModalSubmitInteraction,
} from 'discord.js';
import {
  ChannelType,
  TextInputStyle,
  ButtonStyle,
} from 'discord-api-types/v10';
import { stripIndents } from 'common-tags';
import { parse } from 'path';
import { embedTemplate } from './embedTemplate';
import log from '../../global/utils/log';
import { getGuild } from '../../global/utils/knex';

const PREFIX = parse(__filename).name;

const guildOnly = 'This command can only be used in a guild!';

/**
 *
 * @param {ButtonInteraction} interaction The interaction that triggered this
 */
export async function techHelpClick(interaction:ButtonInteraction) {
  // log.debug(`[${PREFIX}] Message: ${JSON.stringify(interaction, null, 2)}!`);
  if (!interaction.guild) {
    interaction.reply({
      content: guildOnly,
      ephemeral: true,
    });
    return;
  }

  const issueType = interaction.customId.split('~')[1];

  const guildData = await getGuild(interaction.guild.id);

  if (!guildData) {
    log.error(`[${PREFIX} - techHelpClick] guild not found: ${interaction.guild.id}`);
    interaction.reply({
      content: 'The Guild provided could not be found!',
      ephemeral: true,
    });
    return;
  }

  if (!guildData.role_techhelp) {
    log.error(`[${PREFIX} - techHelpClick] techhelp role not found: ${interaction.guild.id}`);
    interaction.reply({
      content: 'The role provided could not be found!',
      ephemeral: true,
    });
    return;
  }

  const roleTechreview = interaction.guild.roles.cache.get(guildData.role_techhelp);

  if (!roleTechreview) {
    log.error(`[${PREFIX} - techHelpClick] roleTechreview not found: ${interaction.guild.id}`);
    interaction.reply({
      content: 'The role provided could not be found!',
      ephemeral: true,
    });
    return;
  }

  // log.debug(`[${PREFIX} - techHelpClick] issueType: ${issueType}`);
  // log.debug(`[${PREFIX} - techHelpClick] role: ${role.id}`);

  let placeholder = '';
  if (issueType === 'discord') {
    placeholder = `I have an issue with ${interaction.guild.name}'s discord, can you please help?`;
  } else if (issueType === 'other') {
    placeholder = `I just wanted to say that ${interaction.guild.name} is super cool and I love it!`;
  }
  // else if (issueType === 'ircConnect') {
  //   placeholder = 'I\'ve been banned on IRC and I dont know why.\nMy nickname is
  // Strongbad and my IP is 192.168.100.200';
  // } else if (issueType === 'ircAppeal') {
  //   placeholder = 'I was a jerk it, wont happen again. My nickname is Strongbad';
  // }
  // Create the modal
  const modal = new ModalBuilder()
    .setCustomId(`techHelpSubmit~${interaction.id}`)
    .setTitle('TripSit Feedback');
  const timeoutReason = new TextInputBuilder()
    .setLabel('What is your issue? Be super detailed!')
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder(placeholder)
    .setCustomId(`${issueType}IssueInput`)
    .setRequired(true);
  // An action row only holds one text input, so you need one action row per text input.
  const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(timeoutReason);
  // Add inputs to the modal
  modal.addComponents(firstActionRow);
  // Show the modal to the user
  await interaction.showModal(modal);

  const filter = (i:ModalSubmitInteraction) => i.customId.includes('techHelpSubmit');
  interaction.awaitModalSubmit({ filter, time: 150000 })
    .then(async i => {
      if (i.customId.split('~')[1] !== interaction.id) return;

      if (!i.guild) {
        interaction.reply({
          content: guildOnly,
          ephemeral: true,
        });
        return;
      }

      // Respond right away cuz the rest of this doesn't matter
      const member = await i.guild.members.fetch(i.user.id);
      // log.debug(`[${PREFIX}] member: ${JSON.stringify(member, null, 2)}!`);
      if (member) {
        // Dont run if the user is on timeout
        if (member.communicationDisabledUntilTimestamp !== null) {
          await member.send(stripIndents`
          Hey!
    
          Looks like you're on timeout =/
    
          You can't use the modmail while on timeout.`);
          return;
        }
      } else {
        i.reply('Thank you, we will respond to right here when we can!');
      }

      // Get whatever they sent in the modal
      const modalInput = i.fields.getTextInputValue(`${issueType}IssueInput`);
      // log.debug(`[${PREFIX}] modalInput: ${modalInput}!`);

      // // Get the actor
      const actor = i.user;

      // Create a new thread in channel
      const ticketThread = await (i.channel as TextChannel).threads.create({
        name: `🧡│${actor.username}'s ${issueType} issue!`,
        autoArchiveDuration: 1440,
        type: i.guild.premiumTier > 2 ? ChannelType.GuildPrivateThread : ChannelType.GuildPublicThread,
        reason: `${actor.username} submitted a(n) ${issueType} issue`,
      });
      // log.debug(`[${PREFIX}] Created meta-thread ${ticketThread.id}`);

      const embed = embedTemplate();
      embed.setDescription(
        stripIndents`Thank you, check out ${ticketThread} to talk with a team member about your issue!`,
      );
      i.reply({ embeds: [embed], ephemeral: true });

      const message = stripIndents`
        Hey ${roleTechreview}! ${actor} has submitted a new issue:
    
        > ${modalInput}
    
        Please look into it and respond to them in this thread!`;

      const techHelpButtons = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`techHelpOwn~${issueType}~${actor.id}`)
            .setLabel('Own this issue!')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId(`techHelpClose~${issueType}~${actor.id}`)
            .setLabel('Close this issue!')
            .setStyle(ButtonStyle.Success),
        );

      await ticketThread.send({ content: message, components: [techHelpButtons] });
    // log.debug(`[${PREFIX}] Sent intro message to meta-thread ${ticketThread.id}`);
    });
}

/**
 *
 * @param {ButtonInteraction} interaction The button that submitted this
 */
export async function techHelpOwn(interaction:ButtonInteraction) {
  if (!interaction.guild) {
    interaction.reply({
      content: guildOnly,
      ephemeral: true,
    });
    return;
  }
  const issueType = interaction.customId.split('~')[1];
  const targetId = interaction.customId.split('~')[2];
  const target = await interaction.guild.members.fetch(targetId) as GuildMember;

  interaction.reply({
    content: stripIndents`${(interaction.member as GuildMember).displayName} has claimed this \
issue and will either help you or figure out how to get you help!`,
  });
  (interaction.channel as ThreadChannel).setName(`💛│${target.displayName}'s ${issueType} issue!`);
}

/**
 *
 * @param {ButtonInteraction} interaction The button that submitted this
 */
export async function techHelpClose(interaction:ButtonInteraction) {
  if (!interaction.guild) {
    interaction.reply({
      content: guildOnly,
      ephemeral: true,
    });
    return;
  }
  const issueType = interaction.customId.split('~')[1];
  const targetId = interaction.customId.split('~')[2];
  const target = await interaction.guild.members.fetch(targetId) as GuildMember;

  interaction.reply({
    content: stripIndents`${(interaction.member as GuildMember).displayName} has indicated that \
this issue has been resolved!`,
  });
  (interaction.channel as ThreadChannel).setName(`💚│${target.displayName}'s ${issueType} issue!`);
}
