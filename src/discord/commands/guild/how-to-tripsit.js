'use strict';

const { MessageAttachment } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { ReactionRole } = require('discordjs-reaction-role');
const { stripIndents } = require('common-tags');
const PREFIX = require('path').parse(__filename).name;
const { getGuildInfo, setGuildInfo } = require('../../../global/firebase');
const logger = require('../../../global/logger');
const template = require('../../../global/embed-template');

const tripsitButton = new MessageAttachment('./src/assets/img/1_button.png');
const userInput = new MessageAttachment('./src/assets/img/2_input.png');
const firstResponse = new MessageAttachment('./src/assets/img/3_firstResponse.png');
const privateThread = new MessageAttachment('./src/assets/img/4_privateThread.png');
const privateMessage = new MessageAttachment('./src/assets/img/5_privateMessage.png');
const discussThread = new MessageAttachment('./src/assets/img/6_discussionThread.png');
const discussMessage = new MessageAttachment('./src/assets/img/7_discussionMessage.png');
const endMessage = new MessageAttachment('./src/assets/img/8_endMessage.png');
const surveyRequest = new MessageAttachment('./src/assets/img/9_surveyRequest.png');

const {
  // discordOwnerId,
  NODE_ENV,
  channelTripsitId,
  channelTripsittersId,
  // channelSanctuaryId,
  // channelDrugQuestionsId,
  channelHowToTripsitId,
  roleHelperId,
} = require('../../../../env');

const helperEmoji = NODE_ENV === 'production'
  ? '<:ts_helper:979362238789992538>'
  : '<:ts_helper:980934790956077076>';

