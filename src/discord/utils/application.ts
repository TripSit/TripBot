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
  CategoryChannel,
  PermissionResolvable,
  StringSelectMenuBuilder,
  ChatInputCommandInteraction,
  MessageMentionTypes,
  DMChannel,
} from 'discord.js';
import {
  TextInputStyle,
  // ChannelType,
  ButtonStyle,
  PermissionFlagsBits,
} from 'discord-api-types/v10';
import { stripIndents } from 'common-tags';
import { embedTemplate } from './embedTemplate';
import commandContext from './context'; // eslint-disable-line @typescript-eslint/no-unused-vars
import { checkChannelPermissions, checkGuildPermissions } from './checkPermissions';

const F = f(__filename);

// "your application was denied because..."
const rejectionMessages = {
  tooNew: 'your Discord account is too new. Let\'s get to know each other for a while, eh? To be transparent, the minimum account age for our helpers is 1 month(s) (subject to change) for consideration. We will review again in the future.',
  misinformation: 'we have noted a few instances of you, perhaps unintentionally, posting misinformation. Weighing the pros with the cons, we think it would be better to hold off on this pending a better view of how you interact with the primary community. Please ensure that, moving forward, any claims that you present as fact are able to be substantiated with a reputable source of information.',
  discrepancies: 'your application contained some discrepancies with regards to your prior volunteer history, age, exaggerations, or fabrications of involvement in activities mentioned in your application.',
  enabling: 'we have found in your personal user history where you have directly advocated harmful practices. This is easy to do when you get carried away, and we understand that drug use is fun and not always to be taken seriously, but we have reservations for this reason. This can always change, though, over time!',
  demerits: 'in reviewing your file, we found that you have been reprimanded or penalized on the network too many times to consider you for a role that exposes vulnerable users to, at times, no one else but you. Please continue to interact in our network and let us know in a few months if you would like to be reconsidered.',
  blank: 'we do not approve requests to gain this role with a blank or otherwise unhelpful applications. Please consider resubmitting an application in a month or so, and please tell us why you would like to join the team of helpers in a manner that is comprehensive and convincing. At this time, we do not have enough to go on.',
  young: 'we would like for all of our volunteers to be at least 21 years of age in order to participate in this community. Please return when you are of age and submit your application once more. Thank you!',
  identity: 'unfortunately, you did not pass the Stripe identity check. Note that we never get access to your private data when these checks are performed, but the system rarely is wrong and it detected that something was not right about your credentials. Please try again with new documentation that will pass all of the checks required.',
  overstaffed: 'we currently have too many resources of that of that current position and we don\'t want to have a \'too many cooks\' situation. We will keep your application and review again in the near future.',
  exposure: 'you appear not to be so well exposed to drugs and that is very good to hear! Given that this is a peer support community, peers are expected to at least be familiar with the substances in question. To be clear, you should absolutely not go out and take drugs just so you can relate better to our helpers. We are putting this one away for now. We appreciate your willingness to help, but we feel it is not a good fit. First-hand exposure to drug use as a counselor ro a psychiatrist is excusable. We do not require you to take drugs in order to help; we just need you to be familiar with the realities of them.',
  culture: 'we feel, after careful contemplation, that this would be a poor culture fit. Please do not take this personally as we are relatively selective. You may apply again in the near future once we become better acquainted.',
};

