/* eslint-disable max-len */

import {
  ButtonInteraction,
  ModalSubmitInteraction,
  ModalBuilder,
  ActionRowBuilder,
  TextInputBuilder,
  Colors,
  TextChannel,
  GuildMember,
  ChannelType,
  ThreadChannel,
  time,
  User,
  ButtonBuilder,
  SelectMenuBuilder,
  SelectMenuInteraction,
  Role,
} from 'discord.js';
import {
  TextInputStyle,
  // ChannelType,
  ButtonStyle,
  PermissionFlagsBits,
} from 'discord-api-types/v10';
import {embedTemplate} from '../utils/embedTemplate';
import env from '../../global/utils/env.config';
import logger from '../../global/utils/logger';
import * as path from 'path';
import {stripIndents} from 'common-tags';
const PREFIX = path.parse(__filename).name;

// "your application was denied because..."
const rejectionMessages = {
  'tooNew': `your Discord account is too new. Let's get to know each other for a while, eh? To be transparent, the minimum account age for our helpers is 1 month(s) (subject to change) for consideration. We will review again in the future.`,
  'misinformation': `we have noted a few instances of you, perhaps unintinetinally, posting misinformation. Weighing the pros with the cons, we think it would be better to hold off on this pending a better view of how you interact with the primary community. Please ensure that, moving forward, any claims that you present as fact are able to be substantiated with a reputable source of information.`,
  'discrepancies': `your application contained some discrepancies with regards to your prior volunteer history, age, exaggerations, or fabrications of involvement in activities mentioned in your application.`,
  'enabling': `we have found in your personal user history where you have directly advocated harmful practices. This is easy to do when you get carried away, and we understand that drug use is fun and not always to be taken seriously, but we have reservations for this reason. This can always change, though, over time!`,
  'demerits': `in reviewing your file, we found that you have been reprimanded or penalized on the network too many times to consider you for a role that exposes vulnerable users to, at times, no one else but you. Please continue to interact in our network and let us know in a few months if you would like to be reconsidered.`,
  'blank': `we do not approve requests to gain this role with a blank or otherwise unhelpful applications. Please consider resubmitting an application in a month or so, and please tell us why you would like to join the team of helpers in a manner that is comprehensive and convincing. At this time, we do not have enough to go on.`,
  'young': `we would like for all of our volunteers to be at least 21 years of age in order to participate in this community. Please return when you are of age and submit your application once more. Thank you!`,
  'identity': `unfortunately, you did not pass the Stripe identity check. Note that we never get access to your private data when these checks are performed, but the system rarely is wrong and it detected that something was not right about your credentials. Please try again with new documentation that will pass all of the checks required.`,
  'overstaffed': `we currently have too many resources of that of that current position and we don't want to have a 'too many cooks' situation. We will keep your application and review again in the near future.`,
  'exposure': `you appear not to be so well exposed to drugs and that is very good to hear! Given that this is a peer support community, peers are expected to at least be familiar with the substances in question. To be clear, you should absolutely not go out and take drugs just so you can relate better to our helpers. We are putting this one away for now. We appreciate your willingness to help, but we feel it is not a good fit. First-hand exposure to drug use as a counselor ro a psychiatrist is excusable. We do not require you to take drugs in order to help; we just need you to be familiar with the realities of them.`,
  'culture': `we feel, after careful contemplation, that this would be a poor culture fit. Please do not take this personally as we are relatively selective. You may apply again in the near future once we become better acquainted.`,
};

/**
 *
 * @param {ButtonInteraction} interaction The Client that manages this interaction
 * @return {Promise<void>}
**/
export async function applicationStart(
    interaction: ButtonInteraction,
): Promise<void> {
  logger.debug(`[${PREFIX} - applicationStart] starting!`);
  logger.debug(`[${PREFIX} - applicationStart] customId: ${interaction.customId}`);

  const channelId = interaction.customId.split('~')[1];
  const roleId = interaction.customId.split('~')[2];

  const role = await interaction.guild?.roles.fetch(roleId);

  logger.debug(`[${PREFIX} - applicationStart] channelId: ${channelId}`);
  logger.debug(`[${PREFIX} - applicationStart] roleId: ${roleId}`);

  // Create the modal
  const modal = new ModalBuilder()
      .setCustomId(`applicationSubmit~${channelId}~${roleId}`)
      .setTitle(`${role!.name} Application`);
  modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder()
      .setCustomId('reason')
      .setLabel('Why do you want to help out?')
      .setPlaceholder('This helps us get to know you a bit before you join the team!')
      .setStyle(TextInputStyle.Paragraph)));
  modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder()
      .setCustomId('skills')
      .setLabel('What skills can you bring to the team?')
      .setPlaceholder(`What makes you qualified to be a ${role!.name}? What can you bring to the team?`)
      .setStyle(TextInputStyle.Paragraph)));
  await interaction.showModal(modal);
  logger.debug(`[${PREFIX}] finished!`);
};

