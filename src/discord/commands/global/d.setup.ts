/* eslint-disable max-len */
import {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ChatInputCommandInteraction,
  TextChannel,
  ModalBuilder,
  TextInputBuilder,
  ModalSubmitInteraction,
  PermissionResolvable,
  Guild,
  Colors,
  EmbedBuilder,
  ButtonInteraction,
  GuildMember,
  Role,
  // CategoryChannel,
} from 'discord.js';
import {
  ButtonStyle, ChannelType, MessageFlags, TextInputStyle,
} from 'discord-api-types/v10';
import { stripIndents } from 'common-tags';
import commandContext from '../../utils/context';
import { SlashCommand } from '../../@types/commandDef';
import { checkChannelPermissions, checkGuildPermissions } from '../../utils/checkPermissions';
import { applicationSetup } from '../../utils/application';
import { paginationEmbed } from '../../utils/pagination';
import { embedTemplate } from '../../utils/embedTemplate';
import { profile } from '../../../global/commands/g.learn';
import tripsitInfo from '../../../global/commands/g.about';
import {
  t, getLocale, getCommandLocalizations, getAvailableLocales,
} from '../../../i18n/index';

const F = f(__filename);

const roleQuestion = 'What role are people applying for?';
const reviewerQuestion = 'What role reviews those applications?';

async function help(
  interaction:ChatInputCommandInteraction,
) {
  const locale = await getLocale(interaction, 'setup');

  const tripsitEmbed = embedTemplate()
    .setTitle(t(locale, 'setup', 'setupTripsitTitle'))
    .setDescription(tripsitInfo.tripsitSessionsDesc);

  const applicationsEmbed = embedTemplate()
    .setTitle(t(locale, 'setup', 'setupApplicationsTitle'))
    .setDescription(tripsitInfo.applicationsDesc);

  const techHelpEmbed = embedTemplate()
    .setTitle(t(locale, 'setup', 'setupTechhelpTitle'))
    .setDescription(tripsitInfo.techhelpDesc);

  const rulesEmbed = embedTemplate()
    .setTitle(t(locale, 'setup', 'setupRulesTitle'))
    .setDescription(t(locale, 'setup', 'setupRulesDescription'));

  const ticketboothEmbed = embedTemplate()
    .setTitle(t(locale, 'setup', 'setupTicketboothTitle'))
    .setDescription(tripsitInfo.ticketboothDesc);

  const book = [
    tripsitEmbed,
    applicationsEmbed,
    techHelpEmbed,
    rulesEmbed,
    ticketboothEmbed,
  ];
  paginationEmbed(interaction, book);
}