export async function applicationPermissions(
  interaction:ChatInputCommandInteraction | SelectMenuInteraction | ButtonInteraction,
  applicationPostChannel: TextChannel | null,
  applicationThreadChannel: TextChannel,
):Promise<boolean> {
  if (!interaction.guild) {
    await interaction.reply({ content: 'This command can only be used in a guild!', ephemeral: true });
    return false;
  }
  if (!interaction.member) {
    // log.debug(F, `no member!`);
    await interaction.reply({ content: 'This must be performed by a member of a guild!', ephemeral: true });
    return false;
  }
  if (!interaction.channel) {
    // log.debug(F, `no member!`);
    await interaction.reply({ content: 'This must be performed inside of a channel!', ephemeral: true });
    return false;
  }
  if (interaction.channel.type !== ChannelType.GuildText) {
    // log.debug(F, `no member!`);
    await interaction.reply({ content: 'This must be performed inside of a text channel!', ephemeral: true });
    return false;
  }

  // Since different interactions use this function, we need each one to supply the channels
  // const applicationPostChannel = interaction.channel;
  // const applicationThreadChannel = interaction.options.getChannel('applications_channel', true);

  // Can't defer cuz there's a modal
  // await interaction.deferReply({ ephemeral: true });

  // Check guild permissions
  const guildPerms = await checkGuildPermissions(interaction.guild, [
    'ManageRoles' as PermissionResolvable,
  ]);
  if (!guildPerms.hasPermission) {
    log.error(F, `Missing TS guild permission ${guildPerms.permission} in ${interaction.guild}!`);
    await interaction.reply({
      content: stripIndents`Missing ${guildPerms.permission} permission in ${interaction.guild}!
    In order to setup the applications feature I need:
    Manage Roles - To give the role when the application is approved!`,
      ephemeral: true,
    });
    return false;
  }

  // Approving or rejecting dont need to check permissions on the post channel
  if (applicationPostChannel) {
    if (applicationThreadChannel.id === applicationPostChannel.id) {
      await interaction.reply({
        content: stripIndents`The application thread channel cannot be the same as the current channel:
        This prevents accidentally adding the user with a @ mention!`,
        ephemeral: true,
      });
      return false;
    }

    if (applicationPostChannel.type !== ChannelType.GuildText) {
      await interaction.reply({
        content: stripIndents`The application thread channel must be a text channel!`,
        ephemeral: true,
      });
      return false;
    }

    // Check channel permissions for the application post
    const channelPerms = await checkChannelPermissions(applicationPostChannel, [
      'ViewChannel' as PermissionResolvable,
      'SendMessages' as PermissionResolvable,
    ]);
    if (!channelPerms.hasPermission) {
      log.error(F, `Missing TS channel permission ${channelPerms.permission} in ${applicationPostChannel}!`);
      await interaction.reply({
        content: stripIndents`Missing ${channelPerms.permission} permission in ${applicationPostChannel}!
    In order to setup the application feature I need:
    View Channel - to see the channel
    Send Messages - to send the application post
    `,
        ephemeral: true,
  }); // eslint-disable-line
      return false;
    }
  }

  // Check channel permissions for the application threads channel
  const metaChannelPerms = await checkChannelPermissions(applicationThreadChannel as TextChannel, [
    'ViewChannel' as PermissionResolvable,
    'SendMessages' as PermissionResolvable,
    'SendMessagesInThreads' as PermissionResolvable,
    // 'CreatePublicThreads' as PermissionResolvable,
    'CreatePrivateThreads' as PermissionResolvable,
    // 'ManageMessages' as PermissionResolvable,
    'ManageThreads' as PermissionResolvable,
  ]);
  if (!metaChannelPerms.hasPermission) {
    log.error(F, `Missing TS channel permission ${metaChannelPerms.permission} in ${applicationThreadChannel}!`);
    await interaction.reply({
      content: stripIndents`Missing ${metaChannelPerms.permission} permission in ${applicationThreadChannel}!
      In order to setup the application feature I need:
      View Channel - to see the channel
      Send Messages - to send the application post
      Send Messages in Threads - to send the application post
      Create Private Threads - to create the application thread
      Manage Threads - to manage the application thread, archiving when the application is approved
      `,
      ephemeral: true,
    }); // eslint-disable-line
    return false;
  }
  return true;
}

