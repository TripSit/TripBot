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
  StringSelectMenuBuilder,
  Guild,
  Colors,
  EmbedBuilder,
  // InteractionEditReplyOptions,
  // GuildMember,
} from 'discord.js';
import {
  ButtonStyle, ChannelType, TextInputStyle,
} from 'discord-api-types/v10';
import { stripIndent, stripIndents } from 'common-tags';
import { getGuild, guildUpdate } from '../../../global/utils/knex';
import { startLog } from '../../utils/startLog';
import { SlashCommand } from '../../@types/commandDef';
import { checkChannelPermissions } from '../../utils/checkPermissions';
// import { DiscordGuilds } from '../../../global/@types/database';

const F = f(__filename);

const channelOnly = 'You must run this in the channel you want the prompt to be in!';
const guildOnly = 'You must run this in the guild you want the prompt to be in!';
const noChannel = 'how to tripsit: no channel';
const roleQuestion = 'What role are people applying for?';
const reviewerQuestion = 'What role reviews those applications?';

export const prompt: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Set up various channels and prompts!')
    .addSubcommand(subcommand => subcommand
      .setDescription('Tripsit info!')
      .setName('tripsit')
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
      // .addChannelOption((option) => option
      //   .setDescription('Do you have a sanctuary room?')
      //   .setName('sanctuary'),
      // )
      // .addChannelOption((option) => option
      //   .setDescription('Do you have a general room?')
      //   .setName('general'),
      // )
      .addRoleOption(option => option
        .setDescription('What is your Helper role?')
        .setName('helper')))
    .addSubcommand(subcommand => subcommand
      .setDescription('Set up the application page. 5 roles max!')
      .setName('applications')
      .addChannelOption(option => option
        .setDescription('What channel stores applications?')
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
        .setName('application_reviewer_e')))
    .addSubcommand(subcommand => subcommand
      .setDescription('techhelp info!')
      .setName('techhelp')
      .addRoleOption(option => option
        .setDescription('What role responds to tickets here?')
        .setName('roletechreviewer')
        .setRequired(true))
      .addChannelOption(option => option
        .setDescription('Do you have a tripsit room?')
        .setName('tripsit')))
    .addSubcommand(subcommand => subcommand
      .setDescription('rules info!')
      .setName('rules'))
    .addSubcommand(subcommand => subcommand
      .setDescription('starthere info!')
      .setName('starthere'))
    // .addSubcommand(subcommand => subcommand
    //   .setDescription('mindset reaction roles!')
    //   .setName('mindset'))
    // .addSubcommand(subcommand => subcommand
    //   .setDescription('color reaction roles')
    //   .setName('color'))
    .addSubcommand(subcommand => subcommand
      .setDescription('ticketbooth info!')
      .setName('ticketbooth')),
  // .addSubcommand(subcommand => subcommand
  //   .setDescription('pronoun picker!')
  //   .setName('pronouns'))
  // .addSubcommand(subcommand => subcommand
  //   .setDescription('donor color setup')
  //   .setName('premiumcolors')),
  async execute(interaction:ChatInputCommandInteraction) {
    startLog(F, interaction);
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
      await applications(interaction);
    } else if (command === 'techhelp') {
      await techhelp(interaction);
    } else if (command === 'rules') {
      await rules(interaction);
    } else if (command === 'starthere') {
      await starthere(interaction);
    } else if (command === 'tripsit') {
      await tripsit(interaction);
    } else if (command === 'ticketbooth') {
      await ticketbooth(interaction);
    }
    return true;
  },
};

export async function tripsit(
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
    // 'ManageMessages' as PermissionResolvable,
    'ManageThreads' as PermissionResolvable,
    // 'EmbedLinks' as PermissionResolvable,
  ]);
  if (!channelPerms.hasPermission) {
    log.error(F, `Missing TS channel permission ${channelPerms.permission} in ${interaction.channel}!`);
    await interaction.editReply({
      content: stripIndents`Missing permissions in ${interaction.channel}!
    In order to setup the tripsitting feature I need:
    View Channel - to see the channel
    Send Messages - to send messages
    Create Private Threads - to create private threads
    Send Messages in Threads - to send messages in threads
    Manage Threads - to delete threads when they're done
    `}); // eslint-disable-line
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
    await interaction.editReply({
      content: stripIndents`Missing permissions in ${metaChannel}!
    In order to setup the tripsitting feature I need:
    View Channel - to see the channel
    Send Messages - to send messages
    Create Private Threads - to create private threads, when requested through the bot
    Send Messages in Threads - to send messages in threads
    Manage Threads - to delete threads when they're done
    `}); // eslint-disable-line
    return;
  }

  const channelSanctuary = interaction.options.getChannel('sanctuary');
  const channelGeneral = interaction.options.getChannel('general');

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

      const guildData = await getGuild((interaction.guild as Guild).id);

      guildData.id = (interaction.guild as Guild).id;
      guildData.channel_sanctuary = channelSanctuary ? channelSanctuary.id : null;
      guildData.channel_general = channelGeneral ? channelGeneral.id : null;
      guildData.channel_tripsitmeta = channelTripsitmeta ? channelTripsitmeta.id : null;
      guildData.channel_tripsit = channelTripsit.id;
      guildData.role_needshelp = roleNeedshelp ? roleNeedshelp.id : null;
      guildData.role_tripsitter = roleTripsitter ? roleTripsitter.id : null;
      guildData.role_helper = roleHelper ? roleHelper.id : null;

      // Save this info to the DB

      await guildUpdate(guildData);

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

