'use strict';

const path = require('path');
const { MessageAttachment } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { stripIndents } = require('common-tags');
const logger = require('../../utils/logger');
const template = require('../../utils/embed-template');

const PREFIX = path.parse(__filename).name;

const tripsitButton = new MessageAttachment('./src/assets/img/tripsitButton.png');
const firstResponse = new MessageAttachment('./src/assets/img/firstResponse.png');
const privateThread = new MessageAttachment('./src/assets/img/privateThread.png');
const privateMessage = new MessageAttachment('./src/assets/img/privateMessage.png');
const discussThread = new MessageAttachment('./src/assets/img/discussThread.png');
const discussMessage = new MessageAttachment('./src/assets/img/discussMessage.png');

const channelTripsitId = process.env.channel_tripsit;
// const channelSanctuaryId = process.env.channel_sanctuary;
// const channelDrugQuestionsId = process.env.channel_drugquestions;
const channelTripsittersId = process.env.channel_tripsitters;

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
    const channelTripsitters = interaction.client.channels.cache.get(channelTripsittersId);

    await channelTripsitters.send(stripIndents`
    > **About TripSit Discord**
    > TripSit has always been a bit...different.
    > Our discord is no exception: Even if you've been using discord for years please take a moment to read the info here.
    > The information on this page can help you understand some of the intricaces of this guild, for example:
    > This channel is only visible to VIP users, which means you have talked enough to reach level 2 with the Mee6 bot.
    > **If a user has three :ts_downvote: put on a message they are put in "timeout" where they cannot speak until a moderator reviews!**
    ᲼᲼
    > **How to use TripSit**
    > ${channelTripsit.toString()} is our main help channel, this is where people who need assistance will be gently pushed.
    > This room is in "thread-only" or "forum" mode so that people will see the notice posted:
    ᲼᲼
    `);

    embed.setImage('attachment://tripsitButton.png');
    await channelTripsitters.send({ embeds: [embed], files: [tripsitButton], ephemeral: false });

    await channelTripsitters.send(stripIndents`
    ᲼᲼
    > Clicking this button will display an embed message thanking you for asking for help:
    ᲼᲼
    `);

    embed.setImage('attachment://firstResponse.png');
    await channelTripsitters.send({ embeds: [embed], files: [firstResponse], ephemeral: false });

    await channelTripsitters.send(stripIndents`
    ᲼᲼
    > It will then create a new thread in the ${channelTripsit.toString()} room asking the user to chat in that thread:
    ᲼᲼
    `);

    embed.setImage('attachment://privateThread.png');
    await channelTripsitters.send({ embeds: [embed], files: [privateThread], ephemeral: false });

    await channelTripsitters.send(stripIndents`
    ᲼᲼
    > When they click into this thread they will see:
    ᲼᲼
    `);

    embed.setImage('attachment://privateMessage.png');
    await channelTripsitters.send({ embeds: [embed], files: [privateMessage], ephemeral: false });

    await channelTripsitters.send(stripIndents`
    ᲼᲼
    > This is a private thread: only people who are mentioned can see and participate.
    > By default these are the **Tripsitter** and **Helper** roles
    ᲼᲼
    > Meanwhile, ${channelTripsitters.toString()} is the "meta-tripsit" room to talk about encounters in ${channelTripsit.toString()}
    > When someone clicks the “I need assistance” button in the ${channelTripsit.toString()} room, a new private thread is started in ${channelTripsitters.toString()}.
    > The bot pings **Tripsitters** and **Helpers** so that these are the only people who can see this thread!
    ᲼᲼
    `);

    embed.setImage('attachment://discussThread.png');
    await channelTripsitters.send({ embeds: [embed], files: [discussThread], ephemeral: false });

    await channelTripsitters.send(stripIndents`
    ᲼᲼
    > When they click into this thread they will see the following.
    > Notice how since "moonbear" isnt @ mentioned, they wont see this thread!
    ᲼᲼
    `);

    embed.setImage('attachment://discussMessage.png');
    await channelTripsitters.send({ embeds: [embed], files: [discussMessage], ephemeral: false });

    // await channelTripsitters.send(stripIndents`
    // ᲼᲼
    // > **Are you interested in helping out in the Harm Reduction Centre?**
    // > By reacting to this message you will be given the **Helper** role.
    // > This will give you access to the ${channelTripsitters.toString()} room, and you will be notified when people need assistance in the ${channelTripsit.toString()} room.
    // > You are not required to respond to notices, **this role is completely optional**, but we appreciate the help!
    // ᲼᲼
    // Thanks for reading, stay safe!
    // `);

    logger.debug(`[${PREFIX}] finished!`);
  },
};
