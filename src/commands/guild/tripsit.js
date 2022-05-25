'use strict';

const { SlashCommandBuilder } = require('@discordjs/builders');
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
      .setName('enable')
      .setDescription('On or Off?')
      .addChoice('On', 'On')
      .addChoice('Off', 'Off')),

  async execute(interaction) {
    let enable = interaction.options.getString('enable');
    // Default to on if no setting is provided
    if (!enable) { enable = 'On'; }

    const target = interaction.options.getMember('user');

    if (enable === 'On') {
      tripsitme.submit(interaction, target);
    }
    if (enable === 'Off') {
      tripsat.execute(interaction, target);
    }
  },
};