async function tripsit(
  interaction:ChatInputCommandInteraction,
) {
  if (!interaction.guild) return;
  if (!interaction.channel) return;
  if (interaction.channel.type !== ChannelType.GuildText) return;

  const locale = await getLocale(interaction, 'setup');

  const guildPerms = await checkGuildPermissions(interaction.guild, [
    'ManageRoles' as PermissionResolvable,
  ]);
  if (!guildPerms.hasPermission) {
    log.error(F, `Missing guild permission ${guildPerms.permission} in ${interaction.guild}!`);
    await interaction.reply({
      content: t(locale, 'setup', 'tripsitMissingGuildPermission', {
        permission: guildPerms.permission,
        guild: interaction.guild,
      }),
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  // Can't defer cuz there's a modal
  // await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  const channelPerms = await checkChannelPermissions(interaction.channel, [
    'ViewChannel' as PermissionResolvable,
    'SendMessages' as PermissionResolvable,
    'SendMessagesInThreads' as PermissionResolvable,
    // 'CreatePublicThreads' as PermissionResolvable,
    'CreatePrivateThreads' as PermissionResolvable,
    'ManageMessages' as PermissionResolvable,
    'ManageThreads' as PermissionResolvable,
    // 'EmbedLinks' as PermissionResolvable,
  ]);
  if (!channelPerms.hasPermission) {
    log.error(F, `Missing TS channel permission ${channelPerms.permission} in ${interaction.channel.name}!`);
    await interaction.reply({
      content: t(locale, 'setup', 'tripsitMissingChannelPermission', {
        permission: channelPerms.permission,
        channel: interaction.channel,
      }),
      flags: MessageFlags.Ephemeral,
  }); // eslint-disable-line
    return;
  }

  const metaChannel = interaction.options.getChannel('metatripsit') as TextChannel;

  const metaPerms = await checkChannelPermissions(metaChannel, [
    'ViewChannel' as PermissionResolvable,
    'SendMessages' as PermissionResolvable,
    'SendMessagesInThreads' as PermissionResolvable,
    // 'CreatePublicThreads' as PermissionResolvable,
    'CreatePrivateThreads' as PermissionResolvable,
    // 'ManageMessages' as PermissionResolvable,
    'ManageThreads' as PermissionResolvable,
    // 'EmbedLinks' as PermissionResolvable,
  ]);
  if (!metaPerms.hasPermission) {
    log.error(F, `Missing TS channel permission ${channelPerms.permission} in ${metaChannel}!`);
    await interaction.reply({
      content: t(locale, 'setup', 'tripsitMissingMetaChannelPermission', {
        permission: metaPerms.permission,
        channel: metaChannel,
      }),
      flags: MessageFlags.Ephemeral,
  }); // eslint-disable-line
    return;
  }

  const titleText = t(locale, 'setup', 'tripsitTitleDefault');
  const footerText = t(locale, 'setup', 'tripsitFooterDefault');
  const modalText = t(locale, 'setup', 'tripsitIntroDefault');

  await interaction.showModal(new ModalBuilder()
    .setCustomId(`tripsitmeModal~${interaction.id}`)
    .setTitle(t(locale, 'setup', 'tripsitModalTitle'))
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>()
        .addComponents(
          new TextInputBuilder()
            .setLabel(t(locale, 'setup', 'tripsitTitleLabel'))
            .setValue(stripIndents`${titleText}`)
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setCustomId('titleMessage'),
        ),
      new ActionRowBuilder<TextInputBuilder>()
        .addComponents(
          new TextInputBuilder()
            .setLabel(t(locale, 'setup', 'tripsitIntroLabel'))
            .setValue(stripIndents`${modalText}`)
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
            .setCustomId('introMessage'),
        ),
      new ActionRowBuilder<TextInputBuilder>()
        .addComponents(
          new TextInputBuilder()
            .setLabel(t(locale, 'setup', 'tripsitFooterLabel'))
            .setValue(stripIndents`${footerText}`)
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setCustomId('footerMessage'),
        ),
    ));

  const filter = (i:ModalSubmitInteraction) => i.customId.startsWith('tripsitmeModal');
  interaction.awaitModalSubmit({ filter, time: 0 })
    .then(async i => {
      if (i.customId.split('~')[1] !== interaction.id) return;
      if (!i.guild) return;
      await i.deferReply({ flags: MessageFlags.Ephemeral });

      const roleNeedshelp = interaction.options.getRole('needshelp');
      const roleTripsitter = interaction.options.getRole('tripsitter');
      const roleHelper = interaction.options.getRole('helper');
      const channelTripsitmeta = interaction.options.getChannel('metatripsit');
      const channelTripsit = interaction.channel as TextChannel;

      const channelSanctuary = interaction.options.getChannel('sanctuary');
      const channelGeneral = interaction.options.getChannel('general');

      // Save this info to the DB
      await db.discord_guilds.update({
        where: {
          id: (interaction.guild as Guild).id,
        },
        data: {
          channel_sanctuary: channelSanctuary ? channelSanctuary.id : null,
          channel_general: channelGeneral ? channelGeneral.id : null,
          channel_tripsitmeta: channelTripsitmeta ? channelTripsitmeta.id : null,
          channel_tripsit: channelTripsit.id,
          role_needshelp: roleNeedshelp ? roleNeedshelp.id : null,
          role_tripsitter: roleTripsitter ? roleTripsitter.id : null,
          role_helper: roleHelper ? roleHelper.id : null,
        },
      });

      const introMessage = i.fields.getTextInputValue('introMessage');
      const titleMessage = i.fields.getTextInputValue('titleMessage');
      const footerMessage = i.fields.getTextInputValue('footerMessage');

      // Create a new button embed
      const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('tripsitmeClick')
            .setLabel(t(locale, 'setup', 'tripsitButtonLabel'))
            .setStyle(ButtonStyle.Primary),
        );

      // This should be an embed so that we can display hyperlinks
      const embed = new EmbedBuilder()
        .setTitle(titleMessage)
        .setFooter({ text: footerMessage })
        .setDescription(introMessage)
        .setColor(Colors.Blue);

      // We need to send the message, otherwise it has the "user used /setup tripsit" at the top
      await (i.channel as TextChannel).send({ embeds: [embed], components: [row] });
      await i.editReply({ content: t(locale, 'setup', 'tripsitSetupComplete') });
    });
}

