'use strict';

const { SlashCommandBuilder } = require('discord.js');
const PREFIX = require('path').parse(__filename).name;
const logger = require('../../../global/utils/logger');
const tripsitme = require('../../utils/tripsitme');
const tripsat = require('../../utils/tripsat');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('tripsit')
    .setDescription(
      'This command will apply the NeedsHelp role onto a user, and remove other roles!',
    )
    .addUserOption(option => option
      .setName('user')
      .setDescription('Member to help')
      .setRequired(true))
    .addStringOption(option => option
      .setName('their_dosage')
      .setDescription('What have they taken?'))
    .addStringOption(option => option
      .setName('their_issue')
      .setDescription('What\'s going on with them?'))
    .addStringOption(option => option
      .setName('enable')
      .setDescription('On or Off?')
      .addChoices(
        { name: 'On', value: 'on' },
        { name: 'Off', value: 'off' },
      )),

  async execute(interaction) {
    let enable = interaction.options.getString('enable');
    // Default to on if no setting is provided
    if (!enable) { enable = 'on'; }

    const target = interaction.options.getMember('user');
    const triage = interaction.options.getString('their_dosage');
    const input = interaction.options.getString('their_issue');

    logger.debug(`[${PREFIX}] target: ${target}`);
    logger.debug(`[${PREFIX}] triage: ${triage}`);
    logger.debug(`[${PREFIX}] input: ${input}`);
    logger.debug(`[${PREFIX}] enable: ${enable}`);

    if (enable === 'on') {
      tripsitme.submit(interaction, target, triage, input);
    }
    if (enable === 'off') {
      tripsat.execute(interaction, target);
    }
  },
};