/**
 *
 * @param {ModalSubmitInteraction} interaction The Client that manages this interaction
 * @return {Promise<void>}
**/
export async function applicationSubmit(
    interaction: ModalSubmitInteraction,
): Promise<void> {
  logger.debug(`[${PREFIX}] starting!`);

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

  const channelId = interaction.customId.split('~')[1];
  const roleId = interaction.customId.split('~')[2];

  logger.debug(`[${PREFIX} - applicationStart] channelId: ${channelId}`);
  logger.debug(`[${PREFIX} - applicationStart] roleId: ${roleId}`);

  const role = await interaction.guild?.roles.fetch(roleId) as Role;
  const channel = channelId !== '' ?
    await interaction.guild.channels.fetch(channelId) as TextChannel :
    interaction.channel as TextChannel;

  const reason = (interaction as ModalSubmitInteraction).fields.getTextInputValue('reason');
  const skills = (interaction as ModalSubmitInteraction).fields.getTextInputValue('skills');

  const applicationThread = await channel.threads.create({
    name: `${(interaction.member as GuildMember).displayName}'s ${role.name} application!`,
    autoArchiveDuration: 1440,
    type: env.NODE_ENV === 'production' ? ChannelType.GuildPrivateThread : ChannelType.GuildPublicThread,
    reason: `${(interaction.member as GuildMember).displayName} submitted an application!`,
    invitable: env.NODE_ENV === 'production' ? false : undefined,
  }) as ThreadChannel;

  const appEmbed = embedTemplate()
      .setColor(Colors.DarkBlue)
      .addFields(
          {
            name: 'Displayname',
            value: `${(interaction.member as GuildMember).displayName}`,
            inline: true},
          {
            name: 'Username',
            value: `${interaction.member.user.username}#${interaction.member.user.discriminator}`,
            inline: true},
          {
            name: 'ID',
            value: `${interaction.member.user.id}`,
            inline: true,
          },
      )
      .addFields(
          {
            name: 'Created',
            value: `${time((interaction.member.user as User).createdAt, 'R')}`,
            inline: true},
          {
            name: 'Joined',
            value: `${time((interaction.member as GuildMember).joinedAt!, 'R')}`,
            inline: true},
      )
      .addFields(
          {name: 'Reason', value: reason, inline: false},
          {name: 'Skills', value: skills, inline: false},
      );

  const approveButton = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
          .setCustomId(`applicationApprove~${(interaction.member as GuildMember).id}~${roleId}`)
          .setLabel('Approve')
          .setStyle(ButtonStyle.Primary),
  );

  const rejectMenu = new ActionRowBuilder<SelectMenuBuilder>().addComponents(
      new SelectMenuBuilder()
          .setCustomId(`applicationReject~${(interaction.member as GuildMember).id}`)
          .addOptions(
              {
                label: 'Generic Rejection',
                value: 'generic',
                description: 'No specific reason, try not to use this one',
              },
              {
                label: 'Discord Account Too New',
                value: 'tooNew',
                description: 'Their Discord account was created too recently',
              },
              {
                label: 'Recent History of Misinformation',
                value: 'misinformation',
                description: 'They have a history of spreading misinformation',
              },
              {
                label: 'Discrepancies in Application',
                value: 'discrepancies',
                description: 'They have provided false/misleading information in their application',
              },
              {
                label: 'Recent History of Enabling Poor Choices',
                value: 'enabling',
                description: 'They have a history of enabling poor choices',
              },
              {
                label: 'History of Demerits on Account',
                value: 'demerits',
                description: 'They have a history of demerits on their account',
              },
              {
                label: 'Blank or Unhelpful Application',
                value: 'blank',
                description: 'They have provided a blank or unhelpful application',
              },
              {
                label: 'Too Young',
                value: 'young',
                description: 'They are too young to be a part of the team',
              },
              {
                label: 'Failed Identity Check',
                value: 'identity',
                description: 'They failed the identity check',
              },
              {
                label: 'Currently Overstaffed for Area of Interest',
                value: 'overstaffed',
                description: 'We are currently overstaffed for their area of interest',
              },
              {
                label: 'Low Exposure to Drugs or Drug Use',
                value: 'exposure',
                description: 'They have low exposure to drugs or drug use',
              },
              {
                label: 'Miscellaneous / Potentially Bad Fit',
                value: 'culture',
                description: 'They are a potential bad fit for our culture',
              },
          ),
  );

  applicationThread.send({embeds: [appEmbed], components: [approveButton, rejectMenu]});

  // Respond to the user
  logger.debug(`[${PREFIX}] reason: ${reason}`);
  logger.debug(`[${PREFIX}] skills: ${skills}`);
  const embed = embedTemplate()
      .setColor(Colors.DarkBlue)
      .setDescription('Thank you for your interest! We will try to get back to you as soon as possible!');
  interaction.reply({embeds: [embed], ephemeral: true});
  logger.debug(`[${PREFIX}] finished!`);
};