export async function applicationSetup(
  interaction:ChatInputCommandInteraction,
) {
  if (!interaction.guild) return;
  if (!interaction.channel) return;
  if (interaction.channel.type !== ChannelType.GuildText) return;
  // Can't defer cuz there's a modal
  // await interaction.deferReply({ ephemeral: true });

  const applicationThreadChannel = interaction.options.getChannel('applications_channel', true);

  if (!await applicationPermissions(
    interaction,
    interaction.channel,
    applicationThreadChannel as TextChannel,
  )) return;

  await interaction.showModal(new ModalBuilder()
    .setCustomId(`appModal~${interaction.id}`)
    .setTitle('Tripsitter Help Request')
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>()
        .addComponents(
          new TextInputBuilder()
            .setCustomId('applicationText')
            .setLabel('What wording do you want to appear?')
            .setStyle(TextInputStyle.Paragraph)
            .setValue(stripIndents`
              **Interested in helping out?**

              This channel allows you to apply for positions here at ${interaction.guild.name}!

              We want people who love ${interaction.guild.name}, want to contribute to its growth, and be part of our success!

              Click the button below, fill in the application, give us at least 24 hours to review, and we'll get back to you as soon as possible!
            `),
        ),
    ));

  const filter = (i:ModalSubmitInteraction) => i.customId.startsWith('appModal');
  interaction.awaitModalSubmit({ filter, time: 0 })
    .then(async i => {
      if (i.customId.split('~')[1] !== interaction.id) return;
      await i.deferReply({ ephemeral: true });

      await db.discord_guilds.upsert({
        where: {
          id: i.guild?.id as string,
        },
        create: {
          id: i.guild?.id as string,
          channel_applications: applicationThreadChannel.id,
        },
        update: { channel_applications: applicationThreadChannel.id },
      });

      const roleRequestedA = interaction.options.getRole('application_role_a');
      const roleReviewerA = interaction.options.getRole('application_reviewer_a');
      const roleRequestedB = interaction.options.getRole('application_role_b');
      const roleReviewerB = interaction.options.getRole('application_reviewer_b');
      const roleRequestedC = interaction.options.getRole('application_role_c');
      const roleReviewerC = interaction.options.getRole('application_reviewer_c');
      const roleRequestedD = interaction.options.getRole('application_role_d');
      const roleReviewerD = interaction.options.getRole('application_reviewer_d');
      const roleRequestedE = interaction.options.getRole('application_role_e');
      const roleReviewerE = interaction.options.getRole('application_reviewer_e');

      const roleArray = [
        [roleRequestedA, roleReviewerA],
        [roleRequestedB, roleReviewerB],
        [roleRequestedC, roleReviewerC],
        [roleRequestedD, roleReviewerD],
        [roleRequestedE, roleReviewerE],
      ];
      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('applicationRoleSelectMenu')
        .setPlaceholder('Select role here!')
        .setMaxValues(1);
      selectMenu.addOptions(
        {
          label: 'Select role here!',
          value: 'none',
        },
      );
      roleArray.forEach(async role => {
        if (role[0]) {
          if (role[1]) {
          // log.debug(F, `role: ${role[0].name}`);
            selectMenu.addOptions(
              {
                label: role[0].name,
                value: `${role[0].id}~${role[1].id}`,
              },
            );
          } else {
            await i.reply('Error: You must provide both a role and a reviewer role!');
          }
        }
      });

      await (i.channel as TextChannel).send(
        {
          content: stripIndents`${i.fields.getTextInputValue('applicationText')}`,
          components: [new ActionRowBuilder<StringSelectMenuBuilder>()
            .addComponents(selectMenu)],
        },
      );
      await i.editReply({ content: 'Donezo!' });
    });
}

