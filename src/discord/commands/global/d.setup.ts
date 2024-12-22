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
  ButtonStyle, ChannelType, TextInputStyle,
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

const F = f(__filename);

const channelOnly = 'You must run this in the channel you want the prompt to be in!';
const guildOnly = 'You must run this in the guild you want the prompt to be in!';
const noChannel = 'how to tripsit: no channel';
const roleQuestion = 'What role are people applying for?';
const reviewerQuestion = 'What role reviews those applications?';
// const memberError = 'This must be performed by a member of a guild!';

async function help(
  interaction:ChatInputCommandInteraction,
) {
  const tripsitEmbed = embedTemplate()
    .setTitle('How To Setup TripSit Sessions')
    .setDescription(tripsitInfo.tripsitSessionsDesc);

  const applicationsEmbed = embedTemplate()
    .setTitle('How To Setup Applications')
    .setDescription(tripsitInfo.applicationsDesc);

  const techHelpEmbed = embedTemplate()
    .setTitle('How To Setup TechHelp')
    .setDescription(tripsitInfo.techhelpDesc);

  const rulesEmbed = embedTemplate()
    .setTitle('How To Setup  Rules')
    .setDescription(stripIndents`
    **What is a Rules system?**
    This simply posts a series of rules that you may modify to your liking.
    `);

  const ticketboothEmbed = embedTemplate()
    .setTitle('How To Setup Ticketbooth')
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

  const guildPerms = await checkGuildPermissions(interaction.guild, [
    'ManageRoles' as PermissionResolvable,
  ]);
  if (!guildPerms.hasPermission) {
    log.error(F, `Missing guild permission ${guildPerms.permission} in ${interaction.guild}!`);
    await interaction.reply({
      content: stripIndents`Missing ${guildPerms.permission} permission in ${interaction.guild}!
    In order to setup the tripsitting feature I need:
    Manage Roles - In order to take away roles and give them back
    Part of the tripsitting process is to remove all of a user's roles so they can only see the tripsitting channel.
    I then give them back their roles once they're done with the session.
    My role needs to be higher than all other roles you want removed, so put moderators and admins above me in the list!`,
      ephemeral: true,
    });
    return;
  }

  // Can't defer cuz there's a modal
  // await interaction.deferReply({ ephemeral: true });
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
      content: stripIndents`Missing ${channelPerms.permission} permission in ${interaction.channel}!
    In order to setup the tripsitting feature I need:
    View Channel - to see the channel
    Send Messages - to send messages
    Create Private Threads - to create private threads
    Send Messages in Threads - to send messages in threads
    Manage Threads - to delete threads when they're done
    Manage Messages - to pin the "im good" message to the top of the thread
    `,
      ephemeral: true,
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
      content: stripIndents`Missing ${metaPerms.permission} permission in ${metaChannel}!
    In order to setup the tripsitting feature I need:
    View Channel - to see the channel
    Send Messages - to send messages
    Create Private Threads - to create private threads, when requested through the bot
    Send Messages in Threads - to send messages in threads
    Manage Threads - to delete threads when they're done
    `,
      ephemeral: true,
  }); // eslint-disable-line
    return;
  }

  const titleText = '**Need to talk with a TripSitter? Click the button below!**';
  const footerText = '🛑 Please do not message anyone directly! 🛑';
  const modalText = stripIndents`
    **Need mental health support?**
    Check out [Huddle Humans](https://discord.gg/mentalhealth), a mental health universe!

    **Want professional mental health advisors?**
    The [Warmline Directory](https://warmline.org/warmdir.html#directory) provides non-crisis mental health support and guidance from trained volunteers (US Only).

    **Looking for voice chat?**
    The wonderful people at the [Fireside project](https://firesideproject.org) can also help you through a rough trip! (US Only)
  
    **Having an emergency?**
    We're not doctors: If you are in a medical emergency, please contact emergency medical services.

    **Are you suicidal?**
    If you're having suicidal thoughts please contact your [local hotline](https://en.wikipedia.org/wiki/List_of_suicide_crisis_lines).
    `;

  await interaction.showModal(new ModalBuilder()
    .setCustomId(`tripsitmeModal~${interaction.id}`)
    .setTitle('Setup your TripSit room!')
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>()
        .addComponents(
          new TextInputBuilder()
            .setLabel('Title')
            .setValue(stripIndents`${titleText}`)
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setCustomId('titleMessage'),
        ),
      new ActionRowBuilder<TextInputBuilder>()
        .addComponents(
          new TextInputBuilder()
            .setLabel('Intro Message')
            .setValue(stripIndents`${modalText}`)
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
            .setCustomId('introMessage'),
        ),
      new ActionRowBuilder<TextInputBuilder>()
        .addComponents(
          new TextInputBuilder()
            .setLabel('Footer')
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
      await i.deferReply({ ephemeral: true });

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
            .setLabel('I would like to talk to a tripsitter!')
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
      await i.editReply({ content: 'Setup complete!' });
    });
}

