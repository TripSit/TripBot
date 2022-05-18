'use strict';

const path = require('path');
const { MessageAttachment, MessageEmbed } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { stripIndents } = require('common-tags');
const logger = require('../../utils/logger');
const template = require('../../utils/embed-template');

const PREFIX = path.parse(__filename).name;

const file = new MessageAttachment('./src/assets/img/RULES.png');

const channelRulesId = process.env.channel_rules;
const channelTripsitId = process.env.channel_tripsit;
const channelSanctuaryId = process.env.channel_sanctuary;
const channelIrcId = process.env.channel_irc;
const channelDrugQuestionsId = process.env.channel_drugquestions;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rules')
    .setDescription('Re-creates the rules in the #rules channel!'),
  async execute(interaction) {
    // await interaction.deferReply();
    const finalEmbed = template.embedTemplate()
      .setTitle('Rules created!');
    interaction.reply({ embeds: [finalEmbed], ephemeral: true });
    logger.debug(`[${PREFIX}] Starting!`);
    const channelRules = interaction.client.channels.cache.get(channelRulesId);
    const channelTripsit = interaction.client.channels.cache.get(channelTripsitId);
    // const channelSanctuary = interaction.client.channels.cache.get(channelSanctuaryId);
    // const channelIrc = interaction.client.channels.cache.get(channelIrcId);
    const channelQuestions = interaction.client.channels.cache.get(channelDrugQuestionsId);

    const embed = template.embedTemplate()
      .setAuthor({ name: '', iconURL: '', url: '' })
      .setFooter({ text: '', iconURL: '' })
      .setColor('RED')
      .setImage('attachment://RULES.png');
    await channelRules.send({ embeds: [embed], files: [file], ephemeral: false });

    await channelRules.send(stripIndents`
    > **-** **You can be banned without warning if you do not follow the rules!**
    > **-** The "Big 4" rules are below, but generally be positive, be safe, and dont buy/sell stuff and you'll be fine.
    > **-** If you need to clarify anything you can review the full unabridged network rules: https://wiki.tripsit.me/wiki/Rules
    > **-** The moderators reserve the right to remove those who break the 'spirit' of the rules, even if they don't break any specific rule.
    > **-** If you see something against the rules or something that makes you feel unsafe, let the team know. We want this server to be a welcoming space!
    ᲼᲼
    `);

    await channelRules.send(stripIndents`
    > **🔞 1. You must be over 18 to participate in most channels!**
    > **-** We believe that minors will use substances regardless of the info available to them so the best we can do is educate properly and send them on their way.
    > **-** ${channelTripsit.toString()} allows minors to get help from a tripsitter.
    > **-** ${channelQuestions.toString()} allows minors to ask questions on substances.
    > **-** We appreciate the support, but beyond this it is our belief that minors have more productive activitives than contributing to a harm reduction network <3
    ᲼᲼
    `);

    await channelRules.send(stripIndents`
    > **💊 2. No Sourcing!**
    > **-** Don't post anything that would help you or others acquire drugs; legal or illegal, neither in the server nor in DMs.
    > **-** Assume anyone attempting to buy or sell something is a scammer. Report scammers to the team to get a (virtual) cookie.
    > **-** You may source harm reduction supplies and paraphernalia, providing that the source doesn't distribute any substances.
    > **-** No self-promotion (server invites, advertisements, etc) without permission from a staff member.
    ᲼᲼
    `);

    await channelRules.send(stripIndents`
    > **💰 3. Do not encourage unsafe usage!**
    > **-** Don't encourage or enable dangerous drug use; don't spread false, dangerous, or misleading information about drugs.
    > **-** Keep your dosage information and stash private unless it's relevant to a question. Posting absurd dosages to get a reaction will receive a reaction (a ban).
    > **-** Hard drug use (beyond nicotine or THC) or driving on camera is not allowed in the voice rooms.
    > **-** No substance identification - no one can tell you which drugs, or how much of them, you have just by looking at them. #harm-reduction
    ᲼᲼
    `);

    await channelRules.send(stripIndents`
    > **❤️ 4. Treat everyone with respect!**
    > **-** Don't participate in behaviour that purposefully causes discomfort to others.
    > **-** Don't submit anything that drastically disturbs the flow of chat without providing any added value.
    > **-** That includes: Mic spam, reaction spam, taking six messages to formulate one sentence, etc.
    > **-** Don't post content that is unnecessarily inflammatory, provocative, or controversial. Read the atmosphere, and recognize when you've gone too far.
    ᲼᲼
    `);

    logger.debug(`[${PREFIX}] finished!`);
  },
};
