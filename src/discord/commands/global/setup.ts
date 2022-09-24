/* eslint-disable max-len */
import {
  SlashCommandBuilder,
  AttachmentBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  Colors,
  ChatInputCommandInteraction,
  TextChannel,
} from 'discord.js';
import {
  ButtonStyle,
} from 'discord-api-types/v10';
import env from '../../../global/utils/env.config';
import {SlashCommand} from '../../@types/commandDef';
import {stripIndents} from 'common-tags';
import {embedTemplate} from '../../utils/embedTemplate';
import logger from '../../../global/utils/logger';

import * as path from 'path';
const PREFIX = path.parse(__filename).name;

const file = new AttachmentBuilder('./src/discord/assets/img/RULES.png');
/**
 * This command populates various channels with static prompts
 * This is actually kind of complicated, but not really, let me explain:
 * Each prompt generally allows a response from the user, like giving a role or sending a message
 * To customize the action based on the guild, we need to dynamically create the command's >>>> customID <<<<
 * This customID is then parsed to determine the specifics of that command
 * For example, in the /setup tripsit command we create a button with the following customID:
 *     .setCustomId(`tripsitme~${roleNeedshelp.id}~${roleTripsitter.id}~${channelTripsitters.id}`)
 * As you can see:   command  ~ role              ~  role              ~  channel
 * In the buttonClick.ts script we parse the customID and determine what to do, usually create a modal
 * That modal will also have a customID, which is in-turn parsed by modalSubmit.ts, etc
 * @param {Interaction} interaction The interaction that triggered this
 */