async function techhelp(
  interaction:ChatInputCommandInteraction,
) {
  if (!interaction.guild) return;
  if (!interaction.channel) return;
  if (interaction.channel.type !== ChannelType.GuildText) return;

  // Can't defer cuz there's a modal
  // await interaction.deferReply({ ephemeral: true });
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
      content: stripIndents`Missing ${channelPerms.permission} permission in ${interaction.channel}!
    In order to setup the tripsitting feature I need:
    View Channel - to see the channel
    Send Messages - to send messages
    Create Private Threads - to create private threads
    Send Messages in Threads - to send messages in threads
    Manage Threads - to delete threads when they're done
    Manage Messages - to pin the "im good" message to the top of the thread
    `,
      ephemeral: true,
  }); // eslint-disable-line
    return;
  }

  const titleText = `**Welcome to ${interaction.guild.name}'s technical help channel!**`;
  const footerText = '🛑 Please do not message anyone directly! 🛑';
  let modalText = stripIndents`
      This channel can be used to get in contact with the ${interaction.guild.name}'s team for **technical** assistance/feedback!

      **Discord-specific issues, feedback or questions** can be discussed with the team via the **blue🟦button**.

      **Other issues, questions, feedback** can be privately discussed with the team with the **grey button**.
      
      We value your input, no matter how small. Please let us know if you have any questions or feedback!
      
      Thanks for reading, stay safe!
    `;

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
    modalText += `\n\n**If you need psychological help try ${channelTripsit.toString()}!**`;
  }

  await interaction.showModal(new ModalBuilder()
    .setCustomId(`helpdeskModal~${interaction.id}`)
    .setTitle('Setup your HelpDesk room!')
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>()
        .addComponents(
          new TextInputBuilder()
            .setLabel('Title')
            .setValue(stripIndents`${titleText}`)
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setCustomId('titleMessage'),
        ),
      new ActionRowBuilder<TextInputBuilder>()
        .addComponents(
          new TextInputBuilder()
            .setLabel('Intro Message')
            .setValue(stripIndents`${modalText}`)
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
            .setCustomId('introMessage'),
        ),
      new ActionRowBuilder<TextInputBuilder>()
        .addComponents(
          new TextInputBuilder()
            .setLabel('Footer')
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
      await i.deferReply({ ephemeral: true });

      const introMessage = i.fields.getTextInputValue('introMessage');
      const titleMessage = i.fields.getTextInputValue('titleMessage');
      const footerMessage = i.fields.getTextInputValue('footerMessage');

      // Create a new button embed
      const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('techHelpClick~discord')
            .setLabel('Discord issue!')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('techHelpClick~other')
            .setLabel('I have something else!')
            .setStyle(ButtonStyle.Secondary),
        );

      const embed = new EmbedBuilder()
        .setTitle(titleMessage)
        .setFooter({ text: footerMessage })
        .setDescription(introMessage)
        .setColor(Colors.Blue);

      // We need to send the message, otherwise it has the "user used /setup tripsit" at the top
      await (i.channel as TextChannel).send({ embeds: [embed], components: [row] });
      await i.editReply({ content: 'Setup complete!' });
    });
}