/**
 *
 * @param {SelectMenuInteraction} interaction The Client that manages this interaction
 * @return {Promise<void>}
**/
export async function applicationReject(
    interaction: SelectMenuInteraction,
): Promise<void> {
  // logger.debug(`[${PREFIX} - applicationReject] starting!`);
  const actor = (interaction.member as GuildMember);

  const memberId = interaction.customId.split('~')[1];
  // const roleId = interaction.customId.split('~')[2];

  const target = await interaction.guild?.members.fetch(memberId) as GuildMember;

  if (actor.permissions.has(PermissionFlagsBits.ManageRoles)) {
    const rejectionReason = interaction.values[0];
    const rejectionWording = rejectionMessages[rejectionReason as keyof typeof rejectionMessages];
    // interaction.channel!.send(`${(interaction.member as GuildMember).displayName} rejected this application with reason code '${rejectionReason}'`);
    interaction.reply(`${actor.displayName} rejected this application with reason code '${rejectionReason}'`);

    const message = stripIndents`Thank you so much for your interest in helping out here at ${interaction.guild!.name}. We review all applications with rigor and deep consideration, and the same was true for yours.
    At this time, the team has decided not to move forward, though your application has been saved and will be pulled as needed in the future unless rescinded.
    
    As we feel you have a right to know, your application was denied because ${rejectionWording}`;

    target.send(stripIndents`${message}`);
    logger.debug(`[${PREFIX} - applicationReject] rejectionReason: ${rejectionWording}`);
  } else {
    interaction.reply({content: 'You do not have permission to do that!', ephemeral: true});
  }
  // logger.debug(`[${PREFIX} - applicationReject] finished!`);
};

/**
 *
 * @param {ButtonInteraction} interaction The Client that manages this interaction
 * @return {Promise<void>}
**/
export async function applicationApprove(
    interaction: ButtonInteraction,
): Promise<void> {
  // logger.debug(`[${PREFIX} - applicationAccept] starting!`);
  const actor = (interaction.member as GuildMember);
  if (actor.permissions.has(PermissionFlagsBits.ManageRoles)) {
    // interaction.channel!.send(`${(interaction.member as GuildMember).displayName} accepted this application!`);
    interaction.reply(`${actor.displayName} accepted this application!`);

    const memberId = interaction.customId.split('~')[1];
    const roleId = interaction.customId.split('~')[2];

    const target = await interaction.guild?.members.fetch(memberId) as GuildMember;
    const role = await interaction.guild?.roles.fetch(roleId) as Role;

    logger.debug(`[${PREFIX} - applicationAccept] Giving ${target.displayName} ${role.name} role!`);

    target.roles.add(role);
  } else {
    interaction.reply({content: 'You do not have permission to do that!', ephemeral: true});
  }
  // logger.debug(`[${PREFIX} - applicationAccept] finished!`);
};