export const prompt: SlashCommand = {
  data: new SlashCommandBuilder()
      .setName('setup')
      .setDescription('Set up various channels and prompts!')
      .addSubcommand((subcommand) => subcommand
          .setDescription('Tripsit info!')
          .setName('tripsit')
          .addRoleOption((option) => option
              .setDescription('What is your Tripsitter role?')
              .setName('tripsitter')
              .setRequired(true),
          )
          .addRoleOption((option) => option
              .setDescription('What is your Needshelp role?')
              .setName('needshelp')
              .setRequired(true),
          )
          .addChannelOption((option) => option
              .setDescription('What is your Meta-tripsit channel?')
              .setName('tripsitters')
              .setRequired(true),
          )
          .addChannelOption((option) => option
              .setDescription('Do you have a sanctuary room?')
              .setName('sanctuary'),
          )
          .addChannelOption((option) => option
              .setDescription('Do you have a general room?')
              .setName('general'),
          ),
      )
      .addSubcommand((subcommand) => subcommand
          .setDescription('Tripsitter info!')
          .setName('tripsitter')
          .addChannelOption((option) => option
              .setDescription('What is the tripsit room?')
              .setName('tripsit')
              .setRequired(true),
          )
          .addRoleOption((option) => option
              .setDescription('What is your Tripsitter role?')
              .setName('role_tripsitter')
              .setRequired(true),
          )
          .addChannelOption((option) => option
              .setDescription('Do you have an applications room?')
              .setName('applications'),
          )
          .addRoleOption((option) => option
              .setDescription('Who will review these applications?')
              .setName('role_reviewer'),
          ),
      )
      .addSubcommand((subcommand) => subcommand
          .setDescription('Application info!')
          .setName('applications')
          .addRoleOption((option) => option
              .setDescription('What role are people applying for?')
              .setName('role_requested')
              .setRequired(true),
          )
          .addRoleOption((option) => option
              .setDescription('What role reviews applications?')
              .setName('role_reviewer')
              .setRequired(true),
          ),
      )
      .addSubcommand((subcommand) => subcommand
          .setDescription('techhelp info!')
          .setName('techhelp')
          .addRoleOption((option) => option
              .setDescription('What role responds to tickets here?')
              .setName('moderator')
              .setRequired(true),
          )
          .addChannelOption((option) => option
              .setDescription('Do you have a tripsit room?')
              .setName('tripsit'),
          ),
      )
      .addSubcommand((subcommand) => subcommand
          .setDescription('rules info!')
          .setName('rules'))
      .addSubcommand((subcommand) => subcommand
          .setDescription('starthere info!')
          .setName('starthere'))

      .addSubcommand((subcommand) => subcommand
          .setDescription('ticketbooth info!')
          .setName('ticketbooth')),
  async execute(interaction:ChatInputCommandInteraction) {
    logger.debug(`[${PREFIX}] Starting!`);
    await interaction.deferReply({ephemeral: true});

    const command = interaction.options.getSubcommand();
    if (command === 'tripsitter') {
      await tripsitter(interaction);
    } else if (command === 'applications') {
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

    await interaction.editReply('Donezo!');
    logger.debug(`[${PREFIX}] finished!`);
  },
};

/**
 * Checks to see if the bot has the right permissions
 * @param {ChatInputCommandInteraction} interaction The guild to check
 * @param {TextChannel} channel
 * @return {Promise<any>}
 */
export async function hasPermissions(
    interaction: ChatInputCommandInteraction,
    channel: TextChannel) {
  logger.debug(`[${PREFIX}] Checking permissions`);
  const me = interaction.guild!.members.me!;
  const channelPerms = channel.permissionsFor(me);
  // logger.debug(`[${PREFIX}] channelPerms: ${channelPerms?.toArray()}`);

  if (!channelPerms.has('ViewChannel')) {
    const embed = embedTemplate()
        .setTitle(`I need the 'ViewChannel' permissions in ${channel.name} to view the channel!`);
    interaction.editReply({embeds: [embed]});
    return false;
  }
  if (!channelPerms.has('SendMessages')) {
    const embed = embedTemplate()
        .setTitle(`I need the 'SendMessages' permissions in ${channel.name} to send messages!`);
    interaction.editReply({embeds: [embed]});
    return false;
  }
  if (!channelPerms.has('CreatePrivateThreads')) {
    const embed = embedTemplate()
        .setTitle(`I need the 'CreatePrivateThreads' permissions in ${channel.name} to create a private thread!`);
    interaction.editReply({embeds: [embed]});
    return false;
  }
  if (!channelPerms.has('CreatePublicThreads')) {
    const embed = embedTemplate()
        .setTitle(`I need the 'CreatePublicThreads' permissions in ${channel.name} create a public thread!`);
    interaction.editReply({embeds: [embed]});
    return false;
  }
  if (!channelPerms.has('SendMessagesInThreads')) {
    const embed = embedTemplate()
        .setTitle(`I need the 'SendMessagesInThreads' permissions in ${channel.name} send messages in threads!`);
    interaction.editReply({embeds: [embed]});
    return false;
  }
  if (!channelPerms.has('EmbedLinks')) {
    const embed = embedTemplate()
        .setTitle(`I need the 'EmbedLinks' permissions in ${channel.name} send messages in threads!`);
    interaction.editReply({embeds: [embed]});
    return false;
  }
  return true;
}

/**
 * The tripsit prompt
 * @param {Interaction} interaction The interaction that triggered this
 */
export async function tripsit(interaction:ChatInputCommandInteraction) {
  if (!(interaction.channel as TextChannel)) {
    logger.error(`${PREFIX} how to tripsit: no channel`);
    interaction.reply('You must run this in the channel you want the prompt to be in!');
    return;
  }

  if (!await hasPermissions(interaction, (interaction.channel as TextChannel))) {
    logger.debug(`${PREFIX} bot does NOT has permission to post in !`);
    return;
  }

  if (!await hasPermissions(interaction, (interaction.options.getChannel('tripsitters') as TextChannel))) {
    logger.debug(`${PREFIX} bot does NOT has permission to post!`);
    return;
  }

  logger.debug(`${PREFIX} bot has permission to post!`);

  let buttonText = stripIndents`
    Welcome to ${(interaction.channel as TextChannel).name}!

    **Need to talk with a tripsitter? Click the buttom below!**
    Share what substance you're asking about, time and size of dose, and any other relevant info.
    This will create a new thread and alert the community that you need assistance!
    🛑 Please do not message helpers or tripsitters directly! 🛑
  `;

  const channelSanctuary = interaction.options.getChannel('sanctuary')!;
  const channelGeneral = interaction.options.getChannel('general')!;
  const channelTripsitters = interaction.options.getChannel('tripsitters')!;
  const roleNeedshelp = interaction.options.getRole('needshelp')!;
  const roleTripsitter = interaction.options.getRole('tripsitter')!;

  if (channelSanctuary) {
    buttonText += `\n\nDon't need immediate help but want a peaceful chat? Come to ${channelSanctuary.toString()}!`;
  }

  if (channelGeneral) {
    buttonText += `\n\nAll other topics of conversation are welcome in ${channelGeneral.toString()}!`;
  }

  buttonText += `\n\nStay safe!\n\n`;

  // Create a new button embed
  const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
          new ButtonBuilder()
              .setCustomId(`tripsitmeClick~${roleNeedshelp.id}~${roleTripsitter.id}~${channelTripsitters.id}`)
              .setLabel('I need assistance!')
              .setStyle(ButtonStyle.Primary),
      );

  // Create a new button
  await (interaction.channel as TextChannel).send({content: buttonText, components: [row]});
  logger.debug(`[${PREFIX}] finished!`);
}

