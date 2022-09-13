/* eslint-disable max-len */
import {
  SlashCommandBuilder,
  AttachmentBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  TextInputBuilder,
  ModalBuilder,
  Colors,
  ButtonInteraction,
  ChatInputCommandInteraction,
  ModalSubmitInteraction,
  Role,
  TextChannel,
  GuildMemberRoleManager,
} from 'discord.js';
import {
  ChannelType,
  ButtonStyle,
  TextInputStyle,
} from 'discord-api-types/v10';
import env from '../../../global/utils/env.config';
import {SlashCommand} from '../../utils/commandDef';
import {stripIndents} from 'common-tags';
import {embedTemplate} from '../../utils/embedTemplate';
import logger from '../../../global/utils/logger';

const PREFIX = require('path').parse(__filename).name;

const file = new AttachmentBuilder('./src/discord/assets/img/RULES.png');

// Declare the static test nitice
const testNotice = '🧪THIS IS A TEST PLEASE IGNORE🧪\n\n';
const helperEmoji = env.NODE_ENV === 'production' ?
  '<:ts_helper:979362238789992538>' :
  '<:ts_helper:980934790956077076>';
const invisibleEmoji = env.NODE_ENV === 'production' ?
  '<:invisible:976853930489298984>' :
  '<:invisible:976824380564852768>';
const drunkEmoji = env.NODE_ENV === 'production' ?
  '<:ts_drunk:979362236613160990>' :
  '<:ts_drunk:980917123322896395>';
const highEmoji = env.NODE_ENV === 'production' ?
  '<:ts_high:979362238349578250>' :
  '<:ts_high:980917339698634853>';
const rollingEmoji = env.NODE_ENV === 'production' ?
  '<:ts_rolling:979362238936797194>' :
  '<:ts_rolling:980917339837038672>';
const trippingEmoji = env.NODE_ENV === 'production' ?
  '<:ts_tripping:979362238437670922>' :
  '<:ts_tripping:980917339778326638>';
const dissociatingEmoji = env.NODE_ENV === 'production' ?
  '<:ts_dissociating:979362236575387698>' :
  '<:ts_dissociating:980917339761569812>';
const stimmingEmoji = env.NODE_ENV === 'production' ?
  '<:ts_stimming:979362237452025936>' :
  '<:ts_stimming:980917339895787580>';
const noddingEmoji = env.NODE_ENV === 'production' ?
  '<:ts_nodding:979362238534123520>' :
  '<:ts_nodding:980917339803512902>';
// const soberEmoji = env.NODE_ENV === 'production'
//   ? '<:ts_sober:979362237695295508>'
//   : '<:ts_sober:980917339728007188>';
const talkativeEmoji = env.NODE_ENV === 'production' ?
  '<:ts_talkative:981799227141259304>' :
  '<:ts_talkative:981910870567309312>';
const workingEmoji = env.NODE_ENV === 'production' ?
  '<:ts_working:979362237691093022>' :
  '<:ts_working:981925646953504869>';
// const upvoteEmoji = env.NODE_ENV === 'production'
//   ? '<:ts_voteup:958721361587630210>'
//   : '<:ts_voteup:980917845472985189>';
// const downvoteEmoji = env.NODE_ENV === 'production'
//   ? '<:ts_votedown:960161563849932892>'
//   : '<:ts_votedown:980917845015818251>';
// const thumbupEmoji = env.NODE_ENV === 'production'
//   ? '<:ts_thumbup:979721167332052992>'
//   : '<:ts_thumbup:980917845640773653>';
// const thumbdownEmoji = env.NODE_ENV === 'production'
//   ? '<:ts_thumbdown:979721915390369822>'
//   : '<:ts_thumbdown:980917845527519312>';
const pinkHeart = env.NODE_ENV === 'production' ?
  '<:pink_heart:958072815884582922>' :
  '<:pink_heart:977926946656763904>';
// const researcherEmoji = env.NODE_ENV === 'production'
//   ? '<:ts_researcher:979557718648057916>'
//   : '<:ts_researcher:980934790867984415>';
const coderEmoji = env.NODE_ENV === 'production' ?
  '<:ts_coder:979557703972163644>' :
  '<:ts_coder:980934790893142106>';
// const clearmindEmoji = env.NODE_ENV === 'production'
//   ? '<:ts_clearmind:979557762621136997>'
//   : '<:ts_clearmind:980934790834442240>';
/**
 * The how to tripsit prompt
 * @param {Interaction} interaction The interaction that triggered this
 */