export async function applications(interaction:ChatInputCommandInteraction) {
  if (!await checkChannelPermissions(
    (interaction.channel as TextChannel),
    [
      'ViewChannel' as PermissionResolvable,
      'SendMessages' as PermissionResolvable,
      'CreatePrivateThreads' as PermissionResolvable,
      'CreatePublicThreads' as PermissionResolvable,
      'SendMessagesInThreads' as PermissionResolvable,
      'EmbedLinks' as PermissionResolvable,
    ],
  )) {
    // log.debug(F, `bot does NOT has permission to post in ${interaction.channel}!`);
    return;
  }

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
            .setValue(stripIndent`
              **Interested in helping out?**

              Welcome to ${interaction.channel}! This channel allows you to apply for intern positions here at ${(interaction.guild as Guild).name}!

              We want people who love ${(interaction.guild as Guild).name}, want to contribute to its growth, and be part of our success!

              We currently have two positions open:

              * Helper
              * Contributor

              **These are not formal roles, but rather a way to get access to the rooms to help out and prove you want to be a part of the org!**
              
              Both positions require that you have a short tenure on the org: 
              While we appreciate the interest you should familiarize yourself with the culture before applying! 
              If you have not been here that long please chat and get to know people before applying again (at least two weeks)!
              
              The **Helper** role is for people who want to help out in the tripsitting rooms.
              As long as you have a general understanding of how drugs work and how hey interact with mental health conditions we do not require a formal education for users interested in taking on the helper role. 
              While we do value lived/living experience with drug use it is not required to be an effective helper!
              
              The **Contributor** role is for people who want to help out in the back-end with development or other organizational work.
              You don't need to code, but you should have some experience with the org and be able to contribute to the org in some way.
              We appreciate all types of help: Not just coders, but anyone who wants to give input or test out new features!

              If you want to help out with ${(interaction.guild as Guild).name}, please click the button below to fill out the application form.
            `),
        ),
    ));

  const filter = (i:ModalSubmitInteraction) => i.customId.startsWith('appModal');
  interaction.awaitModalSubmit({ filter, time: 0 })
    .then(async i => {
      if (i.customId.split('~')[1] !== interaction.id) return;
      await i.deferReply({ ephemeral: true });

      const channelApplications = interaction.options.getChannel('applications_channel', true);
      const guildData = await getGuild((interaction.guild as Guild).id);
      guildData.id = (interaction.guild as Guild).id;
      guildData.channel_applications = channelApplications.id;

      // Save this info to the DB
      await guildUpdate(guildData);

      /* eslint-disable no-unused-vars */
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

export async function techhelp(interaction:ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });
  if (!await checkChannelPermissions(
    (interaction.channel as TextChannel),
    [
      'ViewChannel' as PermissionResolvable,
      'SendMessages' as PermissionResolvable,
      'CreatePrivateThreads' as PermissionResolvable,
      'CreatePublicThreads' as PermissionResolvable,
      'SendMessagesInThreads' as PermissionResolvable,
      'EmbedLinks' as PermissionResolvable,
    ],
  )) {
    // log.debug(`${PREFIX} bot does NOT has permission to post in !`);
    return;
  }

  const guildData = await getGuild((interaction.guild as Guild).id);

  guildData.id = (interaction.guild as Guild).id;
  guildData.role_techhelp = interaction.options.getRole('roletechreviewer', true).id;

  // Save this info to the DB
  await guildUpdate(guildData);

  let text = stripIndents`
    Welcome to ${(interaction.guild as Guild).name}'s technical help channel!

    This channel can be used to get in contact with the ${(interaction.guild as Guild).name}'s team for **technical** assistance/feedback!`;

  const channelTripsit = interaction.options.getChannel('tripsit');
  if (channelTripsit) {
    text += `\n\n**If you need psychological help try ${channelTripsit.toString()}!**`;
  }
  text += `\n\n**Discord-specific issues, feedback or questions** can be discussed with the team via the **blue🟦button**.

**Other issues, questions, feedback** can be privately discussed with the team with the **grey button**.

We value your input, no matter how small. Please let us know if you have any questions or feedback!

Thanks for reading, stay safe!
  `;

  // Get the moderator role
  // const roleModerator = interaction.options.getRole('moderator') as Role;

  // Create buttons
  const row = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('techHelpClick~discord')
        .setLabel('Discord issue/feedback!')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('techHelpClick~other')
        .setLabel('I have something else!')
        .setStyle(ButtonStyle.Secondary),
    );

  // Create a new button
  await (interaction.channel as TextChannel).send({ content: text, components: [row] });
}