async function techhelp(
  interaction:ChatInputCommandInteraction,
) {
  if (!interaction.guild) return;
  if (!interaction.channel) return;
  if (interaction.channel.type !== ChannelType.GuildText) return;

  const locale = await getLocale(interaction, 'setup');

  // Can't defer cuz there's a modal
  // await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  const channelPerms = await checkChannelPermissions(interaction.channel, [
    'ViewChannel' as PermissionResolvable,
    'SendMessages' as PermissionResolvable,
    'SendMessagesInThreads' as PermissionResolvable,
    // 'CreatePublicThreads' as PermissionResolvable,
    'CreatePrivateThreads' as PermissionResolvable,
    'ManageMessages' as PermissionResolvable,
    'ManageThreads' as PermissionResolvable,
    // 'EmbedLinks' as PermissionResolvable,
  ]);
  if (!channelPerms.hasPermission) {
    log.error(F, `Missing TS channel permission ${channelPerms.permission} in ${interaction.channel}!`);
    await interaction.reply({
      content: t(locale, 'setup', 'tripsitMissingChannelPermission', {
        permission: channelPerms.permission,
        channel: interaction.channel,
      }),
      flags: MessageFlags.Ephemeral,
  }); // eslint-disable-line
    return;
  }

  const titleText = t(locale, 'setup', 'techhelpTitleDefault', { guildName: interaction.guild.name });
  const footerText = t(locale, 'setup', 'techhelpFooterDefault');
  let modalText = t(locale, 'setup', 'techhelpIntroDefault', { guildName: interaction.guild.name });

  // const guildData = await getGuild(interaction.guild.id);
  const guildData = await db.discord_guilds.update({
    where: {
      id: interaction.guild.id,
    },
    data: {
      role_techhelp: interaction.options.getRole('roletechreviewer', true).id,
    },
  });

  if (guildData.channel_tripsit) {
    const channelTripsit = interaction.guild.channels.fetch(guildData.channel_tripsit);
    modalText += t(locale, 'setup', 'techhelpIntroTripsitAddition', { channelTripsit: channelTripsit.toString() });
  }

  await interaction.showModal(new ModalBuilder()
    .setCustomId(`helpdeskModal~${interaction.id}`)
    .setTitle(t(locale, 'setup', 'techhelpModalTitle'))
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>()
        .addComponents(
          new TextInputBuilder()
            .setLabel(t(locale, 'setup', 'techhelpTitleLabel'))
            .setValue(stripIndents`${titleText}`)
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setCustomId('titleMessage'),
        ),
      new ActionRowBuilder<TextInputBuilder>()
        .addComponents(
          new TextInputBuilder()
            .setLabel(t(locale, 'setup', 'techhelpIntroLabel'))
            .setValue(stripIndents`${modalText}`)
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
            .setCustomId('introMessage'),
        ),
      new ActionRowBuilder<TextInputBuilder>()
        .addComponents(
          new TextInputBuilder()
            .setLabel(t(locale, 'setup', 'techhelpFooterLabel'))
            .setValue(stripIndents`${footerText}`)
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setCustomId('footerMessage'),
        ),
    ));

  const filter = (i:ModalSubmitInteraction) => i.customId.startsWith('helpdeskModal');
  interaction.awaitModalSubmit({ filter, time: 0 })
    .then(async i => {
      if (i.customId.split('~')[1] !== interaction.id) return;
      if (!i.guild) return;
      await i.deferReply({ flags: MessageFlags.Ephemeral });

      const introMessage = i.fields.getTextInputValue('introMessage');
      const titleMessage = i.fields.getTextInputValue('titleMessage');
      const footerMessage = i.fields.getTextInputValue('footerMessage');

      // Create a new button embed
      const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('techHelpClick~discord')
            .setLabel(t(locale, 'setup', 'techhelpDiscordButton'))
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('techHelpClick~other')
            .setLabel(t(locale, 'setup', 'techhelpOtherButton'))
            .setStyle(ButtonStyle.Secondary),
        );

      const embed = new EmbedBuilder()
        .setTitle(titleMessage)
        .setFooter({ text: footerMessage })
        .setDescription(introMessage)
        .setColor(Colors.Blue);

      // We need to send the message, otherwise it has the "user used /setup tripsit" at the top
      await (i.channel as TextChannel).send({ embeds: [embed], components: [row] });
      await i.editReply({ content: t(locale, 'setup', 'techhelpSetupComplete') });
    });
}