export const prompt: SlashCommand = {
  data: new SlashCommandBuilder()
      .setName('prompt')
      .setDescription('Sets various static prompts')
      .addSubcommand((subcommand) => subcommand
          .setDescription('HowToTripSit info!')
          .setName('howtotripsit'))
      .addSubcommand((subcommand) => subcommand
          .setDescription('consultants info!')
          .setName('consultants'))
      .addSubcommand((subcommand) => subcommand
          .setDescription('techhelp info!')
          .setName('techhelp'))
      .addSubcommand((subcommand) => subcommand
          .setDescription('rules info!')
          .setName('rules'))
      .addSubcommand((subcommand) => subcommand
          .setDescription('starthere info!')
          .setName('starthere'))
      .addSubcommand((subcommand) => subcommand
          .setDescription('tripsitme info!')
          .setName('tripsitme'))
      .addSubcommand((subcommand) => subcommand
          .setDescription('ticketbooth info!')
          .setName('ticketbooth')),
  async execute(interaction:ChatInputCommandInteraction) {
    logger.debug(`[${PREFIX}] Starting!`);
    const embed = embedTemplate()
        .setTitle('On it!');
    interaction.reply({embeds: [embed], ephemeral: true});

    const command = interaction.options.getSubcommand();
    if (command === 'howtotripsit') {
      await howtotripsit(interaction);
    } else if (command === 'consultants') {
      await consultants(interaction);
    } else if (command === 'techhelp') {
      await techhelp(interaction);
    } else if (command === 'rules') {
      await rules(interaction);
    } else if (command === 'starthere') {
      await starthere(interaction);
    } else if (command === 'tripsitme') {
      await tripsitme(interaction);
    } else if (command === 'ticketbooth') {
      await ticketbooth(interaction);
    }
    logger.debug(`[${PREFIX}] finished!`);
  },
};

/**
 * The how to tripsit prompt
 * @param {Interaction} interaction The interaction that triggered this
 */
export async function howtotripsit(interaction:ChatInputCommandInteraction) {
  logger.debug(`${PREFIX} how to tripsit!`);
  const embed = embedTemplate()
      .setAuthor(null)
      .setFooter(null);
  if (!(interaction.channel as TextChannel)) {
    logger.error(`${PREFIX} how to tripsit: no channel`);
    interaction.reply('You must run this in the channel you want the prompt to be in!');
    return;
  }

  const channelTripsit = interaction.client.channels.cache.get(env.CHANNEL_TRIPSIT);
  if (!channelTripsit) {
    logger.error(`${PREFIX} how to tripsit: no channel tripsit`);
    interaction.reply('I can\'t find #tripsit channel!');
    return;
  }
  // const channelTripsitInfo = interaction.client.channels.cache.get(CHANNEL_HOWTOTRIPSIT);
  const channelTripsitters = interaction.client.channels.cache.get(env.CHANNEL_TRIPSITTERS);
  if (!channelTripsitters) {
    logger.error(`${PREFIX} how to tripsit: no channel tripsitters`);
    interaction.reply('I can\'t find #tripsitters channel!');
    return;
  }

  embed.setTitle('**How to use TripSit**');
  embed.setColor(Colors.Green);
  embed.setDescription(stripIndents`
  ${channelTripsit!.toString()} is our main help channel.
  People who need help can click on the "I need assistance button" button
  The bot will ask them two questions:
  **1)** "What substance? How much taken? What time?"
  **2)** "What's going on? Give us the details!"
  When ready, the user submits the prompt and the fun begins:
  `);
  await (interaction.channel as TextChannel).send(
      {embeds: [embed]},
  );

  embed.setTitle(null);
  embed.setColor(Colors.Blue);
  embed.setDescription(stripIndents`
  **1)** The user's roles are changed so that they can only see the Harm Reduction rooms
  **2)** A new private thread is created in ${channelTripsit.toString()}
  **-** This room is used to talk with the user and guide them through the process.
  **3)** A second private thread is created in ${channelTripsitters.toString()}
  **-** Tripsitters and Helpers are invited to this channel to coordiante the session.
  `);
  await (interaction.channel as TextChannel).send(
      {embeds: [embed]},
  );

  embed.setColor(Colors.Purple);
  embed.setDescription(stripIndents`
  Finally, when the user is finished, they can click the “I’m good now” button.
  This will restore their old roles and bring them back to “normal”.
  The thread will be archived after 24 hours to remove clutter up clutter.
  The thread will be deleted after 7 days to preserve privacy
  The user can re-use this threads if they need help within the next 7 days

  **[This information is also available with pictures online!](https://discord.tripsit.me/pages/tripsit.html)**
  `);
  await (interaction.channel as TextChannel).send(
      {embeds: [embed]},
  );

  embed.setColor(Colors.Yellow);
  embed.setDescription(stripIndents`
  **Are you interested in helping out in the Harm Reduction Centre?**
  By reacting to this message you will be given the **Helper** role.
  This will give you access to the ${channelTripsitters.toString()} room
  **You will be notified when people need assistance!**
  This role is completely optional, but we appreciate the help!
  `);
  let reactionRoleInfo = {};
  await (interaction.channel as TextChannel).send(
      {embeds: [embed]},
  )
      .then(async (msg) => {
        await msg.react(`${helperEmoji}`);
        reactionRoleInfo = {
          [msg.id]: [{
            name: 'Helper',
            reaction: `${helperEmoji.slice(2, -20)}`,
            roleId: env.ROLE_HELPER,
          }],
        };
      });

  logger.debug(`[${PREFIX}] reactionRoles: ${JSON.stringify(reactionRoleInfo)}`);
  if (global.db) {
    const ref = db.ref(`${env.FIREBASE_DB_GUILDS}/${interaction.guild!.id}/reactionRoles/${interaction.channel!.id}`);
    ref.set(reactionRoleInfo);
  }
}

