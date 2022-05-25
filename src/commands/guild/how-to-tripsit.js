'use strict';

const path = require('path');
const { MessageAttachment } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { ReactionRole } = require('discordjs-reaction-role');
const { stripIndents } = require('common-tags');
const { getGuildInfo, setGuildInfo } = require('../../utils/firebase');
const logger = require('../../utils/logger');
const template = require('../../utils/embed-template');

const PREFIX = path.parse(__filename).name;

const tripsitButton = new MessageAttachment('./src/assets/img/1_button.png');
const userInput = new MessageAttachment('./src/assets/img/2_input.png');
const firstResponse = new MessageAttachment('./src/assets/img/3_firstResponse.png');
const privateThread = new MessageAttachment('./src/assets/img/4_privateThread.png');
const privateMessage = new MessageAttachment('./src/assets/img/5_privateMessage.png');
const discussThread = new MessageAttachment('./src/assets/img/6_discussionThread.png');
const discussMessage = new MessageAttachment('./src/assets/img/7_discussionMessage.png');
const endMessage = new MessageAttachment('./src/assets/img/8_endMessage.png');

const {
  // discordOwnerId,
  // NODE_ENV,
  channelTripsitId,
  channelTripsittersId,
  // channelSanctuaryId,
  // channelDrugQuestionsId,
  channelTripsitInfoId,
  roleHelperId,
} = require('../../../env');

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
    const channelTripsitInfo = interaction.client.channels.cache.get(channelTripsitInfoId);
    const channelTripsitters = interaction.client.channels.cache.get(channelTripsittersId);

    // const command = await interaction.client.commands.get('clear-chat');
    // await command.execute(interaction, channelTripsitInfo)
    //   .then(async () => {
    await channelTripsitInfo.send(stripIndents`
      > **About TripSit Discord**
      > TripSit has always been a bit...different.
      > Our discord is no exception: Even if you've been using discord for years please take a moment to read the info here.
      > The information on this page can help you understand some of the intricaces of this guild, for example:
      > This channel is only visible to VIP users, which means you have talked enough to reach level 2 with the Mee6 bot.
      > **If a user has three <:ts_down:960161563849932892> put on a message they are put in "timeout" where they cannot speak until a moderator reviews!**
      <:invisible:976824380564852768>
      > **How to use TripSit**
      > ${channelTripsit.toString()} is our main help channel, this is where people who need assistance will be gently pushed.
      > This room is in "thread-only" or "forum" mode so that people will see the notice posted:
      <:invisible:976824380564852768>
      `);

    embed.setImage('attachment://1_button.png');
    await channelTripsitInfo.send(
      { embeds: [embed], files: [tripsitButton], ephemeral: false },
    );

    await channelTripsitInfo.send(stripIndents`
      <:invisible:976824380564852768>
      > Clicking this button will display a modal popup asking for information:
      <:invisible:976824380564852768>
      `);

    embed.setImage('attachment://2_input.png');
    await channelTripsitInfo.send({ embeds: [embed], files: [userInput], ephemeral: false });

    await channelTripsitInfo.send(stripIndents`
      <:invisible:976824380564852768>
      > All of these questions are optional but are super helpful to have handy before alerting the team.
      > This can also potentially limit people from “testing” the button if they know this will actually submit something.
      > When ready, the user submits the modal, and the fun begins:

      1) All of the user’s roles (and access to social channels) are removed (and saved to the database)
      2) The user is given the NeedsHelp role, which removes access to rooms that “everyone” can access.
      3) The bot starts a new private thread called “<user> chat here!” that mentions the user, tripsitters and helpers.
      4) The bot responds to the user in #tripsit with a thank you message and directs them to click on the new thread:
      <:invisible:976824380564852768>
      `);

    embed.setImage('attachment://3_firstResponse.png');
    await channelTripsitInfo.send(
      { embeds: [embed], files: [firstResponse], ephemeral: false },
    );

    await channelTripsitInfo.send(stripIndents`
      <:invisible:976824380564852768>
      > The end result is that a user who NeedsHelp will be able to see the following after submitting the button::
      <:invisible:976824380564852768>
      `);

    embed.setImage('attachment://4_privateThread.png');
    await channelTripsitInfo.send(
      { embeds: [embed], files: [privateThread], ephemeral: false },
    );

    await channelTripsitInfo.send(stripIndents`
      <:invisible:976824380564852768>
      > When they click into this thread they will see:
      <:invisible:976824380564852768>
      `);

    embed.setImage('attachment://5_privateMessage.png');
    await channelTripsitInfo.send(
      { embeds: [embed], files: [privateMessage], ephemeral: false },
    );

    await channelTripsitInfo.send(stripIndents`
      <:invisible:976824380564852768>
      > This is a private thread: only people who are mentioned can see and participate.
      > By default these are the **Tripsitter** and **Helper** roles
      > This thread will also auto-archive after 24 hours. This allows the user to follow-up the next day.
      > After 7 days we manually delete the thread to preserve privacy and clean up space.
      <:invisible:976824380564852768>
      > Meanwhile, ${channelTripsitters.toString()} is the "meta-tripsit" room to talk about encounters in ${channelTripsit.toString()}
      > When someone clicks the “I need assistance” button in the ${channelTripsit.toString()} room, a new private thread is started in ${channelTripsitters.toString()}.
      > The bot pings **Tripsitters** and **Helpers** so that these are the only people who can see this thread!
      <:invisible:976824380564852768>
      `);

    embed.setImage('attachment://6_discussionThread.png');
    await channelTripsitInfo.send(
      { embeds: [embed], files: [discussThread], ephemeral: false },
    );

    await channelTripsitInfo.send(stripIndents`
      <:invisible:976824380564852768>
      > When they click into this thread they will see the following.
      > Notice how since "moonbear" isnt @ mentioned, they wont see this thread!
      <:invisible:976824380564852768>
      `);

    embed.setImage('attachment://7_discussionMessage.png');
    await channelTripsitInfo.send(
      { embeds: [embed], files: [discussMessage], ephemeral: false },
    );

    await channelTripsitInfo.send(stripIndents`
    <:invisible:976824380564852768>
    > Finally, when the user is finished, they can click the “I’m good now” button in the #tripsit room.
    > This will restore their old roles and bring them back to “normal”.
    <:invisible:976824380564852768>
    `);

    embed.setImage('attachment://8_endMessage.png');
    await channelTripsitInfo.send(
      { embeds: [embed], files: [endMessage], ephemeral: false },
    );

    await channelTripsitInfo.send(stripIndents`
      <:invisible:976824380564852768>
      > In conclusion: People who need help can click the "I need assistance" button in the ${channelTripsit.toString()} room.
      > They enter their question and a private thread is created in ${channelTripsit.toString()}.
      > This is a self-contained channel so that trolls/randoms cannot access what they're saying.
      > The thread created in ${channelTripsitters.toString()} is also private from non-helpers.
      > This thread lets us coordinate tactics on the encounter without disturbing the user.
      > When the user no longer needs help they can click a button and return to normal.
      > The user has 24 hours to follow-up on the thread before it's archived, and we can re-use the thread for a week before it's deleted.
      > This is basically the ideal way to TripSit someone!
      <:invisible:976824380564852768>
      `);

    let helperMessage = '';
    await channelTripsitInfo.send(stripIndents`
        <:invisible:976824380564852768>
        > **Are you interested in helping out in the Harm Reduction Centre?**
        > By reacting to this message you will be given the **Helper** role.
        > This will give you access to the ${channelTripsitters.toString()} room, and you will be notified when people need assistance in the ${channelTripsit.toString()} room.
        > You are not required to respond to notices, **this role is completely optional**, but we appreciate the help!
        <:invisible:976824380564852768>
        `)
      .then(async msg => {
        helperMessage = msg;
        await msg.react('🐕‍🦺');
      });

    // Extract data
    const targetResults = await getGuildInfo(interaction.guild);
    const targetData = targetResults[0];

    // Transform data
    const reactionConfig = targetData.reactionRoles;
    reactionConfig.push(
      {
        messageId: helperMessage.id,
        reaction: '🐕‍🦺',
        roleId: roleHelperId,
      },
    );

    const manager = new ReactionRole(interaction.client, reactionConfig);
    global.manager = manager;

    targetData.reactionRoles = reactionConfig;
    // logger.debug(`[${PREFIX}] target_data: ${JSON.stringify(targetData)}`);

    // Load data
    await setGuildInfo(targetResults[1], targetData);
    // });

    logger.debug(`[${PREFIX}] finished!`);
  },
};