export async function applicationStart(
  interaction: SelectMenuInteraction,
): Promise<void> {
  log.info(F, await commandContext(interaction));
  if (interaction.values[0] === 'none') {
    await interaction.reply({
      content: 'No application selected.',
      ephemeral: true,
    });
    return;
  }
  if (!interaction.guild) return;
  if (!interaction.channel) return;

  // Get the application channel from the db
  const guildData = await db.discord_guilds.upsert({
    where: {
      id: interaction.guild.id,
    },
    create: {
      id: interaction.guild.id,
    },
    update: {},
  });

  const channelApplicationsId = guildData.channel_applications;

  if (!channelApplicationsId) {
    await interaction.reply({
      content: 'The applications channel has not been set up yet!',
      ephemeral: true,
    });
    return;
  }

  const channelApplications = await interaction.guild.channels.fetch(channelApplicationsId) as TextChannel;

  if (!await applicationPermissions(
    interaction,
    interaction.channel as TextChannel,
    channelApplications,
  )) return;

  const roleRequestedId = interaction.values[0].split('~')[0];
  const roleReviewerId = interaction.values[0].split('~')[1];
  const roleRequested = await interaction.guild?.roles.fetch(roleRequestedId) as Role;
  const roleReviewer = await interaction.guild?.roles.fetch(roleReviewerId) as Role;
  log.debug(F, `roleRequested: ${roleRequested.name}`);
  log.debug(F, `roleReviewer: ${roleReviewer.name}`);

  await interaction.showModal(new ModalBuilder()
    .setCustomId(`applicationSubmit~${interaction.id}`)
    .setTitle(`${roleRequested.name} Application`)
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>()
        .addComponents(new TextInputBuilder()
          .setCustomId('reason')
          .setRequired(true)
          .setLabel('Why do you want to help out?')
          .setPlaceholder('This helps us get to know you a bit before you join the team!')
          .setMaxLength(2000)
          .setStyle(TextInputStyle.Paragraph)),
      new ActionRowBuilder<TextInputBuilder>()
        .addComponents(new TextInputBuilder()
          .setCustomId('skills')
          .setRequired(true)
          .setLabel('What skills can you bring to the team?')
          .setPlaceholder(`What makes you qualified to be a ${roleRequested.name}? What can you bring to the team?`)
          .setMaxLength(2000)
          .setStyle(TextInputStyle.Paragraph)),
    ));

  // Collect a modal submit interaction
  const filter = (i:ModalSubmitInteraction) => i.customId.startsWith('applicationSubmit');
  interaction.awaitModalSubmit({ filter, time: 0 })
    .then(async i => {
      if (i.customId.split('~')[1] !== interaction.id) return;
      await i.deferReply({ ephemeral: true });

      if (!i.member) return;

      const actor = i.member as GuildMember;

      const reason = i.fields.getTextInputValue('reason');
      log.debug(F, `reason.length: ${reason.length}`);
      const skills = i.fields.getTextInputValue('skills');
      log.debug(F, `skills.length: ${skills.length}`);

      const applicationThread = await channelApplications.threads.create({
        name: `💛│${actor.displayName}'s ${roleRequested.name} application!`,
        autoArchiveDuration: 1440,
        type: ChannelType.PrivateThread,
        reason: `${actor.displayName} submitted an application!`,
        invitable: false,
      });

      let columns = 1;
      const appEmbed = embedTemplate()
        .setAuthor(null)
        .setFooter(null)
        .setColor(Colors.DarkBlue)
        .setDescription(stripIndents`
          **Reason** 
          ${reason}
          **Skills**
          ${skills}
          `)
        .addFields(
          {
            name: 'Displayname',
            value: `${actor.displayName}`,
            inline: true,
          },
          {
            name: 'Username',
            value: `${i.member.user.username}#${i.member.user.discriminator}`,
            inline: true,
          },
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
            inline: true,
          },
        );
      if (actor.joinedAt) {
        columns = 2;
        appEmbed.addFields(
          {
            name: 'Joined',
            value: `${time(actor.joinedAt, 'R')}`,
            inline: true,
          },
        );
      }

      appEmbed.addFields({ name: '\u200B', value: '\u200B', inline: true });

      if (columns === 1) {
        appEmbed.addFields({ name: '\u200B', value: '\u200B', inline: true });
      }

      const approveButton = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`applicationApprove~${actor.id}~${roleRequestedId}`)
          .setLabel('Approve')
          .setStyle(ButtonStyle.Primary),
      );

      const rejectMenu = new ActionRowBuilder<SelectMenuBuilder>().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(`applicationReject~${actor.id}~${roleRequestedId}`)
          .setPlaceholder('Select rejection reason')
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

      // const actorHasRoleDeveloper = actor.permissions.has(PermissionsBitField.Flags.Administrator);
      // log.debug(F, `actorHasRoleDeveloper: ${actorHasRoleDeveloper}`);

      await applicationThread.send(`Hey ${roleReviewer} there is a new ${roleRequested.name} application from ${actor.displayName}!`);
      await applicationThread.send({
        embeds: [appEmbed],
        components: [approveButton, rejectMenu],
        allowedMentions: {
          // parse: showMentions,
          parse: ['roles'] as MessageMentionTypes[],
        },
      })
        .then(async message => {
          await message.react(emojiGet('ts_thumbup'));
          await message.react(emojiGet('ts_thumbdown').id);
        });

      // Respond to the user
      // log.debug(F, `reason: ${reason}`);
      // log.debug(F, `skills: ${skills}`);
      const embed = embedTemplate()
        .setColor(Colors.DarkBlue)
        .setDescription('Thank you for your interest! We will try to get back to you as soon as possible!');
      await i.editReply({ embeds: [embed] });
    });
}

