'use strict';

const path = require('path');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { stripIndents } = require('common-tags/lib');
const logger = require('../../../global/logger');
const template = require('../../../global/embed-template');

const PREFIX = path.parse(__filename).name;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('whois')
    .setDescription('IRC whois')
    .addStringOption(option => option
      .setDescription('User to whois!')
      .setRequired(true)
      .setName('target')),
  async execute(interaction) {
    logger.debug(`[${PREFIX}] started!`);
    const target = interaction.options.getString('target');

    // Do a whois on the user to get their account name
    let data = null;
    await global.ircClient.whois(target, async resp => {
      data = resp;
    });

    // This is a hack substanc3 helped create to get around the fact that the whois command
    // is asyncronous by default, so we need to make this syncronous
    while (data === null) {
      await new Promise(resolve => setTimeout(resolve, 100)); // eslint-disable-line
    }

    // Check if the user is FOUND on IRC, if not, ignore it
    if (!data.host) {
      logger.debug(`[${PREFIX}] ${target} not found on IRC, ignoring!`);
      interaction.reply(`${target} not found on IRC, ignoring!`);
      return;
    }

    logger.debug(`[${PREFIX}] data: ${JSON.stringify(data, null, 2)}`);

    const body = stripIndents`
      **${data.nick}** (${data.user}@${data.host}) ${data.account ? `${data.accountinfo} ${data.account}` : ''}
      Channels include: ${data.channels.join(', ')}
    `;

    const embed = template.embedTemplate()
      .setDescription(body)
      .setTitle(`Whois for ${target}`)
      .setColor(0x00FF00);
    interaction.reply({
      embeds: [embed],
      ephemeral: true,
    });

    logger.debug(`[${PREFIX}] finished!`);
  },
};