async function rules(
  interaction:ChatInputCommandInteraction,
) {
  await interaction.deferReply({ ephemeral: true });
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
  await interaction.deferReply({ ephemeral: true });
  const channelTripsit = await interaction.client.channels.fetch(env.CHANNEL_TRIPSIT) as TextChannel;
  const channelSanctuary = await interaction.client.channels.fetch(env.CHANNEL_SANCTUARY) as TextChannel;
  const channelOpentripsit = await interaction.client.channels.fetch(env.CHANNEL_OPENTRIPSIT1) as TextChannel;
  const channelRules = await interaction.client.channels.fetch(env.CHANNEL_RULES) as TextChannel;

  // **3)** I understand that every room with a :link: is bridged to IRC and there may be lower quality chat in those rooms.

  const buttonText = `
  Welcome to TripSit!

  **If you need help**
  **1** Go to ${channelTripsit.toString()} and click the "I need assistance button"!
  **-** This will create a private thread for you, and we're happy to help :grin:
  **2** If no one responds, you can chat as a group in the ${channelOpentripsit.toString()} rooms
  **-** Try to pick one that's not busy so we can pay attention to you :heart:
  **3** If you don't need help but would appreciate a quiet chat, come to ${channelSanctuary.toString()}

  **If you want to social chat please agree to the following:**

  **1)** I do not currently need help and understand I can go to ${channelTripsit.toString()} to get help if I need it.
  **2)** I understand if no one responds in ${channelTripsit.toString()} I can talk in the "open" tripsit rooms.
  **3)** I have read the ${channelRules.toString()}: I will not buy/sell anything and I will try to keep a positive atmosphere!
  `;

  // Create a new button embed
  const row = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('memberButton')
        .setLabel('I understand where to find help and will follow the rules!')
        .setStyle(ButtonStyle.Success),
    );

  // Create a new button
  await (interaction.channel as TextChannel).send({ content: buttonText, components: [row] });
}

async function helper(
  interaction:ChatInputCommandInteraction,
) {
  await interaction.deferReply({ ephemeral: true });
  if (!interaction.guild) return;
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
      content: stripIndents`This server has not setup the tripsit room. Use \`/setup tripsit\` first`,
    });
    return;
  }

  if (!guildData.role_helper) {
    await interaction.editReply({
      content: stripIndents`This server has not setup the helper role. Use \`/setup tripsit\` first`,
    });
    return;
  }

  const channelTripsit = await interaction.client.channels.fetch(guildData.channel_tripsit) as TextChannel;
  // const channelMetatripsit = await interaction.client.channels.fetch(guildData.channel_tripsitmeta) as TextChannel;

  const messageText = stripIndents`
   ${interaction.guild?.name} is run by volunteers and we're always looking for people who want to help out!
  
  While we do value lived/living experience with drug use it is not required to be an effective Helper: \
as long as you have a general understanding of how drugs work and how hey interact with mental health conditions we do not require a formal education for users interested in taking on the helper role. 
  
  > In order to ensure quality for the participants, we have built a training program that we ask all helpers to complete. Please visit the [Trip Sit Learn](${env.MOODLE_URL}) portal and complete the Intro to Tripsitting course.

  Then use \`/learn link\` to link your Trip Sit Learn account to your Discord account, and once you complete the course you'll get permissions to click the button below.
  
  **While the Helper is not a formal team position, it's a way to signify you want to help out and potentially become a tripsitter.**
  `;

  await (interaction.channel as TextChannel).send({
    // content: messageText,
    embeds: [
      new EmbedBuilder()
        .setTitle(`Interested in helping out in ${channelTripsit}?`)
        .setDescription(messageText)
        .setFooter({ text: 'Once you complete the course, click the button below!' }),
    ],
    components: [
      new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('helperButton')
            .setLabel('I\'ve completed the course and want to be a helper!')
            .setEmoji(emojiGet('Helper').id)
            .setStyle(ButtonStyle.Success),
        ),
    ],
  });

  await interaction.editReply({
    content: 'Done!',
  });
}