export async function applicationReject(
  interaction: SelectMenuInteraction,
): Promise<void> {
  log.info(F, await commandContext(interaction));
  if (!interaction.guild) return;
  if (!interaction.channel) return;
  if (!interaction.member) return;

  if (!await applicationPermissions(
    interaction,
    null,
    interaction.channel as TextChannel,
  )) return;

  await interaction.deferReply({ ephemeral: false });

  const threadCreated = interaction.channel.createdAt;
  // Check if the thread was created in the last 24 hours
  if (threadCreated && threadCreated.getTime() > Date.now() - 86400000) {
    // log.debug(F, `Thread created in the last 24 hours!`);
    await interaction.editReply({ content: 'Whoa there, please give the team at least 24 until the next day to act on this application!' });
    return;
  }

  const actor = (interaction.member as GuildMember);

  if (!actor.permissions.has(PermissionFlagsBits.ManageRoles)) {
    await interaction.editReply({ content: 'You do not have the Manage Roles permission!' });
    return;
  }

  const memberId = interaction.customId.split('~')[1];
  const roleId = interaction.customId.split('~')[2];

  let target: GuildMember;
  try {
    target = await interaction.guild.members.fetch(memberId);
  } catch (e) {
    await interaction.editReply({ content: 'Could not find target, are the still in the guild?' });
    return;
  }

  let role: Role | null;
  try {
    role = await interaction.guild?.roles.fetch(roleId);
  } catch (e) {
    await interaction.editReply({ content: 'Could not find role, has it been deleted?' });
    return;
  }

  if (!role) {
    await interaction.editReply({ content: 'Could not find role, has it been deleted?' });
    return;
  }

  const rejectionReason = interaction.values[0];
  const rejectionWording = rejectionMessages[rejectionReason as keyof typeof rejectionMessages];
  // interaction.channel!.send(`${(interaction.member as GuildMember).displayName} rejected this application with reason code '${rejectionReason}'`);
  await interaction.editReply(`${actor.displayName} rejected this application with reason code '${rejectionReason}'`);

  const message = stripIndents`Thank you so much for your interest in helping out here at ${interaction.guild.name}. We review all applications with rigor and deep consideration, and the same was true for yours.
  At this time, the team has decided not to move forward, though your application has been saved and will be pulled as needed in the future unless rescinded.
  
  As we feel you have a right to know, your application was denied because ${rejectionWording}`;

  await target.send(stripIndents`${message}`);
  // log.debug(`[${PREFIX} - applicationReject] rejectionReason: ${rejectionWording}`);
  (interaction.channel as ThreadChannel).setName(`🖤│${target.displayName}'s ${role.name} application!`);
}