/**
 * The consultants prompt
 * @param {Interaction} interaction The interaction that triggered this
 */
export async function consultants(interaction:ChatInputCommandInteraction) {
  logger.debug(`${PREFIX} consultants!`);
  if (!(interaction.channel as TextChannel)) {
    logger.error(`${PREFIX} how to tripsit: no channel`);
    interaction.reply('You must run this in the channel you want the prompt to be in!');
    return;
  }
  // const channelDevofftopic = interaction.client.channels.cache.get(CHANNEL_DEVOFFTOPIC);
  // const channelDevelopment = interaction.client.channels.cache.get(CHANNEL_DEVELOPMENT);
  const channelTripcord = interaction.client.channels.cache.get(env.CHANNEL_TRIPCORD);
  const channelTripbot = interaction.client.channels.cache.get(env.CHANNEL_TRIPBOT);
  const channelTripmobile = interaction.client.channels.cache.get(env.CHANNEL_TRIPBMOBILE);
  const channelWikicontent = interaction.client.channels.cache.get(env.CHANNEL_WIKICONTENT);
  // const channelTrippit = interaction.client.channels.cache.get(CHANNEL_TRIPSITREDDIT);
  // const channelVipWelcome = interaction.client.channels.cache.get(CHANNEL_VIPWELCOME);

  await (interaction.channel as TextChannel).send(stripIndents`
    Our development category holds the projects we're working on.

    > **We encourage you to make a new thread whenever possible!**
    > This allows us to organize our efforts and not lose track of our thoughts!

    TripSit is run by volunteers, so things may be a bit slower than your day job.
    Almost all the code is open source and can be found on our GitHub: <http://github.com/tripsit>
    Discussion of changes happens mostly in the public channels in this category.
    If you have an idea or feedback, make a new thread: we're happy to hear all sorts of input and ideas!
  `);

  await (interaction.channel as TextChannel).send(stripIndents`
    **We have a couple ongoing projects that can always use volunteers:**

    ${channelTripcord}
    > While this discord has existed for years, TS has only started focusing on it recently.
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

    ${channelWikicontent}
    > We have a ton of drug information available online: <https://drugs.tripsit.me>
    > We're always looking to improve our substance information, and we need researchers to help us!
    > If you want to make a change to the wiki, please make a new thread in this category.
    > *Changes to the wiki will only be made after given a credible source!*
    `);

  let reactionRoleInfo = {};
  await (interaction.channel as TextChannel).send(stripIndents`
        ${invisibleEmoji}
        > **Are you interested in TripSit projects?**
        > By reacting to this message you will be given the **Consultant** role
        > This will give you access to the Development rooms and you may be pinged for your opinion
        > **You don't need to know how to code to pick up this role: all sorts of input is valuable!**
        > You can follow along and see the progress being made and community feedback is important!
        `)
      .then(async (msg) => {
        await msg.react(`${coderEmoji}`);
        reactionRoleInfo = {
          [msg.id]: [{
            name: 'Consultant',
            reaction: `${coderEmoji.slice(2, -20)}`,
            roleId: env.ROLE_CODER,
          }],
        };
      });

  logger.debug(`[${PREFIX}] reactionRoles: ${JSON.stringify(reactionRoleInfo)}`);
  const ref = db.ref(`${env.FIREBASE_DB_GUILDS}/${interaction.guild!.id}/reactionRoles/${interaction.channel!.id}`);
  ref.set(reactionRoleInfo);
}

/**
 * The techhelp prompt
 * @param {Interaction} interaction The interaction that triggered this
 */
export async function techhelp(interaction:ChatInputCommandInteraction) {
  logger.debug(`${PREFIX} techhelp!`);
  if (!(interaction.channel as TextChannel)) {
    logger.error(`${PREFIX} how to tripsit: no channel`);
    interaction.reply('You must run this in the channel you want the prompt to be in!');
    return;
  }
  const channelTripsit = interaction.client.channels.cache.get(env.CHANNEL_TRIPSIT);
  if (!channelTripsit) {
    logger.error(`${PREFIX} how to tripsit: no channel`);
    interaction.reply('We can\'t find the tripsit channel!');
    return;
  }
  const channelDrugQuestions = interaction.client.channels.cache.get(env.CHANNEL_DRUGQUESTIONS);
  if (!channelDrugQuestions) {
    logger.error(`${PREFIX} how to tripsit: no channel`);
    interaction.reply('We can\'t find the drugquestions channel!');
    return;
  }

  const buttonText = stripIndents`
    Welcome to TripSit's technical help channel!

    This channel can be used to get in contact with the Team Tripsit for **technical** assistance/feedback!

    **If you need psychological help try ${channelTripsit.toString()}!**

    **If you have questions on drugs try ${channelDrugQuestions.toString()}!**

    If you **can't connect** to the IRC and don't know why, click the **green🟩button** and give us your details.
    This will make a **private** thread with moderators, so please be detailed and include your IP address.
    Don't know your IP address? Go to <https://whatismyip.com> and copy the IP address!

    If you've been **banned** and know why, click the **red🟥button** and give us your details.
    This will also make a **private** thread with moderators.
    Please do not interact with the rest of the discord while your appeal is being processed.
    It may be considered ban evasion if you get banned on IRC and immediately chat on discord outside of this channel!

    **Discord issues, feedback or questions**can be discussesed with the team via the **blue🟦button**.

    **Other issues, questions, feedback** can be privately discussed with the team with the **grey button**.

    We value your input, no matter how small. Please let us know if you have any questions or feedback!

    Thanks for reading, stay safe!
  `;

  // Create buttons
  const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
          new ButtonBuilder()
              .setCustomId('ircConnect')
              .setLabel('I can\'t connect to IRC!')
              .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
              .setCustomId('ircAppeal')
              .setLabel('I want to appeal my ban!')
              .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
              .setCustomId('discordIssue')
              .setLabel('Discord issue/feedback!')
              .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
              .setCustomId('ircOther')
              .setLabel('I have something else!')
              .setStyle(ButtonStyle.Secondary),
      );

  // Create a new button
  await (interaction.channel as TextChannel).send({content: buttonText, components: [row]});
}