async function rules(
  interaction:ChatInputCommandInteraction,
) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  await (interaction.channel as TextChannel).send({
    content: stripIndents`
**By using and remaining connected to this discord you signify your agreement of TripSit's full terms and conditions: https://github.com/TripSit/rules/blob/main/termsofservice.md **
If you do not agree to this policy, do not use this site.
\u200B
 `,
    flags: ['SuppressEmbeds'],
  });

  await (interaction.channel as TextChannel).send({
    content: stripIndents`
    > 🔞 **1. Do not connect to TripSit or use our services if you are under eighteen.**

    > 💞 **2. Do not use TripSit for any purpose or in any manner which could impair any other party's use or enjoyment of this site.**
    > a. Do not post anything considered offensive/upsetting to those in an altered mindset without a spoiler and content warning tag.
    > b. Do not post images with the intent of causing disruption, including flashing imagery, spamming images, or multiple GIFs.
    > c. Do not post pornography (including soft core), gore, depictions of acts of violence, or other offensive content.
    > d. Do not display an offensive profile picture, including pornography of any kind.
    > e. Do not use an offensive nickname or one that could cause anxiety in others, e.g., law enforcement or dictators.
    > f. Do not post content that victimizes, harasses, degrades, or intimidates an individual or group based on race, ethnicity, religion, sexual orientation,  gender identification, drug of choice, level of addiction, mental health status, or other reasons.
    > g. Do not argue rules in public channels.

    > 💊 **3. Do not discuss, request, or post identifying information of websites, online vendors, or real-life people who sell or coordinate the purchase, distribution, or production of substances (legal, clear-net, or otherwise) or cryptocurrencies, i.e., no sourcing.**
    > a. Do not discuss the specifics or go in-depth into the mechanics of online vending.
    > b. Do not show drug packaging to show how a vendor delivered something.
    \u200B
    `,
    flags: ['SuppressEmbeds'],
  });

  await (interaction.channel as TextChannel).send({
    content: stripIndents`
    > 💀 **4. Do not post any content that encourages, promotes, or signifies the intent to engage in harmful practices.**
    > a. Do not encourage substance use. Discourage drug dosages, drug combinations, or any drug experimentation which could be reliably considered unsafe.
    > b. Do not post pictures or videos of drug consumption that glorify substance use, eg, “stash pics” or excessive dosages.
    > c. Do not refuse to follow harm reduction standards, eg, continually engage in destructive behavior or refuse to call EMS when directed.
    > d. Do not post suicide threats; our team is not qualified to manage this situation and will need to refer to Reddit's SuicideWatch community and suicide prevention hotlines by country: https://en.wikipedia.org/wiki/List_of_suicide_crisis_lines
    
    > ❌** 5. Do not post intentionally libellous, defamatory, deceptive, fraudulent, tortious, or inaccurate content, i.e., misinformation.**
    
    > 🥼 **6. Do not post any content that is medical advice or imply that you can give medical advice.**
    > a. Do not use “Dr” or “MD” in your nickname.
    
    > 🔒 **7. Do not post any content that violates another's privacy.**
    > a. Do not post or collect personal information about channel members or doxing.
    > b. Do not post images of people expecting privacy or being unable to consent (children, intoxicated).
    > c. Do not disseminate content originally posted in any team-only areas.
    > d. Do not use network monitoring or discovery software to determine the site architecture or extract information about usage or users.
    \u200B
    `,
    flags: ['SuppressEmbeds'],
  });

  await (interaction.channel as TextChannel).send({
    content: stripIndents`
    > 🔨 **8. Do not post content that bypasses moderation actions, i.e., ban evasion.**
    > a. Do not make multiple/new accounts, change your IP, or do anything else to get around the action.
    
    > 🔗 **9. Do not post any content that links to other communication services, e.g., other discords, matrix servers, etc.**
    
    > 🖼️ **10. Do not post any content that bypasses copyright laws.**
    
    > 💥 **11. Do not intentionally interfere with our services.**
    
    > 💰 **12. Do not use the content on this website for unapproved commercial exploitation.**
    
    > 📋 **13. Any unauthorized use of the Website or its Content is prohibited.**
    `,
    flags: ['SuppressEmbeds'],
  });
}