/**
 * The tripsitter info
 * @param {Interaction} interaction The interaction that triggered this
 */
export async function tripsitterModal(interaction:ChatInputCommandInteraction) {

}

/**
 * The tripsitter info
 * @param {Interaction} interaction The interaction that triggered this
 */
export async function tripsitter(interaction:ChatInputCommandInteraction) {
  logger.debug(`${PREFIX} how to tripsit!`);
  if (!(interaction.channel as TextChannel)) {
    logger.error(`${PREFIX} how to tripsit: no channel`);
    interaction.reply('You must run this in the channel you want the prompt to be in!');
    return;
  }

  if (!await hasPermissions(interaction, (interaction.channel as TextChannel))) {
    logger.debug(`${PREFIX} bot does NOT has permission to post in !`);
    return;
  }

  if (!await hasPermissions(interaction, (interaction.options.getChannel('tripsit') as TextChannel))) {
    logger.debug(`${PREFIX} bot does NOT has permission to post!`);
    return;
  }

  if (interaction.options.getChannel('applications')) {
    if (!await hasPermissions(interaction, (interaction.options.getChannel('applications') as TextChannel))) {
      logger.debug(`${PREFIX} bot does NOT has permission to post!`);
      return;
    }
  }

  const channelTripsit = interaction.options.getChannel('tripsit');
  logger.debug(`${PREFIX} channelTripsit: ${JSON.stringify(channelTripsit, null, 2)}`);

  let message = stripIndents`
  Welcome to ${interaction.channel}! This channel explains the tripsitting process.

  As people need help, a thread will be created in ${channelTripsit} and a sister-thread will be created here.
  We use the thread in ${channelTripsit} to help the person in need, and use the thread here to coordinate with the team.

  ${channelTripsit} threads are archived after 24 hours, and deleted after 7 days.

  For full details on how the ${channelTripsit} works, please see https://discord.tripsit.me/pages/tripsit.html

  For a refresher on tripsitting please see the following resources:
  - <https://docs.google.com/document/d/1vE3jl9imdT3o62nNGn19k5HZVOkECF3jhjra8GkgvwE>
  - <https://wiki.tripsit.me/wiki/How_To_Tripsit_Online>
  `;

  const channelApplications = interaction.options.getChannel('applications');
  const roleTripsitter = interaction.options.getRole('role_tripsitter');
  const roleReviewer = interaction.options.getRole('role_reviewer');

  if (channelApplications ) {
    message += `
**Interested in helping out?**

We want people who love ${interaction.guild!.name}, want to contribute to its growth, and be part of our success!
To ensure quality support in our assistance channels we appreciate candidates apply only when they meet the following requirements:
1) A basic knowledge of drugs and how they interact with other drugs and mental conditions is highly preferred.
- You don't need a PhD, and this doesn't mean personal experience.
2) A short tenure on the org: While we appreciate the interest you should familiarize yourself with the culture before applying. 
- Around two weeks or level 10 with the bot (use /rank)!

If you meet the above and are interested in becoming a ${roleTripsitter!.name}, please click the button below to fill out the application form!
    `;
    await (interaction.channel as TextChannel).send(
        {content: message,
          components: [new ActionRowBuilder<ButtonBuilder>()
              .addComponents(
                  new ButtonBuilder()
                      .setCustomId(`applicationStart~${channelApplications!.id}~${roleTripsitter!.id}~${roleReviewer!.id}`)
                      .setLabel(`I want to be a ${roleTripsitter!.name}!`)
                      .setStyle(ButtonStyle.Primary),
              )]},
    );
    return;
  }

  await (interaction.channel as TextChannel).send({content: message});
}

