import {
  ActionRowBuilder,
  TextInputBuilder,
  ModalBuilder,
  ButtonInteraction,
  ModalSubmitInteraction,
  TextChannel,
  ButtonBuilder,
  GuildMember,
  ThreadChannel,
} from 'discord.js';
import {
  ChannelType,
  TextInputStyle,
  ButtonStyle,
} from 'discord-api-types/v10';
import {stripIndents} from 'common-tags';
import {embedTemplate} from '../utils/embedTemplate';
import logger from '../../global/utils/logger';
import * as path from 'path';
const PREFIX = path.parse(__filename).name;

/**
 *
 * @param {ButtonInteraction} interaction The interaction that triggered this
 */
export async function techHelpClick(interaction:ButtonInteraction) {
  // logger.debug(`[${PREFIX}] Message: ${JSON.stringify(interaction, null, 2)}!`);

  const issueType = interaction.customId.split('~')[1];
  const roleId = interaction.customId.split('~')[2];

  const role = await interaction.guild?.roles.fetch(roleId)!;

  logger.debug(`[${PREFIX} - applicationStart] issueType: ${issueType}`);
  logger.debug(`[${PREFIX} - applicationStart] role: ${role!.id}`);

  let placeholder = '';
  if (issueType === 'discord') {
    placeholder = `I have an issue with ${interaction.guild!.name}'s discord, can you please help?`;
  } else if (issueType === 'other') {
    placeholder = `I just wanted to say that ${interaction.guild!.name} is super cool and I love it!`;
  }
  // else if (issueType === 'ircConnect') {
  //   placeholder = 'I\'ve been banned on IRC and I dont know why.\nMy nickname is
  // Strongbad and my IP is 192.168.100.200';
  // } else if (issueType === 'ircAppeal') {
  //   placeholder = 'I was a jerk it, wont happen again. My nickname is Strongbad';
  // }
  // Create the modal
  const modal = new ModalBuilder()
      .setCustomId(`techHelpSubmit~${issueType}~${role!.id}`)
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
}

/**
 *
 * @param {ModalSubmitInteraction} interaction The modal that submitted this
 */
export async function techHelpSubmit(interaction:ModalSubmitInteraction) {
  // logger.debug(`[${PREFIX}] interaction: ${JSON.stringify(interaction, null, 2)}!`);

  const issueType = interaction.customId.split('~')[1];
  const roleId = interaction.customId.split('~')[2];

  const roleModerator = await interaction.guild?.roles.fetch(roleId)!;

  logger.debug(`[${PREFIX} - applicationStart] issueType: ${issueType}`);
  logger.debug(`[${PREFIX} - applicationStart] role: ${roleModerator!.id}`);

  // Respond right away cuz the rest of this doesn't matter
  const member = await interaction.guild!.members.fetch(interaction.user.id);
  // logger.debug(`[${PREFIX}] member: ${JSON.stringify(member, null, 2)}!`);
  if (member) {
    // Dont run if the user is on timeout
    if (member.communicationDisabledUntilTimestamp !== null) {
      return member.send(stripIndents`
      Hey!

      Looks like you're on timeout =/

      You can't use the modmail while on timeout.`);
    }
  } else {
    interaction.reply('Thank you, we will respond to right here when we can!');
  }


  // Get whatever they sent in the modal
  const modalInput = interaction.fields.getTextInputValue(`${issueType}IssueInput`);
  logger.debug(`[${PREFIX}] modalInput: ${modalInput}!`);

  // // Get the actor
  const actor = interaction.user;

  // Create a new thread in channel
  const ticketThread = await (interaction.channel as TextChannel).threads.create({
    name: `🧡│${actor.username}'s ${issueType} issue!`,
    autoArchiveDuration: 1440,
    type: interaction.guild!.premiumTier > 2 ? ChannelType.GuildPrivateThread : ChannelType.GuildPublicThread,
    reason: `${actor.username} submitted a(n) ${issueType} issue`,
  });
  logger.debug(`[${PREFIX}] Created meta-thread ${ticketThread.id}`);

  const embed = embedTemplate();
  embed.setDescription(stripIndents`Thank you, check out ${ticketThread} to talk with a team member about your issue!`);
  interaction.reply({embeds: [embed], ephemeral: true});

  const message = stripIndents`
    Hey ${roleModerator}! ${actor} has submitted a new issue:

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

  await ticketThread.send({content: message, components: [techHelpButtons]});
  logger.debug(`[${PREFIX}] Sent intro message to meta-thread ${ticketThread.id}`);
};

/**
 *
 * @param {ButtonInteraction} interaction The button that submitted this
 */
export async function techHelpOwn(interaction:ButtonInteraction) {
  const issueType = interaction.customId.split('~')[1];
  const targetId = interaction.customId.split('~')[2];
  const target = await interaction.guild!.members.fetch(targetId) as GuildMember;

  interaction.reply({content: stripIndents`${(interaction.member! as GuildMember).displayName} has claimed this \
issue and will either help you or figure out how to get you help!`});
  (interaction.channel as ThreadChannel)!.setName(`💛│${target.displayName}'s ${issueType} issue!`);
};

/**
 *
 * @param {ButtonInteraction} interaction The button that submitted this
 */
export async function techHelpClose(interaction:ButtonInteraction) {
  const issueType = interaction.customId.split('~')[1];
  const targetId = interaction.customId.split('~')[2];
  const target = await interaction.guild!.members.fetch(targetId) as GuildMember;

  interaction.reply({content: stripIndents`${(interaction.member! as GuildMember).displayName} has indicated that \
this issue has been resolved!`});
(interaction.channel as ThreadChannel)!.setName(`💚│${target.displayName}'s ${issueType} issue!`);
};

