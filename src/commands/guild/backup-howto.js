'use strict';

const path = require('path');
const { MessageAttachment } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { stripIndents } = require('common-tags');
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

const channelTripsitId = process.env.channel_tripsit;
// const channelSanctuaryId = process.env.channel_sanctuary;
// const channelDrugQuestionsId = process.env.channel_drugquestions;
const channelTripsitInfoId = process.env.channel_tripsitinfo;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('how-to-tripsit')
    .setDescription('Re-creates the how-to-tripsit information!'),
  async execute(interaction) {
    // await interaction.deferReply();
    const finalEmbed = template.embedTemplate()
      .setTitle('Info created!');
    interaction.reply({ embeds: [finalEmbed], ephemeral: true });
    logger.debug(`[${PREFIX}] Starting!`);
    const embed = template.embedTemplate()
      .setAuthor({ name: '', iconURL: '', url: '' })
      .setFooter({ text: '', iconURL: '' })
      .setColor('BLUE');

    const channelTripsit = interaction.client.channels.cache.get(channelTripsitId);
    const channelTripsitInfo = interaction.client.channels.cache.get(channelTripsitInfoId);

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

    embed.setImage('attachment://tripsitButton.png');
    await channelTripsitInfo.send({ embeds: [embed], files: [tripsitButton], ephemeral: false });

    // await channelTripsitInfo.send(stripIndents`
    // <:invisible:976824380564852768>
    // > Clicking this button will display a modal popup asking for information:
    // <:invisible:976824380564852768>
    // `);

    // embed.setImage('attachment://userInput.png');
    // await channelTripsitInfo.send({ embeds: [embed], files: [userInput], ephemeral: false });

    // await channelTripsitInfo.send(stripIndents`
    // <:invisible:976824380564852768>
    // > All of these questions are optional but are super helpful to have handy before alerting the team.
    // > This can also potentially limit people from “testing” the button if they know this will actually submit something.
    // > When ready, the user submits the modal, and an embed message appears thanking you for asking for help:
    // <:invisible:976824380564852768>
    // `);

    // embed.setImage('attachment://firstResponse.png');
    // await channelTripsitInfo.send({ embeds: [embed], files: [firstResponse], ephemeral: false });

    // await channelTripsitInfo.send(stripIndents`
    // <:invisible:976824380564852768>
    // > It will then create a new thread in the ${channelTripsit.toString()} room asking the user to chat in that thread:
    // <:invisible:976824380564852768>
    // `);

    // embed.setImage('attachment://privateThread.png');
    // await channelTripsitInfo.send({ embeds: [embed], files: [privateThread], ephemeral: false });

    // await channelTripsitInfo.send(stripIndents`
    // <:invisible:976824380564852768>
    // > When they click into this thread they will see:
    // <:invisible:976824380564852768>
    // `);

    // embed.setImage('attachment://privateMessage.png');
    // await channelTripsitInfo.send({ embeds: [embed], files: [privateMessage], ephemeral: false });

    // await channelTripsitInfo.send(stripIndents`
    // <:invisible:976824380564852768>
    // > This is a private thread: only people who are mentioned can see and participate.
    // > By default these are the **Tripsitter** and **Helper** roles
    // <:invisible:976824380564852768>
    // > Meanwhile, ${channelTripsitInfo.toString()} is the "meta-tripsit" room to talk about encounters in ${channelTripsit.toString()}
    // > When someone clicks the “I need assistance” button in the ${channelTripsit.toString()} room, a new private thread is started in ${channelTripsitInfo.toString()}.
    // > The bot pings **Tripsitters** and **Helpers** so that these are the only people who can see this thread!
    // <:invisible:976824380564852768>
    // `);

    // embed.setImage('attachment://discussThread.png');
    // await channelTripsitInfo.send({ embeds: [embed], files: [discussThread], ephemeral: false });

    // await channelTripsitInfo.send(stripIndents`
    // <:invisible:976824380564852768>
    // > When they click into this thread they will see the following.
    // > Notice how since "moonbear" isnt @ mentioned, they wont see this thread!
    // <:invisible:976824380564852768>
    // `);

    // embed.setImage('attachment://discussMessage.png');
    // await channelTripsitInfo.send({ embeds: [embed], files: [discussMessage], ephemeral: false });

    // await channelTripsitInfo.send(stripIndents`
    // <:invisible:976824380564852768>
    // > **Are you interested in helping out in the Harm Reduction Centre?**
    // > By reacting to this message you will be given the **Helper** role.
    // > This will give you access to the ${channelTripsitters.toString()} room, and \
    // you will be notified when people need assistance in the ${channelTripsit.toString()} room.
    // > You are not required to respond to notices, **this role is completely optional**, //
    // but we appreciate the help!
    // <:invisible:976824380564852768>
    // Thanks for reading, stay safe!
    // `);

    logger.debug(`[${PREFIX}] finished!`);
  },
};