const invisibleEmoji = NODE_ENV === 'production'
  ? '<:invisible:976853930489298984>'
  : '<:invisible:976824380564852768>';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('how-to-tripsit')
    .setDescription('Re-creates the how-to-tripsit information!'),
  async execute(interaction) {
    // await interaction.deferReply();
    // const finalEmbed = template.embedTemplate()
    //   .setTitle('Info created!');
    // interaction.reply({ embeds: [finalEmbed], ephemeral: true });
    logger.debug(`[${PREFIX}] Starting!`);

    const embed = template.embedTemplate()
      .setAuthor({ name: '', iconURL: '', url: '' })
      .setFooter({ text: '', iconURL: '' })
      .setColor('BLUE');

    const channelTripsit = interaction.client.channels.cache.get(channelTripsitId);
    const channelTripsitInfo = interaction.client.channels.cache.get(channelHowToTripsitId);
    const channelTripsitters = interaction.client.channels.cache.get(channelTripsittersId);

    // Extract guild data
    const [targetGuildData, targetGuildFbid] = await getGuildInfo(interaction.guild);

    // Transform guild data
    const reactionRoles = targetGuildData.reactionRoles ? targetGuildData.reactionRoles : {};

    await channelTripsitInfo.send(stripIndents`
      > **About TripSit Discord**
      > TripSit has always been a bit...different.
      > Our discord is no exception: Even if you've been using discord for years please take a moment to read the info here.
      > The information on this page can help you understand some of the intricaces of this guild, for example:
      > This channel is only visible to VIP users, which means you have talked enough in the general channels to show you're not a troll.
      > **If a user has three <:ts_votedown:960161563849932892> put on a message they are put in "timeout" where they cannot speak until a moderator reviews!**
      ${invisibleEmoji}
      > **How to use TripSit**
      > ${channelTripsit.toString()} is our main help channel, this is where people who need assistance will be gently pushed.
      > This room is in "thread-only" or "forum" mode so that people will see the notice posted:
      ${invisibleEmoji}
      `);

    embed.setImage('attachment://1_button.png');
    await channelTripsitInfo.send(
      { embeds: [embed], files: [tripsitButton], ephemeral: false },
    );

    await channelTripsitInfo.send(stripIndents`
      ${invisibleEmoji}
      > Clicking this button will display a modal popup asking for information:
      ${invisibleEmoji}
      `);

    embed.setImage('attachment://2_input.png');
    await channelTripsitInfo.send({ embeds: [embed], files: [userInput], ephemeral: false });

    await channelTripsitInfo.send(stripIndents`
      ${invisibleEmoji}
      > All of these questions are optional but are super helpful to have handy before alerting the team.
      > This can also potentially limit people from “testing” the button if they know this will actually submit something.
      > When ready, the user submits the modal, and the fun begins:

      1) All of the user’s roles (and access to social channels) are removed (and saved to the database)
      2) The user is given the NeedsHelp role, which removes access to rooms that “everyone” can access.
      3) The bot starts a new private thread called “<user> chat here!” that mentions the user, tripsitters and helpers.
      4) The bot responds to the user in #tripsit with a thank you message and directs them to click on the new thread:
      ${invisibleEmoji}
      `);

    embed.setImage('attachment://3_firstResponse.png');
    await channelTripsitInfo.send(
      { embeds: [embed], files: [firstResponse], ephemeral: false },
    );

    await channelTripsitInfo.send(stripIndents`
      ${invisibleEmoji}
      > The end result is that a user who NeedsHelp will be able to see the following after submitting the button::
      ${invisibleEmoji}
      `);

    embed.setImage('attachment://4_privateThread.png');
    await channelTripsitInfo.send(
      { embeds: [embed], files: [privateThread], ephemeral: false },
    );

    await channelTripsitInfo.send(stripIndents`
      ${invisibleEmoji}
      > When they click into this thread they will see:
      ${invisibleEmoji}
      `);

    embed.setImage('attachment://5_privateMessage.png');
    await channelTripsitInfo.send(
      { embeds: [embed], files: [privateMessage], ephemeral: false },
    );

    await channelTripsitInfo.send(stripIndents`
      ${invisibleEmoji}
      > This is a private thread: only people who are mentioned can see and participate.
      > By default these are the **Tripsitter** and **Helper** roles
      > This thread will also auto-archive after 24 hours. This allows the user to follow-up the next day.
      > After 7 days we manually delete the thread to preserve privacy and clean up space.
      ${invisibleEmoji}
      > Meanwhile, ${channelTripsitters.toString()} is the "meta-tripsit" room to talk about encounters in ${channelTripsit.toString()}
      > When someone clicks the “I need assistance” button in the ${channelTripsit.toString()} room, a new private thread is started in ${channelTripsitters.toString()}.
      > The bot pings **Tripsitters** and **Helpers** so that these are the only people who can see this thread!
      ${invisibleEmoji}
      `);

    embed.setImage('attachment://6_discussionThread.png');
    await channelTripsitInfo.send(
      { embeds: [embed], files: [discussThread], ephemeral: false },
    );

    await channelTripsitInfo.send(stripIndents`
      ${invisibleEmoji}
      > When they click into this thread they will see the following.
      > Notice how since "moonbear" isnt @ mentioned, they wont see this thread!
      ${invisibleEmoji}
      `);

    embed.setImage('attachment://7_discussionMessage.png');
    await channelTripsitInfo.send(
      { embeds: [embed], files: [discussMessage], ephemeral: false },
    );

    await channelTripsitInfo.send(stripIndents`
    ${invisibleEmoji}
    > Finally, when the user is finished, they can click the “I’m good now” button in the #tripsit room.
    > This will restore their old roles and bring them back to “normal”.
    ${invisibleEmoji}
    `);

    embed.setImage('attachment://8_endMessage.png');
    await channelTripsitInfo.send(
      { embeds: [embed], files: [endMessage], ephemeral: false },
    );

    await channelTripsitInfo.send(stripIndents`
    ${invisibleEmoji}
    > The user will be shown a message asking them to rate their experience:
    ${invisibleEmoji}
    `);

    embed.setImage('attachment://9_surveyRequest.png');
    await channelTripsitInfo.send(
      { embeds: [embed], files: [surveyRequest], ephemeral: false },
    );

    await channelTripsitInfo.send(stripIndents`
      ${invisibleEmoji}
      > In conclusion: People who need help can click the "I need assistance" button in the ${channelTripsit.toString()} room.
      > They enter their question and a private thread is created in ${channelTripsit.toString()}.
      > This is a self-contained channel so that trolls/randoms cannot access what they're saying.
      > The thread created in ${channelTripsitters.toString()} is also private from non-helpers.
      > This thread lets us coordinate tactics on the encounter without disturbing the user.
      > When the user no longer needs help they can click a button and return to normal.
      > The user has 24 hours to follow-up on the thread before it's archived, and we can re-use the thread for a week before it's deleted.
      > This is basically the ideal way to TripSit someone!
      ${invisibleEmoji}
      `);

    await channelTripsitInfo.send(stripIndents`
        ${invisibleEmoji}
        > **Are you interested in helping out in the Harm Reduction Centre?**
        > By reacting to this message you will be given the **Helper** role.
        > This will give you access to the ${channelTripsitters.toString()} room, and you will be notified when people need assistance in the ${channelTripsit.toString()} room.
        > You are not required to respond to notices, **this role is completely optional**, but we appreciate the help!
        ${invisibleEmoji}
        `)
      .then(async msg => {
        reactionRoles.howToTripsit = [{
          messageId: msg.id,
          reaction: `${helperEmoji.slice(2, -20)}`,
          roleId: roleHelperId,
        }];
        await msg.react(`${helperEmoji}`);
      });

    logger.debug(`[${PREFIX}] reactionRoles: ${JSON.stringify(reactionRoles)}`);

    targetGuildData.reactionRoles = reactionRoles;

    // Load data
    await setGuildInfo(targetGuildFbid, targetGuildData);

    let reactionConfig = [];
    Object.keys(reactionRoles).forEach(key => {
      logger.debug(`[${PREFIX}] key: ${key}`);
      logger.debug(`[${PREFIX}] reactionRoles[${key}] = ${JSON.stringify(reactionRoles[key], null, 2)}`);
      // reactionConfig = reactionRoles[key]; this works
      reactionConfig = reactionConfig.concat(reactionRoles[key]);
    });

    // logger.debug(`[${PREFIX}] reactionConfig: ${JSON.stringify(reactionConfig, null, 2)}`);
    global.manager = new ReactionRole(interaction.client, reactionConfig);
    logger.debug(`[${PREFIX}] finished!`);
  },
};
