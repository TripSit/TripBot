'use strict';

const path = require('path');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { stripIndents } = require('common-tags');
const logger = require('../../../global/logger');
const template = require('../../../global/embed-template');

const PREFIX = path.parse(__filename).name;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('about')
    .setDescription('Shows information about this bot!'),

  async execute(interaction) {
    const embed = template.embedTemplate()
      .setColor('DARK_BLUE')
      .setTitle('About TripSit')
      .setURL('https://tripsit.me/about/')
      .setDescription(`
        This app is created by TripSit, an organisation which helps to provide factual information\
        about drugs and how to reduce the harms involved in using them.
      `)
      .addFields(
        {
          name: 'Disclaimer',
          value: stripIndents`
            Although we have a team dedicated to keeping the information on this app up to date,\
            it is not always possible to provide entirely accurate information on the safety\
            level of drugs. The information here should be used as guidelines only, and it is\
            important to do your own research from multiple sources before ingesting a substance.
            We also strongly advise using a testing kit and scales to ensure you are taking the\
            correct dosage. These can both be bought online for reasonable prices.
          `,
        },
        {
          name: 'Support TripSit',
          value: stripIndents`
            TripSit is a completely free service run by volunteers.
            If you wish to help out, feel free to join the [IRC](https://chat.tripsit.me) or the [discord](https://discord.gg/TripSit),\
            follow and share our content on social media, or make a donation on the [Patreon](https://www.patreon.com/TripSit)!
          `,
        },
        {
          name: 'Feedback',
          value: stripIndents`
            We would love to hear your feedback on this bot!
            Join the [TripSit discord](https://discord.gg/TripSit) and talk with Moonbear!
            Or use the /bug command and to send a message!
          `,
        },
        {
          name: 'Credits',
          value: stripIndents`
            The bot is built using the [Discord.js library](https://discordjs.guide/)
            A majority of this code is original, and is available on [GitHub](https://github.com/tripsit/tripsit-discord-bot)
            The data is sourced from the [TripSit and Psychonaut Wiki API combined](https://github.com/NoahSaso/merge-psychonautwiki-tripsit-data)
            The DXM calculator comes from [Tripsit](https://github.com/TripSit/DXM-Calculator)
            The Benzo calculator comes from [Tripsit](https://github.com/TripSit/Benzo-Calculator)
            The Ketamine calculator and pill_id code was inspired by [PsyBot](https://github.com/v0idp/PsyBot)
            The LSD calculator info was inspired from [this codepen](https://codepen.io/cyberoxide/pen/BaNarGd)
            The actual [research for the LSD calculator](https://www.reddit.com/r/LSD/comments/4dzh9s/lsd_tolerance_calculator_improved/)
          `,
        },
      );
    try {
      logger.debug(`[${PREFIX}] replied:`, interaction.replied);
      if (!interaction.replied) {
        interaction.reply({
          embeds: [embed],
          ephemeral: false,
        });
      } else {
        interaction.followUp({
          embeds: [embed],
          ephemeral: false,
        });
      }
    } catch (ex) {
      logger.error(`[${PREFIX}]`, ex);
    }
    logger.debug(`[${PREFIX}] finished!`);
  },
};
