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
  PermissionsBitField,
  CategoryChannel,
} from 'discord.js';
import {
  TextInputStyle,
  // ChannelType,
  ButtonStyle,
  PermissionFlagsBits,
} from 'discord-api-types/v10';
import {embedTemplate} from '../utils/embedTemplate';
import env from '../../global/utils/env.config';
import log from '../../global/utils/log';
import {parse} from 'path';
import {stripIndents} from 'common-tags';
import {startLog} from './startLog';
const PREFIX = parse(__filename).name;

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
 * @param {SelectMenuInteraction} interaction The Client that manages this interaction
 * @return {Promise<void>}
**/
export async function applicationStart(
  interaction: SelectMenuInteraction,
): Promise<void> {
  if (interaction.values[0] === 'none') {
    interaction.reply({content: 'No application selected.', ephemeral: true});
    return;
  };

  startLog(PREFIX, interaction);

  const channelId = interaction.values[0].split('~')[0];
  const roleRequestedId = interaction.values[0].split('~')[1];
  const roleReviewerId = interaction.values[0].split('~')[2];
  log.debug(`[${PREFIX} - applicationStart] channelId: ${channelId}`);
  log.debug(`[${PREFIX} - applicationStart] roleRequestedId: ${roleRequestedId}`);
  log.debug(`[${PREFIX} - applicationStart] roleReviewerId: ${roleReviewerId}`);

  const roleRequested = await interaction.guild?.roles.fetch(roleRequestedId) as Role;
  // const roleReviewer = await interaction.guild?.roles.fetch(roleReviewerId);
  // const channel = await interaction.guild?.channels.fetch(channelId);


  // Create the modal
  const modal = new ModalBuilder()
    .setCustomId(`applicationSubmit~${channelId}~${roleRequestedId}~${roleReviewerId}~${interaction.id}`)
    .setTitle(`${roleRequested.name} Application`);
  modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder()
    .setCustomId('reason')
    .setRequired(true)
    .setLabel('Why do you want to help out?')
    .setPlaceholder('This helps us get to know you a bit before you join the team!')
    .setMaxLength(2000)
    .setStyle(TextInputStyle.Paragraph)));
  modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder()
    .setCustomId('skills')
    .setRequired(true)
    .setLabel('What skills can you bring to the team?')
    .setPlaceholder(`What makes you qualified to be a ${roleRequested.name}? What can you bring to the team?`)
    .setMaxLength(2000)
    .setStyle(TextInputStyle.Paragraph)));
  await interaction.showModal(modal);

  // Collect a modal submit interaction
  const filter = (interaction:ModalSubmitInteraction) => interaction.customId.startsWith(`applicationSubmit`);
  interaction.awaitModalSubmit({filter, time: 0})
    .then(async (i) => {
      if (i.customId.split('~')[4] !== interaction.id) return;
      if (!i.guild) {
        log.debug(`[${PREFIX}] no guild!`);
        i.reply('This must be performed in a guild!');
        return;
      }
      if (!i.member) {
        log.debug(`[${PREFIX}] no member!`);
        i.reply('This must be performed by a member of a guild!');
        return;
      }

      const channelId = i.customId.split('~')[1];
      const roleRequestedId = i.customId.split('~')[2];
      const roleReviewerId = i.customId.split('~')[3];
      const actor = i.member as GuildMember;

      log.debug(`[${PREFIX} - applicationSubmit] channelId: ${channelId}`);
      log.debug(`[${PREFIX} - applicationSubmit] roleRequestedId: ${roleRequestedId}`);
      log.debug(`[${PREFIX} - applicationSubmit] roleReviewerId: ${roleReviewerId}`);

      const roleRequested = await i.guild?.roles.fetch(roleRequestedId) as Role;
      const roleReviewer = await i.guild?.roles.fetch(roleReviewerId) as Role;

      const channel = channelId !== '' ?
        await i.guild.channels.fetch(channelId) as TextChannel :
        i.channel as TextChannel;

      const reason = i.fields.getTextInputValue('reason');
      const skills = i.fields.getTextInputValue('skills');

      const applicationThread = await channel.threads.create({
        name: `💛│${actor.displayName}'s ${roleRequested.name} application!`,
        autoArchiveDuration: 1440,
        type: i.guild?.premiumTier > 2 ? ChannelType.GuildPrivateThread : ChannelType.GuildPublicThread,
        reason: `${actor.displayName} submitted an application!`,
        invitable: env.NODE_ENV === 'production' ? false : undefined,
      }) as ThreadChannel;

      const appEmbed = embedTemplate()
        .setColor(Colors.DarkBlue)
        .setDescription(`**Reason:** ${reason}\n**Skills:** ${skills}`)
        .addFields(
          {
            name: 'Displayname',
            value: `${actor.displayName}`,
            inline: true},
          {
            name: 'Username',
            value: `${i.member.user.username}#${i.member.user.discriminator}`,
            inline: true},
          {
            name: 'ID',
            value: `${i.member.user.id}`,
            inline: true,
          },
        )
        .addFields(
          {
            name: 'Created',
            value: `${time((i.member.user as User).createdAt, 'R')}`,
            inline: true},
        );
      if (actor.joinedAt) {
        appEmbed.addFields(
          {
            name: 'Joined',
            value: `${time(actor.joinedAt, 'R')}`,
            inline: true},
        );
      }

      const approveButton = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`applicationApprove~${actor.id}~${roleRequestedId}`)
          .setLabel('Approve')
          .setStyle(ButtonStyle.Primary),
      );

      const rejectMenu = new ActionRowBuilder<SelectMenuBuilder>().addComponents(
        new SelectMenuBuilder()
          .setCustomId(`applicationReject~${actor.id}~${roleRequestedId}`)
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

      const actorHasRoleDeveloper = actor.permissions.has(PermissionsBitField.Flags.Administrator);
      log.debug(`[${PREFIX}] actorHasRoleDeveloper: ${actorHasRoleDeveloper}`);

      applicationThread.send(`Hey ${actorHasRoleDeveloper ? 'team!' : roleReviewer} there is a new application!`);
      await applicationThread.send({embeds: [appEmbed], components: [approveButton, rejectMenu]})
        .then(async (message) => {
          await message.react('👍');
          await message.react('👎');
        });

      // Respond to the user
      log.debug(`[${PREFIX}] reason: ${reason}`);
      log.debug(`[${PREFIX}] skills: ${skills}`);
      const embed = embedTemplate()
        .setColor(Colors.DarkBlue)
        .setDescription('Thank you for your interest! We will try to get back to you as soon as possible!');
      i.reply({embeds: [embed], ephemeral: true});
    })
    .catch(console.error);
};