/**
 * The rules prompt
 * @param {Interaction} interaction The interaction that triggered this
 */
export async function rules(interaction:ChatInputCommandInteraction) {
  logger.debug(`${PREFIX} rules!`);
  if (!(interaction.channel as TextChannel)) {
    logger.error(`${PREFIX} how to tripsit: no channel`);
    interaction.reply('You must run this in the channel you want the prompt to be in!');
    return;
  }
  const channelTripsit = interaction.client.channels.cache.get(env.CHANNEL_TRIPSIT);
  if (!channelTripsit) {
    logger.error(`${PREFIX} how to tripsit: no channel`);
    interaction.reply('We can\'t find the tripsit channel!');
    return;
  }
  const channelDrugQuestions = interaction.client.channels.cache.get(env.CHANNEL_DRUGQUESTIONS);
  if (!channelDrugQuestions) {
    logger.error(`${PREFIX} how to tripsit: no channel`);
    interaction.reply('We can\'t find the drugquestions channel!');
    return;
  }

  const embed = embedTemplate()
      .setAuthor(null)
      .setFooter(null)
      .setColor(Colors.Red)
      .setImage('attachment://RULES.png');
  await (interaction.channel as TextChannel).send({embeds: [embed], files: [file]});

  await (interaction.channel as TextChannel).send(stripIndents`
    > **-** **You can be banned without warning if you do not follow the rules!**
    > **-** The "Big 4" rules are below, but generally be positive, be safe, and dont buy/sell stuff and you'll be fine.
    > **-** If you need to clarify anything you can review the full unabridged network rules: https://wiki.tripsit.me/wiki/Rules 
    > **-** The moderators reserve the right to remove those who break the 'spirit' of the rules, even if they don't break any specific rule.
    > **-** If you see something against the rules or something that makes you feel unsafe, let the team know. We want this server to be a welcoming space!
    ${invisibleEmoji}
    `);

  await (interaction.channel as TextChannel).send(stripIndents`
    > **🔞 1. You must be over 18 to participate in most channels!**
    > **-** We believe that minors will use substances regardless of the info available to them so the best we can do is educate properly and send them on their way.
    > **-** ${channelTripsit.toString()} allows minors to get help from a tripsitter.
    > **-** ${channelDrugQuestions.toString()} allows minors to ask questions on substances.
    > **-** We appreciate the support, but beyond this it is our belief that minors have more productive activitives than contributing to a harm reduction network <3
    ${invisibleEmoji}
    `);

  await (interaction.channel as TextChannel).send(stripIndents`
    > **💊 2. No Sourcing!**
    > **-** Don't post anything that would help you or others acquire drugs; legal or illegal, neither in the server nor in DMs.
    > **-** Assume anyone attempting to buy or sell something is a scammer. Report scammers to the team to get a (virtual) cookie.
    > **-** You may source harm reduction supplies and paraphernalia, providing that the source doesn't distribute any substances.
    > **-** No self-promotion (server invites, advertisements, etc) without permission from a staff member.
    ${invisibleEmoji}
    `);

  await (interaction.channel as TextChannel).send(stripIndents`
    > **💀 3. Do not encourage unsafe usage!**
    > **-** Don't encourage or enable dangerous drug use; don't spread false, dangerous, or misleading information about drugs.
    > **-** Keep your dosage information and stash private unless it's relevant to a question. Posting absurd dosages to get a reaction will receive a reaction (a ban).
    > **-** Hard drug use (beyond nicotine or THC) or driving on camera is not allowed in the voice rooms.
    > **-** No substance identification - no one can tell you which drugs, or how much of them, you have just by looking at them. #harm-reduction
    ${invisibleEmoji}
    `);

  await (interaction.channel as TextChannel).send(stripIndents`
    > **❤️ 4. Treat everyone with respect!**
    > **-** Don't participate in behaviour that purposefully causes discomfort to others.
    > **-** Don't submit anything that drastically disturbs the flow of chat without providing any added value.
    > **-** That includes: Mic spam, reaction spam, taking six messages to formulate one sentence, etc.
    > **-** Don't post content that is unnecessarily inflammatory, provocative, or controversial. Read the atmosphere, and recognize when you've gone too far.
    ${invisibleEmoji}
    `);

  logger.debug(`[${PREFIX}] finished!`);
}