/**
 * The consultants prompt
 * @param {Interaction} interaction The interaction that triggered this
 */
export async function applications(interaction:ChatInputCommandInteraction) {
  logger.debug(`${PREFIX} applications!`);
  if (!(interaction.channel as TextChannel)) {
    logger.error(`${PREFIX} how to tripsit: no channel`);
    interaction.reply('You must run this in the channel you want the prompt to be in!');
    return;
  }

  if (!await hasPermissions(interaction, (interaction.channel as TextChannel))) {
    logger.debug(`${PREFIX} bot does NOT has permission to post in !`);
    return;
  }

  const roleRequested = interaction.options.getRole('role_requested');
  const roleReviewer = interaction.options.getRole('role_reviewer');

  // logger.debug(`[${PREFIX}] roleReviewer: ${JSON.stringify(roleReviewer, null, 2)}`);

  // Send the initial message
  await (interaction.channel as TextChannel).send(
      {content: stripIndents`
      Welcome to ${interaction.channel}!

      We're always looking for people who want to contribute to the back-end of the organization!

      Not just coders, but anyone who wants to give input or test out new features!

      If you want to help out with ${interaction.guild!.name}, please click the button below to fill out the application form.
    `,
      components: [new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
              new ButtonBuilder()
                  .setCustomId(`applicationStart~${interaction.channel!.id}~${roleRequested!.id}~${roleReviewer!.id}`)
                  .setLabel(`I want to be a ${roleRequested!.name}!`)
                  .setStyle(ButtonStyle.Primary),
          )]},
  );
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

  if (!await hasPermissions(interaction, (interaction.channel as TextChannel))) {
    logger.debug(`${PREFIX} bot does NOT has permission to post in !`);
    return;
  }

  let text = stripIndents`
    Welcome to ${interaction.guild!.name}'s technical help channel!

    This channel can be used to get in contact with the ${interaction.guild!.name}'s team for **technical** assistance/feedback!`;

  const channelTripsit = interaction.options.getChannel('tripsit')!;
  if (channelTripsit) {
    text += `\n\n**If you need psychological help try ${channelTripsit.toString()}!**`;
  }
  text += `\n\n**Discord-specific issues, feedback or questions** can be discussesed with the team via the **blue🟦button**.

**Other issues, questions, feedback** can be privately discussed with the team with the **grey button**.

We value your input, no matter how small. Please let us know if you have any questions or feedback!

Thanks for reading, stay safe!
  `;

  // Get the moderator role
  const roleModerator = interaction.options.getRole('moderator')!;

  // Create buttons
  const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
          new ButtonBuilder()
              .setCustomId(`techHelpClick~discord~${roleModerator.id}`)
              .setLabel('Discord issue/feedback!')
              .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
              .setCustomId(`techHelpClick~other~${roleModerator.id}`)
              .setLabel('I have something else!')
              .setStyle(ButtonStyle.Secondary),
      );

  // Create a new button
  await (interaction.channel as TextChannel).send({content: text, components: [row]});
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
    ${env.EMOJI_INVISIBLE}
    `);

  await (interaction.channel as TextChannel).send(stripIndents`
    > **🔞 1. You must be over 18 to participate in most channels!**
    > **-** We believe that minors will use substances regardless of the info available to them so the best we can do is educate properly and send them on their way.
    > **-** ${channelTripsit.toString()} allows minors to get help from a tripsitter.
    > **-** We appreciate the support, but beyond this it is our belief that minors have more productive activitives than contributing to a harm reduction network <3
    ${env.EMOJI_INVISIBLE}
    `);

  await (interaction.channel as TextChannel).send(stripIndents`
    > **💊 2. No Sourcing!**
    > **-** Don't post anything that would help you or others acquire drugs; legal or illegal, neither in the server nor in DMs.
    > **-** Assume anyone attempting to buy or sell something is a scammer. Report scammers to the team to get a (virtual) cookie.
    > **-** You may source harm reduction supplies and paraphernalia, providing that the source doesn't distribute any substances.
    > **-** No self-promotion (server invites, advertisements, etc) without permission from a staff member.
    ${env.EMOJI_INVISIBLE}
    `);

  await (interaction.channel as TextChannel).send(stripIndents`
    > **💀 3. Do not encourage unsafe usage!**
    > **-** Don't encourage or enable dangerous drug use; don't spread false, dangerous, or misleading information about drugs.
    > **-** Keep your dosage information and stash private unless it's relevant to a question. Posting absurd dosages to get a reaction will receive a reaction (a ban).
    > **-** Hard drug use (beyond nicotine or THC) or driving on camera is not allowed in the voice rooms.
    > **-** No substance identification - no one can tell you which drugs, or how much of them, you have just by looking at them. #harm-reduction
    ${env.EMOJI_INVISIBLE}
    `);

  await (interaction.channel as TextChannel).send(stripIndents`
    > **❤️ 4. Treat everyone with respect!**
    > **-** Don't participate in behaviour that purposefully causes discomfort to others.
    > **-** Don't submit anything that drastically disturbs the flow of chat without providing any added value.
    > **-** That includes: Mic spam, reaction spam, taking six messages to formulate one sentence, etc.
    > **-** Don't post content that is unnecessarily inflammatory, provocative, or controversial. Read the atmosphere, and recognize when you've gone too far.
    ${env.EMOJI_INVISIBLE}
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

  // **If someone has the "bot" tag they are talking from IRC!**
  // > IRC is an older chat system where TripSit started: chat.tripsit.me
  // > The 🔗 icon in the channel name means the channel is linked with IRC.
  // > Users on IRC cannot see when you Reply to their message, or any custom emojis.

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

    **We have our own custom bot!**
    > Go crazy in ${channelBotspam} exploring the bot commands!
    `;

  await (interaction.channel as TextChannel).send(message);

  const mindsetEmbed = embedTemplate()
      .setDescription(stripIndents`
      ${env.EMOJI_DRUNK} - Drunk
      ${env.EMOJI_HIGH} - High
      ${env.EMOJI_ROLLING} - Rolling
      ${env.EMOJI_TRIPPING} - Tripping
      ${env.EMOJI_DISSOCIATING} - Dissociating
      ${env.EMOJI_STIMMING} - Stimming
      ${env.EMOJI_SEDATED} - Nodding
      ${env.EMOJI_TALKATIVE} - I'm just happy to chat!
      ${env.EMOJI_WORKING} - I'm busy and may be slow to respond!
    `)
      .setAuthor({
        name: 'React to this to show your mindset!',
        iconURL: undefined,
        url: undefined,
      })
      // .setFooter({text: 'These roles reset after 8 hours to accurately show your mindset!'})
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
        await msg.react(`${env.EMOJI_DRUNK}`);
        await msg.react(`${env.EMOJI_HIGH}`);
        await msg.react(`${env.EMOJI_ROLLING}`);
        await msg.react(`${env.EMOJI_TRIPPING}`);
        await msg.react(`${env.EMOJI_DISSOCIATING}`);
        await msg.react(`${env.EMOJI_STIMMING}`);
        await msg.react(`${env.EMOJI_SEDATED}`);
        // await msg.react(`${env.EMOJI_SOBER}`);
        await msg.react(`${env.EMOJI_TALKATIVE}`);
        await msg.react(`${env.EMOJI_WORKING}`);
        reactionRoleInfo = {
          [msg.id]: [
            {
              name: 'Drunk',
              reaction: env.EMOJI_DRUNK.slice(env.EMOJI_DRUNK.indexOf(':', 3)+1, env.EMOJI_DRUNK.indexOf('>')),
              roleId: env.ROLE_DRUNK,
            },
            {
              name: 'High',
              reaction: env.EMOJI_HIGH.slice(env.EMOJI_HIGH.indexOf(':', 3)+1, env.EMOJI_HIGH.indexOf('>')),
              roleId: env.ROLE_HIGH,
            },
            {
              name: 'Rolling',
              reaction: env.EMOJI_ROLLING.slice(env.EMOJI_ROLLING.indexOf(':', 3)+1, env.EMOJI_ROLLING.indexOf('>')),
              roleId: env.ROLE_ROLLING,
            },
            {
              name: 'Tripping',
              reaction: env.EMOJI_TRIPPING.slice(env.EMOJI_TRIPPING.indexOf(':', 3)+1, env.EMOJI_TRIPPING.indexOf('>')),
              roleId: env.ROLE_TRIPPING,
            },
            {
              name: 'Dissociating',
              reaction: env.EMOJI_DISSOCIATING.slice(env.EMOJI_DISSOCIATING.indexOf(':', 3)+1, env.EMOJI_DISSOCIATING.indexOf('>')),
              roleId: env.ROLE_DISSOCIATING,
            },
            {
              name: 'Stimming',
              reaction: env.EMOJI_STIMMING.slice(env.EMOJI_STIMMING.indexOf(':', 3)+1, env.EMOJI_STIMMING.indexOf('>')),
              roleId: env.ROLE_STIMMING,
            },
            {
              name: 'Sedated',
              reaction: env.EMOJI_SEDATED.slice(env.EMOJI_SEDATED.indexOf(':', 3)+1, env.EMOJI_SEDATED.indexOf('>')),
              roleId: env.ROLE_NODDING,
            },
            {
              name: 'Talkative',
              reaction: env.EMOJI_TALKATIVE.slice(env.EMOJI_TALKATIVE.indexOf(':', 3)+1, env.EMOJI_TALKATIVE.indexOf('>')),
              roleId: env.ROLE_TALKATIVE,
            },
            {
              name: 'Working',
              reaction: env.EMOJI_WORKING.slice(env.EMOJI_WORKING.indexOf(':', 3)+1, env.EMOJI_WORKING.indexOf('>')),
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
        await msg.react(env.EMOJI_PINKHEART);
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
            reaction: env.EMOJI_PINKHEART.slice(env.EMOJI_PINKHEART.indexOf(':', 3)+1, env.EMOJI_PINKHEART.indexOf('>')),
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

  // **3)** I understand that every room with a :link: is bridged to IRC and there may be lower quality chat in those rooms.

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
  **3)** I have read the ${channelRules!.toString()}: I will not buy/sell anything and I will try to keep a positive atmosphere!
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