/**
 *
 * @param {SelectMenuInteraction} interaction The Client that manages this interaction
 * @return {Promise<void>}
**/
export async function applicationReject(
  interaction: SelectMenuInteraction,
): Promise<void> {
  if (!interaction.guild) {
    interaction.reply('This command can only be used in a server!');
    return;
  }

  startLog(PREFIX, interaction);

  const actor = (interaction.member as GuildMember);
  if (actor.permissions.has(PermissionFlagsBits.ManageRoles)) {
    const memberId = interaction.customId.split('~')[1];
    const roleId = interaction.customId.split('~')[2];

    const target = await interaction.guild?.members.fetch(memberId) as GuildMember;
    const role = await interaction.guild?.roles.fetch(roleId) as Role;

    const rejectionReason = interaction.values[0];
    const rejectionWording = rejectionMessages[rejectionReason as keyof typeof rejectionMessages];
    // interaction.channel!.send(`${(interaction.member as GuildMember).displayName} rejected this application with reason code '${rejectionReason}'`);
    interaction.reply(`${actor.displayName} rejected this application with reason code '${rejectionReason}'`);

    const message = stripIndents`Thank you so much for your interest in helping out here at ${interaction.guild.name}. We review all applications with rigor and deep consideration, and the same was true for yours.
    At this time, the team has decided not to move forward, though your application has been saved and will be pulled as needed in the future unless rescinded.
    
    As we feel you have a right to know, your application was denied because ${rejectionWording}`;

    target.send(stripIndents`${message}`);
    log.debug(`[${PREFIX} - applicationReject] rejectionReason: ${rejectionWording}`);
    (interaction.channel as ThreadChannel).setName(`🖤│${target.displayName}'s ${role.name} application!`);
  } else {
    interaction.reply({content: 'You do not have permission to do that!', ephemeral: true});
  }
};