/**
 * The starthere prompt
 * @param {Interaction} interaction The interaction that triggered this
 */
export async function starthere(interaction:ChatInputCommandInteraction) {
  logger.debug(`[${PREFIX}] Starting!`);
  if (!(interaction.channel as TextChannel)) {
    logger.error(`${PREFIX} how to tripsit: no channel`);
    interaction.reply('You must run this in the channel you want the prompt to be in!');
    return;
  }
  // const channelIrc = interaction.member.client.channels.cache.get(CHANNEL_TECHHELP);
  // const channelQuestions = interaction.client.channels.cache.get(CHANNEL_DRUGQUESTIONS);
  const channelBotspam = interaction.client.channels.cache.get(env.CHANNEL_BOTSPAM);
  // const channelSanctuary = interaction.client.channels.cache.get(CHANNEL_SANCTUARY);
  // const channelGeneral = interaction.client.channels.cache.get(CHANNEL_GENERAL);
  const channelTripsit = interaction.client.channels.cache.get(env.CHANNEL_TRIPSIT);
  const channelRules = interaction.client.channels.cache.get(env.CHANNEL_RULES);

  const message = stripIndents`
    **Welcome to the TripSit Discord!**
    > TripSit has always been a bit...different.
    > Our discord is no exception: Even if you've been using discord for years please take a moment to read the info here.
    > The information on this page can help you understand some of the intricaces of this guild!
    > **This guild is under active development and may make changes at any time!**

    **Remember: If you need help, join the ${channelTripsit} room and click the "I need assistance" button**
    > This will create a new thread for you to talk with people who want to help you =)

    **By chatting here you agree to abide the ${channelRules}**
    > Many of our users are currently on a substance and appreciate a more gentle chat.
    > We want this place to be inclusive and welcoming, if there is anything disrupting your stay here:
    ***1*** Use the /report interface to report someone to the mod team! Also use Right Click > Apps > Report!
    ***2*** Mention the @moderators to get attention from the mod team!
    ***3*** Message TripBot and click the "I have a discord issue" button to start a thread with the team!

    **If someone has the "bot" tag they are talking from IRC!**
    > IRC is an older chat system where TripSit started: chat.tripsit.me
    > The 🔗 icon in the channel name means the channel is linked with IRC.
    > Users on IRC cannot see when you Reply to their message, or any custom emojis.

    **We have our own custom bot!**
    > Go crazy in ${channelBotspam} exploring the bot commands!
    `;

  await (interaction.channel as TextChannel).send(message);

  const mindsetEmbed = embedTemplate()
      .setDescription(stripIndents`
      ${drunkEmoji} - Drunk
      ${highEmoji} - High
      ${rollingEmoji} - Rolling
      ${trippingEmoji} - Tripping
      ${dissociatingEmoji} - Dissociating
      ${stimmingEmoji} - Stimming
      ${noddingEmoji} - Nodding
      ${talkativeEmoji} - I'm just happy to chat!
      ${workingEmoji} - I'm busy and may be slow to respond!
    `)
      .setAuthor({
        name: 'React to this to show your mindset!',
        iconURL: undefined,
        url: undefined,
      })
      .setFooter({text: 'These roles reset after 8 hours to accurately show your mindset!'})
      .setColor(Colors.Purple);
  let reactionRoleInfo = {} as ReactionRoleCollection;
  type ReactionRoleCollection = {
    [key: number]: ReactionRole[];
  };
  type ReactionRole = {
    /** The name of the reaction role, just for humans*/
    name: string;
    /** Paste the reaction here, or the string name. NOT the numeric ID*/
    reaction: string;
    /** The ID of the role to give to users with this reaction*/
    roleId: string;
  };

  await (interaction.channel as TextChannel).send({embeds: [mindsetEmbed]})
      .then(async (msg) => {
        await msg.react(`${drunkEmoji}`);
        await msg.react(`${highEmoji}`);
        await msg.react(`${rollingEmoji}`);
        await msg.react(`${trippingEmoji}`);
        await msg.react(`${dissociatingEmoji}`);
        await msg.react(`${stimmingEmoji}`);
        await msg.react(`${noddingEmoji}`);
        // await msg.react(`${soberEmoji}`);
        await msg.react(`${talkativeEmoji}`);
        await msg.react(`${workingEmoji}`);
        reactionRoleInfo = {
          [msg.id]: [
            {
              name: 'Drunk',
              reaction: drunkEmoji.slice(drunkEmoji.indexOf(':', 3)+1, drunkEmoji.indexOf('>')),
              roleId: env.ROLE_DRUNK,
            },
            {
              name: 'High',
              reaction: highEmoji.slice(highEmoji.indexOf(':', 3)+1, highEmoji.indexOf('>')),
              roleId: env.ROLE_HIGH,
            },
            {
              name: 'Rolling',
              reaction: rollingEmoji.slice(rollingEmoji.indexOf(':', 3)+1, rollingEmoji.indexOf('>')),
              roleId: env.ROLE_ROLLING,
            },
            {
              name: 'Tripping',
              reaction: trippingEmoji.slice(trippingEmoji.indexOf(':', 3)+1, trippingEmoji.indexOf('>')),
              roleId: env.ROLE_TRIPPING,
            },
            {
              name: 'Dissociating',
              reaction: dissociatingEmoji.slice(dissociatingEmoji.indexOf(':', 3)+1, dissociatingEmoji.indexOf('>')),
              roleId: env.ROLE_DISSOCIATING,
            },
            {
              name: 'Stimming',
              reaction: stimmingEmoji.slice(stimmingEmoji.indexOf(':', 3)+1, stimmingEmoji.indexOf('>')),
              roleId: env.ROLE_STIMMING,
            },
            {
              name: 'Sedated',
              reaction: noddingEmoji.slice(noddingEmoji.indexOf(':', 3)+1, noddingEmoji.indexOf('>')),
              roleId: env.ROLE_NODDING,
            },
            {
              name: 'Talkative',
              reaction: talkativeEmoji.slice(talkativeEmoji.indexOf(':', 3)+1, talkativeEmoji.indexOf('>')),
              roleId: env.ROLE_TALKATIVE,
            },
            {
              name: 'Working',
              reaction: workingEmoji.slice(workingEmoji.indexOf(':', 3)+1, workingEmoji.indexOf('>')),
              roleId: env.ROLE_WORKING,
            },
          ],
        };
      });

  logger.debug(`[${PREFIX}] reactionRoles: ${JSON.stringify(reactionRoleInfo)}`);
  const ref = db.ref(`${env.FIREBASE_DB_GUILDS}/${interaction.guild!.id}/reactionRoles/${interaction.channel!.id}`);

  const colorEmbed = embedTemplate()
      .setAuthor({name: 'React to this message to set the color of your nickname!', iconURL: undefined, url: undefined})
      .setFooter(null)
      .setColor(Colors.Blue);

  await (interaction.channel as TextChannel).send({embeds: [colorEmbed]})
      .then(async (msg) => {
        await msg.react('❤');
        await msg.react('🧡');
        await msg.react('💛');
        await msg.react('💚');
        await msg.react('💙');
        await msg.react('💜');
        await msg.react(pinkHeart);
        await msg.react('🖤');
        await msg.react('🤍');
        reactionRoleInfo[msg.id as any] = [
          {
            name: 'Red',
            reaction: `❤`,
            roleId: env.ROLE_RED,
          },
          {
            name: 'Orange',
            reaction: `🧡`,
            roleId: env.ROLE_ORANGE,
          },
          {
            name: 'Yellow',
            reaction: `💛`,
            roleId: env.ROLE_YELLOW,
          },
          {
            name: 'Green',
            reaction: `💚`,
            roleId: env.ROLE_GREEN,
          },
          {
            name: 'Blue',
            reaction: `💙`,
            roleId: env.ROLE_BLUE,
          },
          {
            name: 'Purple',
            reaction: `💜`,
            roleId: env.ROLE_PURPLE,
          },
          {
            name: 'Pink',
            reaction: pinkHeart.slice(pinkHeart.indexOf(':', 3)+1, pinkHeart.indexOf('>')),
            roleId: env.ROLE_PINK,
          },
          {
            name: 'Black',
            reaction: `🖤`,
            roleId: env.ROLE_BLACK,
          },
          {
            name: 'White',
            reaction: `🤍`,
            roleId: env.ROLE_WHITE,
          },
        ];
      });

  ref.set(reactionRoleInfo);

  logger.debug(`[${PREFIX}] finished!`);
}