async function ticketbooth(
  interaction:ChatInputCommandInteraction,
) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  const locale = await getLocale(interaction, 'setup');
  const channelTripsit = await interaction.client.channels.fetch(env.CHANNEL_TRIPSIT) as TextChannel;
  const channelSanctuary = await interaction.client.channels.fetch(env.CHANNEL_SANCTUARY) as TextChannel;
  const channelOpentripsit = await interaction.client.channels.fetch(env.CHANNEL_OPENTRIPSIT1) as TextChannel;
  const channelRules = await interaction.client.channels.fetch(env.CHANNEL_RULES) as TextChannel;

  // **3)** I understand that every room with a :link: is bridged to IRC and there may be lower quality chat in those rooms.

  const buttonText = t(locale, 'setup', 'ticketboothButtonText', {
    channelTripsit: channelTripsit.toString(),
    channelOpentripsit: channelOpentripsit.toString(),
    channelSanctuary: channelSanctuary.toString(),
    channelRules: channelRules.toString(),
  });

  // Create a new button embed
  const row = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('memberButton')
        .setLabel(t(locale, 'setup', 'ticketboothButton'))
        .setStyle(ButtonStyle.Success),
    );

  // Create a new button
  await (interaction.channel as TextChannel).send({ content: buttonText, components: [row] });
}

async function helper(
  interaction:ChatInputCommandInteraction,
) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  if (!interaction.guild) return;
  const locale = await getLocale(interaction, 'setup');

  const guildData = await db.discord_guilds.upsert({
    where: {
      id: interaction.guild?.id,
    },
    create: {
      id: interaction.guild?.id,
    },
    update: {},
  });

  if (!guildData.channel_tripsit || !guildData.channel_tripsitmeta) {
    await interaction.editReply({
      content: t(locale, 'setup', 'helperNotSetup'),
    });
    return;
  }

  if (!guildData.role_helper) {
    await interaction.editReply({
      content: t(locale, 'setup', 'helperRoleNotSetup'),
    });
    return;
  }

  const channelTripsit = await interaction.client.channels.fetch(guildData.channel_tripsit) as TextChannel;
  // const channelMetatripsit = await interaction.client.channels.fetch(guildData.channel_tripsitmeta) as TextChannel;

  const messageText = t(locale, 'setup', 'helperEmbedDescription', {
    guildName: interaction.guild?.name,
    moodleUrl: env.MOODLE_URL,
  });

  await (interaction.channel as TextChannel).send({
    // content: messageText,
    embeds: [
      new EmbedBuilder()
        .setTitle(t(locale, 'setup', 'helperEmbedTitle', { channelTripsit: channelTripsit.toString() }))
        .setDescription(messageText)
        .setFooter({ text: t(locale, 'setup', 'helperEmbedFooter') }),
    ],
    components: [
      new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('helperButton')
            .setLabel(t(locale, 'setup', 'helperButtonLabel'))
            .setEmoji(emojiGet('Helper').id)
            .setStyle(ButtonStyle.Success),
        ),
    ],
  });

  await interaction.editReply({
    content: t(locale, 'setup', 'helperSetupDone'),
  });
}