export async function applicationApprove(
  interaction: ButtonInteraction,
): Promise<void> {
  log.info(F, await commandContext(interaction));
  if (!interaction.guild) return;
  if (!interaction.channel) return;
  if (!interaction.member) return;
  const actor = (interaction.member as GuildMember);

  if (!await applicationPermissions(
    interaction,
    null,
    interaction.channel as TextChannel,
  )) return;

  await interaction.deferReply({ ephemeral: true });

  if (!actor.permissions.has(PermissionFlagsBits.ManageRoles)) {
    await interaction.editReply({
      content: 'You do not have permission to modify roles!',
    });
  }

  const threadCreated = interaction.channel?.createdAt;
  // Check if the thread was created in the last 24 hours
  if (threadCreated && threadCreated.getTime() > Date.now() - 86400000) {
    // log.debug(F, `Thread created in the last 24 hours!`);
    await interaction.editReply({
      content: 'Whoa there, please give the team at least 24 until the next day to act on this application!',
    });
    return;
  }

  const myMember = interaction.guild.members.me as GuildMember;
  const myRole = myMember.roles.highest;

  const roleId = interaction.customId.split('~')[2];
  const role = await interaction.guild?.roles.fetch(roleId) as Role;

  const memberId = interaction.customId.split('~')[1];
  const target = await interaction.guild?.members.fetch(memberId);

  if (role.comparePositionTo(myRole) > 0) {
    await interaction.editReply({
      content: `I do not have permission to add the ${role.name} role to ${target.displayName}!`,
    });
    return;
    // log.debug(F, `Adding role ${role.name} to ${target.displayName}`);
  }

  // Give the user the role
  target.roles.add(role);

  // Send this message outside the ephemeral response
  if (interaction.channel instanceof TextChannel || interaction.channel instanceof DMChannel) {
    interaction.channel.send(stripIndents`
    ${(interaction.member as GuildMember).displayName} accepted this application!
    Please send a message to ${target} welcoming them to their new role!
    `);
  }

  // Change the channel name
  (interaction.channel as ThreadChannel).setName(`💚│${target.displayName}'s ${role.name} application1!`);

  if (role.id === env.ROLE_HELPER) {
    const channelTripsitmeta = await interaction.guild?.channels.fetch(env.CHANNEL_TRIPSITMETA) as TextChannel;
    const channelTripsit = await interaction.guild?.channels.fetch(env.CHANNEL_TRIPSIT) as TextChannel;
    const hrCategory = await interaction.guild?.channels.fetch(env.CATEGORY_HARMREDUCTIONCENTRE) as CategoryChannel;
    await channelTripsitmeta.send(stripIndents`
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
  if (role.id === env.ROLE_CONTRIBUTOR) {
    const devCategory = await interaction.guild?.channels.fetch(env.CATEGORY_DEVELOPMENT) as CategoryChannel;
    const channelTripcord = await interaction.guild?.channels.fetch(env.CHANNEL_DISCORD) as TextChannel;
    const channelTripbot = await interaction.guild?.channels.fetch(env.CHANNEL_TRIPBOT) as TextChannel;
    const channelTripmobile = await interaction.guild?.channels.fetch(env.CHANNEL_TRIPMOBILE) as TextChannel;
    const channelContent = await interaction.guild?.channels.fetch(env.CHANNEL_WIKICONTENT) as TextChannel;
    const channelDevelopment = await interaction.guild?.channels.fetch(env.CHANNEL_DEVELOPMENT) as TextChannel;
    // const channelIrc = await interaction.guild?.channels.fetch(env.CHANNEL_IRC) as TextChannel;
    // const channelMatrix = await interaction.guild?.channels.fetch(env.CHANNEL_MATRIX) as TextChannel;

    await channelDevelopment.send(stripIndents`
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
      > Our homemade Tripbot has made it's way into the discord server!
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
  await interaction.editReply('Done!');
}