/**
 * The tripsitme prompt
 * @param {Interaction} interaction The interaction that triggered this
 */
export async function tripsitme(interaction:ChatInputCommandInteraction) {
  if (!(interaction.channel as TextChannel)) {
    logger.error(`${PREFIX} how to tripsit: no channel`);
    interaction.reply('You must run this in the channel you want the prompt to be in!');
    return;
  }
  const channelQuestions = interaction.client.channels.cache.get(env.CHANNEL_DRUGQUESTIONS);
  const channelSanctuary = interaction.client.channels.cache.get(env.CHANNEL_SANCTUARY);
  const channelGeneral = interaction.client.channels.cache.get(env.CHANNEL_GENERAL);

  const buttonText = stripIndents`
    Welcome to the TripSit room!

    Non-urgent questions on drugs? Make a thread in ${channelQuestions!.toString()}!

    Don't need immediate help but want a peaceful chat? Come to ${channelSanctuary!.toString()}!

    **Need to talk with a tripsitter? Click the buttom below!**
    Share what substance you're asking about, time and size of dose, and any other relevant info.
    This will create a new thread and alert the community that you need assistance!
    🛑 Please do not message helpers or tripsitters directly! 🛑

    All other topics of conversation are welcome in ${channelGeneral!.toString()}!

    Stay safe!
  `;

  // Create a new button embed
  const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
          new ButtonBuilder()
              .setCustomId('tripsitme')
              .setLabel('I need assistance!')
              .setStyle(ButtonStyle.Primary),
      );

  // Create a new button
  await (interaction.channel as TextChannel).send({content: buttonText, components: [row]});
  logger.debug(`[${PREFIX}] finished!`);
}