export async function helperButton(
  interaction:ButtonInteraction,
) {
  if (!interaction.guild) return;
  if (!interaction.member) return;
  // Check that the user has completed the course and wasnt just given the role

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
      content: stripIndents`This server has not setup the helper role. Use \`/setup tripsit\` first`,
      ephemeral: true,
    });
    return;
  }

  if (!guildData.channel_tripsitmeta) {
    await interaction.reply({
      content: stripIndents`This server has not setup the tripsit meta room. Use \`/setup tripsit\` first`,
      ephemeral: true,
    });
    return;
  }

  const moodleProfile = await profile(interaction.user.id);
  log.debug(F, `Moodle Profile: ${JSON.stringify(moodleProfile, null, 2)}`);
  if (!moodleProfile.fullName) {
    await interaction.reply({
      content: stripIndents`You need to link your Trip Sit Learn account to your Discord account first!
      
      Visit [Trip Sit Learn](<${env.MOODLE_URL}>) to create an account and then use \`/learn link\``,
      ephemeral: true,
    });
    return;
  }

  if (moodleProfile.completedCourses.toString().indexOf('Intro to Tripsitting') === -1) {
    await interaction.reply({
      content: stripIndents`You need to complete the Intro to Tripsitting course first! Visit [Trip Sit Learn](<${env.MOODLE_URL}>)!`,
      ephemeral: true,
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
      content: stripIndents`It looks like the guilds helper role was deleted, talk to the server admin about this! They may need to re-run \`/setup tripsit\``,
      ephemeral: true,
    });
    return;
  }

  // If the role being requested is the Helper or Contributor role, check if they have been banned first
  if (role.id === guildData.role_helper && userData.helper_role_ban) {
    await interaction.editReply({ content: 'Unable to add this role. If you feel this is an error, please talk to the team!' });
    return;
  }

  if (target.roles.cache.has(role.id)) {
    await target.roles.remove(role);
    await interaction.reply({
      content: stripIndents`Your helper role has been removed. If you ever want to re-apply it, just click the button again!`,
      ephemeral: true,
    });
    return;
  }

  if (userHasBeenAHelper && !target.roles.cache.has(role.id)) {
    await target.roles.add(role);
    if (interaction.guild.id === env.DISCORD_GUILD_ID) {
      const channelTripsitters = await interaction.guild?.channels.fetch(env.CHANNEL_TRIPSITTERS) as TextChannel;
      await channelTripsitters.send(stripIndents`${target.displayName} has re-joined as a ${role.name}.`);
    }
    const metaChannel = await interaction.guild?.channels.fetch(guildData.channel_tripsitmeta) as TextChannel;
    await interaction.reply({
      content: stripIndents`Welcome back, go check out ${metaChannel}!`,
      ephemeral: true,
    });
    return;
  }

  const modal = new ModalBuilder()
    .setCustomId(`"ID":"RR","II":"${interaction.id}"`)
    .setTitle(`${role.name} Introduction`)
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId('introduction')
          .setRequired(true)
          .setLabel('Tell us a bit about yourself!')
          .setPlaceholder(`Why do you want to be a ${role.name}? All responses will be sent to the channel!`)
          .setMaxLength(600)
          .setStyle(TextInputStyle.Paragraph),
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId('strengths')
          .setRequired(true)
          .setLabel('What are you good at?')
          .setPlaceholder('What makes you awesome?')
          .setMaxLength(500)
          .setStyle(TextInputStyle.Paragraph),
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId('weaknesses')
          .setRequired(true)
          .setLabel('What about you could be better?')
          .setPlaceholder('No one is perfect <3')
          .setMaxLength(500)
          .setStyle(TextInputStyle.Paragraph),
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId('animal')
          .setRequired(true)
          .setLabel('What is your favorite animal?')
          .setPlaceholder('This is the only question that anyone really cares about, pick carefully!')
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
      await i.deferReply({ ephemeral: true });
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
      await i.editReply({ content: `Added role ${role.name}, go check out ${metaChannel}! If you ever want to remove it, just click the button again.` });

      if (metaChannel.id === guildData.channel_tripsitmeta) {
        const introString = `
        Please welcome ${target.displayName} as a ${role.name}!

        > Intro
        \`\`\`${introMessage}\`\`\`
        > Strengths
        \`\`\`${strengthMessage}\`\`\`
        > Opportunities
        \`\`\`${weaknessMessage}\`\`\`
        > Animal
        \`\`\`${animalMessage}\`\`\`
        
        `;

        log.debug(F, `introString Length: ${introString.length}`);
        const intro = stripIndents`
          Please welcome ${target.displayName} as a ${role.name}!

          > Intro
          \`\`\`${introMessage}\`\`\`
          > Strengths
          \`\`\`${strengthMessage}\`\`\`
          > Opportunities
          \`\`\`${weaknessMessage}\`\`\`
          > Animal
          \`\`\`${animalMessage}\`\`\`
          
          `;
        await metaChannel.send(intro);

        await metaChannel.send(stripIndents`
          Some important information for you ${target}!
          ### For a refresher on tripsitting please see the following resources:

          - [TripSit Learning Portal](https://learn.tripsit.me>)
          - [BlueLight's How To Tripsit](https://docs.google.com/document/d/1vE3jl9imdT3o62nNGn19k5HZVOkECF3jhjra8GkgvwE)
          - [TripSit's How to Tripsit](https://wiki.tripsit.me/wiki/How_To_Tripsit_Online)
          - Check the pins in this channel!
          ### If you're overwhelmed, ask for backup:
          - Giving no information is better than giving the wrong information!
          ### If someone is underage you can ping a Moderator and finish the session if you're comfortable:
          - Underage users can use the web-chat anonymously but are not allowed to socialize, a Moderator will take care of this.
          ### We are NOT here to give medical advice, diagnose, or treat; or handle suicidal or self-harm situations:
          - We're here to give harm reduction facts and *mild* mental health support, no one here is qualified to handle suicide or self-harm.
          - If it seems like someone could use mental health services you can refer them to one of the servers below.
          **Huddle Humans** - [Mental health support](https://discord.gg/mentalhealth)
          **HealthyGamer** - [Mental health with a gaming twist](https://discord.com/invite/H3yRwc7)
    
          **If you have any questions, please reach out!**
        `);
      }
      if (i.guild.id === env.DISCORD_GUILD_ID) {
        const channelTripsitters = await i.guild?.channels.fetch(env.CHANNEL_TRIPSITTERS) as TextChannel;
        const roleTripsitter = await i.guild?.roles.fetch(guildData.role_tripsitter) as Role;

        await channelTripsitters.send(stripIndents`Hey ${roleTripsitter}, ${target.displayName} has joined as a ${role.name}`);
      }
    });
}

export const setup: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Set up various channels and prompts!')
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
      .setName('helper')),
  async execute(interaction:ChatInputCommandInteraction) {
    log.info(F, await commandContext(interaction));
    // We cannot defer because some of the setup commands have modals
    // await interaction.deferReply({ ephemeral: true });

    if (!interaction.channel) {
      log.error(F, noChannel);
      await interaction.reply(channelOnly);
      return false;
    }

    if (!interaction.guild) {
      log.error(F, 'how to tripsit: no guild');
      await interaction.reply(guildOnly);
      return false;
    }

    const command = interaction.options.getSubcommand();
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