/**
 *
 * @param {ButtonInteraction} interaction The Client that manages this interaction
 * @return {Promise<void>}
**/
export async function applicationApprove(
  interaction: ButtonInteraction,
): Promise<void> {
  startLog(PREFIX, interaction);
  const actor = (interaction.member as GuildMember);
  if (actor.permissions.has(PermissionFlagsBits.ManageRoles)) {
    // interaction.channel!.send(`${(interaction.member as GuildMember).displayName} accepted this application!`);
    interaction.reply(`${actor.displayName} accepted this application!`);

    const memberId = interaction.customId.split('~')[1];
    const roleId = interaction.customId.split('~')[2];

    const target = await interaction.guild?.members.fetch(memberId) as GuildMember;
    const role = await interaction.guild?.roles.fetch(roleId) as Role;

    (interaction.channel as ThreadChannel).setName(`💚│${target.displayName}'s ${role.name} application1!`);

    log.debug(`[${PREFIX} - applicationAccept] Giving ${target.displayName} ${role.name} role!`);
    target.roles.add(role);

    if (role.id === env.ROLE_HELPER) {
      const channelTripsitMeta = await interaction.guild?.channels.fetch(env.CHANNEL_TRIPSITMETA) as TextChannel;
      const channelTripsit = await interaction.guild?.channels.fetch(env.CHANNEL_TRIPSIT) as TextChannel;
      const hrCategory = await interaction.guild?.channels.fetch(env.CATEGROY_HARMREDUCTIONCENTRE) as CategoryChannel;
      channelTripsitMeta.send(stripIndents`
      Please welcome our newest ${role.name}, ${target}! We're excited to have you here! 
      
      As a ${role.name}, some things have changed:

      - You now have access this this channel, which is used to coordinate with others!

      Please use this room to ask for help if you're overwhelmed, and feel free to make a thread if it gets busy!

      - You are able to receive and respond to help requests in the ${hrCategory}!

      As people need help, a thread will be created in ${channelTripsit}.
      We use the thread in ${channelTripsit} to help the person in need, and talk here to coordinate with the team.
    
      ${channelTripsit} threads are archived after 24 hours, and deleted after 7 days.
    
      For full details on how the ${channelTripsit} works, please see https://discord.tripsit.me/pages/tripsit.html
    
      For a refresher on tripsitting please see the following resources:
      - <https://docs.google.com/document/d/1vE3jl9imdT3o62nNGn19k5HZVOkECF3jhjra8GkgvwE>
      - <https://wiki.tripsit.me/wiki/How_To_Tripsit_Online>

      If you have any questions, please reach out to a moderator or the team lead!
    `);
    }
    if (role.id === env.ROLE_CONSULTANT) {
      const devCategory = await interaction.guild?.channels.fetch(env.CATEGORY_DEVELOPMENT) as CategoryChannel;
      const channelTripcord = await interaction.guild?.channels.fetch(env.CHANNEL_DISCORD) as TextChannel;
      const channelTripbot = await interaction.guild?.channels.fetch(env.CHANNEL_TRIPBOT) as TextChannel;
      const channelTripmobile = await interaction.guild?.channels.fetch(env.CHANNEL_TRIPMOBILE) as TextChannel;
      const channelContent = await interaction.guild?.channels.fetch(env.CHANNEL_WIKICONTENT) as TextChannel;
      const channelDevelopment = await interaction.guild?.channels.fetch(env.CHANNEL_DEVELOPMENT) as TextChannel;
      // const channelIrc = await interaction.guild?.channels.fetch(env.CHANNEL_IRC) as TextChannel;
      // const channelMatrix = await interaction.guild?.channels.fetch(env.CHANNEL_MATRIX) as TextChannel;

      channelDevelopment.send(stripIndents`
      Please welcome our newest ${role.name}, ${target}! We're excited to have you here! 
      
      Our ${devCategory} category holds the projects we're working on.

      > **We encourage you to make a new thread whenever possible!**
      > This allows us to organize our efforts and not lose track of our thoughts!

      TripSit is run by volunteers, so things may be a bit slower than your day job.
      Almost all the code is open source and can be found on our GitHub: <http://github.com/tripsit>
      Discussion of changes happens mostly in the public channels in this category.
      If you have an idea or feedback, make a new thread: we're happy to hear all sorts of input and ideas!

      ${channelTripcord}
      > While this discord has existed for years, TS has only begun to focus on it relatively recently.
      > It is still an ongoing WIP, and this channel is where we coordinate changes to the discord server!
      > Ideas and suggestions are always welcome, and we're always looking to improve the experience!
      > No coding experience is necessary to help make the discord an awesome place to be =)

      ${channelTripbot}
      > Our ombi-bot Tripbot has made it's way into the discord server!
      > This is a somewhat complex bot that is continually growing to meet the needs of TripSit.
      > It also can be added to other servers to provide a subset of harm reduction features to the public

      ${channelTripmobile}
      > Tripsit has a mobile application: <https://play.google.com/store/apps/details?id=me.tripsit.mobile>
      > **We would love react native developers to help out on this project!**
      > We're always looking to improve the mobile experience, and we need testers to help us

      ${channelContent}
      > We have a ton of drug information available online: <https://drugs.tripsit.me>
      > We're always looking to improve our substance information, and we need researchers to help us!
      > If you want to make a change to the wiki, please make a new thread in this category.
      > *Changes to the wiki will only be made after given a credible source!*
    `);
    }
  } else {
    interaction.reply({content: 'You do not have permission to modify roles!', ephemeral: true});
  }
};