/**
 * The ticketbooth prompt
 * @param {Interaction} interaction The interaction that triggered this
 */
export async function ticketbooth(interaction:ChatInputCommandInteraction) {
  if (!(interaction.channel as TextChannel)) {
    logger.error(`${PREFIX} how to tripsit: no channel`);
    interaction.reply('You must run this in the channel you want the prompt to be in!');
    return;
  }
  logger.debug(`[${PREFIX}] Starting!`);
  const channelTripsit = interaction.client.channels.cache.get(env.CHANNEL_TRIPSIT);
  const channelSanctuary = interaction.client.channels.cache.get(env.CHANNEL_SANCTUARY);
  const channelOpentripsit = interaction.client.channels.cache.get(env.CHANNEL_OPENTRIPSIT);
  const channelRules = interaction.client.channels.cache.get(env.CHANNEL_RULES);

  const buttonText = `
  Welcome to TripSit!

  **If you need help**
  **1** Go to ${channelTripsit!.toString()} and click the "I need assistance button"!
  **-** This will create a private thread for you, and we're happy to help :grin:
  **2** If no one responds, you can chat as a group in the ${channelOpentripsit!.toString()} rooms
  **-** Try to pick one that's not busy so we can pay attention to you :heart:
  **3** If you don't need help but would appreciate a quiet chat, come to ${channelSanctuary!.toString()}

  **If you want to social chat please agree to the following:**

  **1)** I do not currently need help and understand I can go to ${channelTripsit!.toString()} to get help if I need it.
  **2)** I understand if no one responds in ${channelTripsit!.toString()} I can talk in the "open" tripsit rooms.
  **3)** I understand that every room with a :link: is bridged to IRC and there may be lower quality chat in those rooms.
  **4)** I have read the ${channelRules!.toString()}: I will not buy/sell anything and I will try to keep a positive atmosphere!
  `;

  // Create a new button embed
  const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
          new ButtonBuilder()
              .setCustomId('memberbutton')
              .setLabel('I understand where to find help and will follow the rules!')
              .setStyle(ButtonStyle.Success),
      );

  // Create a new button
  await (interaction.channel as TextChannel).send({content: buttonText, components: [row]});

  logger.debug(`[${PREFIX}] finished!`);
}

/**
 * The ircClick prompt
 * @param {ButtonInteraction} interaction The interaction that triggered this
 * @param {string} issueType The issue type to set
 */