export async function helperButton(
  interaction:ButtonInteraction,
) {
  if (!interaction.guild) return;
  if (!interaction.member) return;
  // Check that the user has completed the course and wasnt just given the role

  // Get locale from guild data
  let locale = global.env?.LOCALE ?? 'en';
  try {
    const guildData = await global.db.discord_guilds.findUnique({
      where: { id: interaction.guildId! },
      select: { locale: true },
    });
    if (guildData?.locale) locale = guildData.locale;
  } catch {
    // Fall back to default
  }

  const guildData = await db.discord_guilds.upsert({
    where: {
      id: interaction.guild?.id,
    },
    create: {
      id: interaction.guild?.id,
    },
    update: {},
  });

  const userData = await db.users.upsert({
    where: {
      discord_id: interaction.user.id,
    },
    create: {
      discord_id: interaction.user.id,
    },
    update: {},
  });
  const target = interaction.member as GuildMember;

  if (!guildData.role_helper) {
    await interaction.reply({
      content: t(locale, 'setup', 'helperRoleNotSetup'),
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  if (!guildData.channel_tripsitmeta) {
    await interaction.reply({
      content: t(locale, 'setup', 'helperMetaNotSetup'),
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const moodleProfile = await profile(interaction.user.id);
  log.debug(F, `Moodle Profile: ${JSON.stringify(moodleProfile, null, 2)}`);
  if (!moodleProfile.fullName) {
    await interaction.reply({
      content: t(locale, 'setup', 'helperMoodleNotLinked', { moodleUrl: env.MOODLE_URL }),
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  if (moodleProfile.completedCourses.toString().indexOf('Intro to Tripsitting') === -1) {
    await interaction.reply({
      content: t(locale, 'setup', 'helperCourseNotCompleted', { moodleUrl: env.MOODLE_URL }),
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  // Do everything else

  const role = await interaction.guild?.roles.fetch(guildData.role_helper);

  const user = await db.users.findUnique({
    where: {
      discord_id: target.user.id,
    },
  });

  const userHasBeenAHelper = user?.last_was_helper !== null;

  if (!user) {
    log.error(F, `No user found for discord_id: ${target.user.id}`);
    return;
  }

  if (!role) {
    await interaction.reply({
      content: t(locale, 'setup', 'helperRoleDeleted'),
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  // If the role being requested is the Helper or Contributor role, check if they have been banned first
  if (role.id === guildData.role_helper && userData.helper_role_ban) {
    await interaction.editReply({ content: t(locale, 'setup', 'helperRoleBanned') });
    return;
  }

  if (target.roles.cache.has(role.id)) {
    await target.roles.remove(role);
    await interaction.reply({
      content: t(locale, 'setup', 'helperRoleRemoved'),
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  if (userHasBeenAHelper && !target.roles.cache.has(role.id)) {
    await target.roles.add(role);
    if (interaction.guild.id === env.DISCORD_GUILD_ID) {
      const channelTripsitters = await interaction.guild?.channels.fetch(env.CHANNEL_TRIPSITTERS) as TextChannel;
      await channelTripsitters.send(t(locale, 'setup', 'helperRejoinAnnounce', {
        member: target.displayName,
        roleName: role.name,
      }));
    }
    const metaChannel = await interaction.guild?.channels.fetch(guildData.channel_tripsitmeta) as TextChannel;
    await interaction.reply({
      content: t(locale, 'setup', 'helperWelcomeBack', { metaChannel: metaChannel.toString() }),
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const modal = new ModalBuilder()
    .setCustomId(`"ID":"RR","II":"${interaction.id}"`)
    .setTitle(t(locale, 'setup', 'helperModalTitle', { roleName: role.name }))
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId('introduction')
          .setRequired(true)
          .setLabel(t(locale, 'setup', 'helperIntroductionLabel'))
          .setPlaceholder(t(locale, 'setup', 'helperIntroductionPlaceholder', { roleName: role.name }))
          .setMaxLength(600)
          .setStyle(TextInputStyle.Paragraph),
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId('strengths')
          .setRequired(true)
          .setLabel(t(locale, 'setup', 'helperStrengthsLabel'))
          .setPlaceholder(t(locale, 'setup', 'helperStrengthsPlaceholder'))
          .setMaxLength(500)
          .setStyle(TextInputStyle.Paragraph),
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId('weaknesses')
          .setRequired(true)
          .setLabel(t(locale, 'setup', 'helperWeaknessesLabel'))
          .setPlaceholder(t(locale, 'setup', 'helperWeaknessesPlaceholder'))
          .setMaxLength(500)
          .setStyle(TextInputStyle.Paragraph),
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId('animal')
          .setRequired(true)
          .setLabel(t(locale, 'setup', 'helperAnimalLabel'))
          .setPlaceholder(t(locale, 'setup', 'helperAnimalPlaceholder'))
          .setMaxLength(100)
          .setStyle(TextInputStyle.Paragraph),
      ),
    );
  await interaction.showModal(modal);

  // Collect a modal submit interaction
  const filter = (i:ModalSubmitInteraction) => i.customId.startsWith('"ID":"RR"');
  interaction.awaitModalSubmit({ filter, time: 0 })
    .then(async i => {
      // log.debug(F, `${JSON.stringify(i.customId)}`);
      await i.deferReply({ flags: MessageFlags.Ephemeral });
      const {
        II,
      } = JSON.parse(`{${i.customId}}`);
      await (interaction.member as GuildMember).roles.add(role);

      // log.debug(F, `II: ${II}`);

      if (II !== interaction.id) return;
      if (!i.guild) return;
      if (!i.member) return;
      if (!guildData.channel_tripsitmeta) return;
      if (!guildData.channel_tripsit) return;
      if (!guildData.role_tripsitter) return;

      const introMessage = i.fields.getTextInputValue('introduction');
      const strengthMessage = i.fields.getTextInputValue('strengths');
      const weaknessMessage = i.fields.getTextInputValue('weaknesses');
      const animalMessage = i.fields.getTextInputValue('animal');
      // log.debug(F, `introMessage: ${introMessage}`);

      await target.roles.add(role);

      // Update the last date when they were given the helper role
      await db.users.upsert({
        where: {
          discord_id: interaction.user.id,
        },
        create: {
          discord_id: interaction.user.id,
        },
        update: {
          last_was_helper: new Date(),
        },
      });

      const metaChannel = await i.guild?.channels.fetch(guildData.channel_tripsitmeta) as TextChannel;
      await i.editReply({
        content: t(locale, 'setup', 'helperRoleAdded', {
          roleName: role.name,
          metaChannel: metaChannel.toString(),
        }),
      });

      if (metaChannel.id === guildData.channel_tripsitmeta) {
        const introString = `
        ${t(locale, 'setup', 'helperIntroWelcome', {
    memberName: target.displayName,
    roleName: role.name,
  })}

        ${t(locale, 'setup', 'helperIntroHeader')}
        \`\`\`${introMessage}\`\`\`
        ${t(locale, 'setup', 'helperStrengthsHeader')}
        \`\`\`${strengthMessage}\`\`\`
        ${t(locale, 'setup', 'helperOpportunitiesHeader')}
        \`\`\`${weaknessMessage}\`\`\`
        ${t(locale, 'setup', 'helperAnimalHeader')}
        \`\`\`${animalMessage}\`\`\`

        `;

        log.debug(F, `introString Length: ${introString.length}`);
        const intro = stripIndents`
          ${t(locale, 'setup', 'helperIntroWelcome', {
    memberName: target.displayName,
    roleName: role.name,
  })}

          ${t(locale, 'setup', 'helperIntroHeader')}
          \`\`\`${introMessage}\`\`\`
          ${t(locale, 'setup', 'helperStrengthsHeader')}
          \`\`\`${strengthMessage}\`\`\`
          ${t(locale, 'setup', 'helperOpportunitiesHeader')}
          \`\`\`${weaknessMessage}\`\`\`
          ${t(locale, 'setup', 'helperAnimalHeader')}
          \`\`\`${animalMessage}\`\`\`

          `;
        await metaChannel.send(intro);

        await metaChannel.send(t(locale, 'setup', 'helperResourcesMessage', { member: target.toString() }));
      }
      if (i.guild.id === env.DISCORD_GUILD_ID) {
        const channelTripsitters = await i.guild?.channels.fetch(env.CHANNEL_TRIPSITTERS) as TextChannel;
        const roleTripsitter = await i.guild?.roles.fetch(guildData.role_tripsitter) as Role;

        await channelTripsitters.send(t(locale, 'setup', 'helperAnnounceTruly', {
          roleTripsitter: roleTripsitter.toString(),
          member: target.displayName,
          roleName: role.name,
        }));
      }
    });
}

async function localeGet(
  interaction: ChatInputCommandInteraction,
) {
  const locale = await getLocale(interaction, 'setup');
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  const guildData = await db.discord_guilds.findUnique({
    where: { id: interaction.guildId! },
    select: { locale: true },
  });
  if (guildData?.locale) {
    await interaction.editReply({
      content: t(locale, 'setup', 'localeGetReply', { locale: guildData.locale }),
    });
  } else {
    await interaction.editReply({
      content: t(locale, 'setup', 'localeGetReplyDefault'),
    });
  }
}

async function localeSet(
  interaction: ChatInputCommandInteraction,
) {
  const locale = await getLocale(interaction, 'setup');
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  const requestedLocale = interaction.options.getString('locale', true);

  const allValid = getAvailableLocales();

  if (!allValid.includes(requestedLocale)) {
    await interaction.editReply({
      content: t(locale, 'setup', 'localeSetInvalid', {
        locale: requestedLocale,
        available: allValid.join(', '),
      }),
    });
    return;
  }

  await db.discord_guilds.upsert({
    where: { id: interaction.guildId! },
    create: { id: interaction.guildId!, locale: requestedLocale },
    update: { locale: requestedLocale },
  });

  await interaction.editReply({
    content: t(locale, 'setup', 'localeSetReply', { locale: requestedLocale }),
  });
}

export const setup: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Set up various channels and prompts!')
    .setNameLocalizations(getCommandLocalizations('setup', 'commandName'))
    .setDescriptionLocalizations(getCommandLocalizations('setup', 'commandDescription'))
    .setIntegrationTypes([0])
    .addSubcommand(subcommand => subcommand
      .setDescription('Tripsit info!')
      .addRoleOption(option => option
        .setDescription('What is your Tripsitter role?')
        .setName('tripsitter')
        .setRequired(true))
      .addRoleOption(option => option
        .setDescription('What is your Needshelp role?')
        .setName('needshelp')
        .setRequired(true))
      .addChannelOption(option => option
        .setDescription('What is your Meta-tripsit channel?')
        .setName('metatripsit')
        .setRequired(true))
      .addRoleOption(option => option
        .setDescription('What is your Helper role?')
        .setName('helper'))
      .setName('tripsit'))
    .addSubcommand(subcommand => subcommand
      .setDescription('Set up the application post in this channel. 5 roles max!')
      .addChannelOption(option => option
        .setDescription('What channel will have application threads?')
        .setName('applications_channel')
        .setRequired(true))
      .addRoleOption(option => option
        .setDescription(roleQuestion)
        .setName('application_role_a')
        .setRequired(true))
      .addRoleOption(option => option
        .setDescription(reviewerQuestion)
        .setName('application_reviewer_a')
        .setRequired(true))
      .addRoleOption(option => option
        .setDescription(roleQuestion)
        .setName('application_role_b'))
      .addRoleOption(option => option
        .setDescription(reviewerQuestion)
        .setName('application_reviewer_b'))
      .addRoleOption(option => option
        .setDescription(roleQuestion)
        .setName('application_role_c'))
      .addRoleOption(option => option
        .setDescription(reviewerQuestion)
        .setName('application_reviewer_c'))
      .addRoleOption(option => option
        .setDescription(roleQuestion)
        .setName('application_role_d'))
      .addRoleOption(option => option
        .setDescription(reviewerQuestion)
        .setName('application_reviewer_d'))
      .addRoleOption(option => option
        .setDescription(roleQuestion)
        .setName('application_role_e'))
      .addRoleOption(option => option
        .setDescription(reviewerQuestion)
        .setName('application_reviewer_e'))
      .setName('applications'))
    .addSubcommand(subcommand => subcommand
      .setDescription('techhelp info!')
      .addRoleOption(option => option
        .setDescription('What role responds to tickets here?')
        .setName('roletechreviewer')
        .setRequired(true))
      .addChannelOption(option => option
        .setDescription('Do you have a tripsit room?')
        .setName('tripsit'))
      .setName('techhelp'))
    .addSubcommand(subcommand => subcommand
      .setDescription('rules info!')
      .setName('rules'))
    .addSubcommand(subcommand => subcommand
      .setDescription('ticketbooth info!')
      .setName('ticketbooth'))
    .addSubcommand(subcommand => subcommand
      .setDescription('Help on using the setup command!')
      .setName('help'))
    .addSubcommand(subcommand => subcommand
      .setDescription('Info on how to become a helper')
      .setName('helper'))
    .addSubcommandGroup(group => group
      .setName('locale')
      .setDescription(t('en-US', 'setup', 'localeSubgroupDescription'))
      .setDescriptionLocalizations(getCommandLocalizations('setup', 'localeSubgroupDescription'))
      .addSubcommand(sub => sub
        .setName('get')
        .setDescription(t('en-US', 'setup', 'localeGetSubcommand'))
        .setDescriptionLocalizations(getCommandLocalizations('setup', 'localeGetSubcommand')))
      .addSubcommand(sub => sub
        .setName('set')
        .setDescription(t('en-US', 'setup', 'localeSetSubcommand'))
        .setDescriptionLocalizations(getCommandLocalizations('setup', 'localeSetSubcommand'))
        .addStringOption(option => option
          .setName('locale')
          .setDescription(t('en-US', 'setup', 'localeOptionDescription'))
          .setDescriptionLocalizations(getCommandLocalizations('setup', 'localeOptionDescription'))
          .setRequired(true)
          .setAutocomplete(true)))),
  async execute(interaction:ChatInputCommandInteraction) {
    const locale = await getLocale(interaction, 'setup');
    log.info(F, await commandContext(interaction));
    // We cannot defer because some of the setup commands have modals
    // await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    if (!interaction.channel) {
      log.error(F, t(locale, 'setup', 'noChannel'));
      await interaction.reply(t(locale, 'setup', 'channelOnlyError'));
      return false;
    }

    if (!interaction.guild) {
      log.error(F, 'how to tripsit: no guild');
      await interaction.reply(t(locale, 'setup', 'guildOnlyError'));
      return false;
    }

    const subcommandGroup = interaction.options.getSubcommandGroup(false);
    const command = interaction.options.getSubcommand();

    if (subcommandGroup === 'locale') {
      if (command === 'get') await localeGet(interaction);
      else if (command === 'set') await localeSet(interaction);
      return true;
    }

    if (command === 'applications') {
      await applicationSetup(interaction);
    } else if (command === 'techhelp') {
      await techhelp(interaction);
    } else if (command === 'rules') {
      await rules(interaction);
    } else if (command === 'tripsit') {
      await tripsit(interaction);
    } else if (command === 'ticketbooth') {
      await ticketbooth(interaction);
    } else if (command === 'help') {
      await help(interaction);
    } else if (command === 'helper') {
      await helper(interaction);
    }
    return true;
  },
};

export default setup;