export async function rules(interaction:ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });
  await (interaction.channel as TextChannel).send({
    content: `
**By using and remaining connected to this discord you signify your agreement of TripSit's full terms and conditions: https://github.com/TripSit/rules/blob/main/termsofservice.md **
If you do not agree to this policy, do not use this site.
 \n 
 `,
    flags: ['SuppressEmbeds'],
  });

  await (interaction.channel as TextChannel).send({
    content: `
    \u200B
    > 🔞 **1. Do not connect to TripSit or use our services if you are under eighteen.**

    > 💞 **2. Do not use TripSit for any purpose or in any manner which could impair any other party's use or enjoyment of this site.**
    > a. Do not post anything considered offensive/upsetting to those in an altered mindset without a spoiler and content warning tag.
    > b. Do not post images with the intent of causing disruption, including flashing imagery, spamming images, or multiple GIFs.
    > c. Do not post pornography (including soft core), gore, depictions of acts of violence, or other offensive content.
    > d. Do not display an offensive profile picture, including pornography of any kind.
    > e. Do not use an offensive nickname or one that could cause anxiety in others, e.g., law enforcement or dictators.
    > f. Do not post content that victimizes, harasses, degrades, or intimidates an individual or group based on race, ethnicity, religion, sexual orientation,  gender identification, drug of choice, level of addiction, mental health status, or other reasons.
    
    > 💊 **3. Do not discuss, request, or post identifying information of websites, online vendors, or real-life people who sell or coordinate the purchase, distribution, or production of substances (legal, clear-net, or otherwise) or cryptocurrencies, i.e., no sourcing.**
    > a. Do not discuss the specifics or go in-depth into the mechanics of online vending.
    > b. Do not show drug packaging to show how a vendor delivered something.
    `,
    flags: ['SuppressEmbeds'],
  });

  await (interaction.channel as TextChannel).send({
    content: `
    \u200B
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
    `,
    flags: ['SuppressEmbeds'],
  });

  await (interaction.channel as TextChannel).send({
    content: `
     \u200B
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

export async function ticketbooth(interaction:ChatInputCommandInteraction) {
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

export async function starthere(interaction:ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });
  // const channelIrc = await interaction.member.client.channels.fetch(CHANNEL_HELPDESK);
  // const channelQuestions = await interaction.client.channels.fetch(CHANNEL_DRUGQUESTIONS);
  const channelBotspam = await interaction.client.channels.fetch(env.CHANNEL_BOTSPAM);
  // const channelSanctuary = await interaction.client.channels.fetch(CHANNEL_SANCTUARY);
  // const channelGeneral = await interaction.client.channels.fetch(CHANNEL_GENERAL);
  const channelTripsit = await interaction.client.channels.fetch(env.CHANNEL_TRIPSIT);
  const channelRules = await interaction.client.channels.fetch(env.CHANNEL_RULES);

  // **If someone has the "bot" tag they are talking from IRC!**
  // > IRC is an older chat system where TripSit began: chat.tripsit.me
  // > The 🔗 icon in the channel name means the channel is linked with IRC.
  // > Users on IRC cannot see when you Reply to their message, or any custom emojis.

  const message = stripIndents`
    **Welcome to the TripSit Discord!**
    > TripSit has always been a bit...different.
    > Our discord is no exception: Even if you've been using discord for years please take a moment to read the info here.
    > The information on this page can help you understand some of the intricacies of this guild!
    > **This guild is under active development and may make changes at any time!**

    **Remember: If you need help, join the ${channelTripsit} room and click the "I need assistance" button**
    > This will create a new thread for you to talk with people who want to help you =)

    **By chatting here you agree to abide the ${channelRules}**
    > Many of our users are currently on a substance and appreciate a more gentle chat.
    > We want this place to be inclusive and welcoming, if there is anything disrupting your stay here:
    ***1*** Use the /report interface to report someone to the mod team! Also use Right Click > Apps > Report!
    ***2*** Mention the @moderators to get attention from the mod team!
    ***3*** Message TripBot and click the "I have a discord issue" button to start a thread with the team!

    **We have our own custom bot!**
    > Go crazy in ${channelBotspam} exploring the bot commands!
    `;

  await (interaction.channel as TextChannel).send(message);
}