export async function ircClick(interaction:ButtonInteraction, issueType:string) {
  // logger.debug(`[${PREFIX}] Message: ${JSON.stringify(interaction, null, 2)}!`);

  let placeholder = '';
  if (issueType === 'ircConnect') {
    placeholder = 'I\'ve been banned on IRC and I dont know why.\nMy nickname is Strongbad and my IP is 192.168.100.200';
  } else if (issueType === 'ircAppeal') {
    placeholder = 'I was a jerk it, wont happen again. My nickname is Strongbad';
  } else if (issueType === 'ircOther') {
    placeholder = 'I just wanted to say that Tripsit is super cool and I love it!';
  } else if (issueType === 'discordIssue') {
    placeholder = 'I have an issue with discord, can you please help?';
  }
  // Create the modal
  const modal = new ModalBuilder()
      .setCustomId(`${issueType}ModmailIssueModal`)
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
 * The ircSubmit prompt
 * @param {ModalSubmitInteraction} interaction The modal that submitted this
 * @param {string} issueType The issue type to set
 */
export async function ircSubmit(interaction:ModalSubmitInteraction, issueType:string) {
  // logger.debug(`[${PREFIX}] interaction: ${JSON.stringify(interaction, null, 2)}!`);

  const roleDeveloper = interaction.guild!.roles.cache.find((role) => role.id === env.ROLE_DEVELOPER);
  logger.debug(`[${PREFIX}] roleDeveloper: ${roleDeveloper}`);

  // Determine if this command was started by a Developer
  const isDev = (interaction.member!.roles as GuildMemberRoleManager).cache.find(
      (role:Role) => role.id === roleDeveloper!.id,
  ) !== undefined;

  // Respond right away cuz the rest of this doesn't matter
  const guild = await interaction.client.guilds.fetch(env.DISCORD_GUILD_ID);
  const member = await guild.members.fetch(interaction.user.id);
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
  // Get the moderator role
  const tripsitGuild = interaction.client.guilds.cache.get(env.DISCORD_GUILD_ID);
  const roleModerator = tripsitGuild!.roles.cache.find((role) => role.id === env.ROLE_MODERATOR);

  const channel = await interaction.client.channels.fetch(env.CHANNEL_TECHHELP) as TextChannel;
  // Debating if there should be a sparate channel for discord issues or if just use irc?
  // if (issueType === 'discord') {
  //   // Get the moderation channel
  //   channel = interaction.client.channels.cache.get(CHANNEL_TECHHELP);
  // } else if (issueType === 'irc') {
  //   // Get the irc channel
  //   channel = interaction.client.channels.cache.get(CHANNEL_TECHHELP);
  // }

  // Get whatever they sent in the modal
  const modalInput = interaction.fields.getTextInputValue(`${issueType}IssueInput`);
  logger.debug(`[${PREFIX}] modalInput: ${modalInput}!`);

  // // Get the actor
  const actor = interaction.user;

  // const memberKey = `${member.user.username}${member.user.discriminator}`.replace(/(\s|\.|\$|#|\[|\]|\/)/g, '_');

  // const [ticketData, ticketFbid] = await getTicketInfo(memberKey, 'user');
  // logger.debug(`[${PREFIX}] ticketData: ${JSON.stringify(ticketData, null, 2)}!`);

  // Check if an open thread already exists, and if so, update that thread, return
  // if (Object.keys(ticketData).length !== 0) {
  //   // const issueType = ticketInfo.issueType;
  //   logger.debug(`[${PREFIX}] channel: ${JSON.stringify(channel, null, 2)}!`);
  //   if (channel) {
  //     try {
  //       const issueThread = await channel.threads.fetch(ticketData.issueThread);
  //       // logger.debug(`[${PREFIX}] issueThread: ${JSON.stringify(issueThread, null, 2)}!`);
  //       if (issueThread) {
  //         // Ping the user in the help thread
  //         const helpMessage = stripIndents`
  //           Hey team, ${actor} submitted a new request for help:

  //           > ${modalInput}
  //         `;
  //         issueThread.send(helpMessage);

  //         const embed = embedTemplate();
  //         embed.setDescription(stripIndents`You already have an open issue here ${issueThread.toString()}!`);
  //         interaction.reply({embeds: [embed], ephemeral: true});
  //         return;
  //       }
  //     } catch (err) {
  //       logger.debug(`[${PREFIX}] The thread has likely been deleted!`);
  //       ticketData.issueStatus = 'closed';
  //       setTicketInfo(ticketFbid, ticketData);
  //     }
  //   }
  // }

  // Create a new thread in channel
  const ticketThread = await channel!.threads.create({
    name: `${actor.username}'s ${issueType} issue!`,
    autoArchiveDuration: 1440,
    type: env.NODE_ENV === 'production' ? ChannelType.GuildPrivateThread : ChannelType.GuildPublicThread,
    reason: `${actor.username} submitted a(n) ${issueType} issue`,
  });
  logger.debug(`[${PREFIX}] Created meta-thread ${ticketThread.id}`);

  const embed = embedTemplate();
  embed.setDescription(stripIndents`Thank you, check out ${ticketThread} to talk with a team member about your issue!`);
  interaction.reply({embeds: [embed], ephemeral: true});

  let message = stripIndents`
    Hey ${isDev ? 'moderators' : roleModerator}! ${actor} has submitted a new issue:

    > ${modalInput}

    Please look into it and respond to them in this thread!

    When you're done remember to '/modmail close' this ticket!`;

  if (isDev) {
    message = testNotice + message;
  }

  await ticketThread.send(message);
  logger.debug(`[${PREFIX}] Sent intro message to meta-thread ${ticketThread.id}`);

  // Webhooks dont work in threads, but leaving this code here for later
  // const webhook = await ticketThread.createWebhook(
  // actor.username, { avatar: actor.avatarURL()
  //   }});
  // logger.debug(`[${PREFIX}] Created webhook ${JSON.stringify(webhook, null, 2)}!`);

  // Set ticket information
  // const newTicketData = {
  //   issueThread: ticketThread.id,
  //   issueUser: actor.id,
  //   issueUsername: actor.username,
  //   issueUserIsbanned: false,
  //   issueType,
  //   issueStatus: 'open',
  //   issueDesc: modalInput,
  // };
  // setTicketInfo(memberKey, newTicketData);

  // logger.debug(`[${PREFIX}] issueType: ${issueType}!`);
  // await tripsitGuild!.members.fetch();
  // let role = {} as Role;
  // if (issueType.includes('irc')) {
  //   // Get the moderator role
  //   role = await tripsitGuild!.roles.fetch(env.ROLE_IRCADMIN) as Role;
  // }
  // if (issueType.includes('discord')) {
  //   // Get the moderator role
  //   role = await tripsitGuild!.roles.fetch(env.ROLE_DISCORDADMIN) as Role;
  // }
  // const admins = role.members;
  // logger.debug(`[${PREFIX}] admins: ${JSON.stringify(admins, null, 2)}!`);
  // admins.forEach(async (admin) => {
  //   // Alert the admin that the new thread is created
  //   let response = stripIndents`
  //   Hey ${admin.toString()}, ${actor} has an issue in ${ticketThread.toString()}!`;
  //   if (isDev) {
  //     response = testNotice + response;
  //   }
  //   admin.send(response);
  // });
};
