'use strict';

const path = require('path');
const { SlashCommandBuilder } = require('@discordjs/builders');
const logger = require('../../utils/logger');
const template = require('../../utils/embed-template');

const PREFIX = path.parse(__filename).name;

const { channel_general: generalChannelId } = process.env;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('invite')
    .setDescription('Creates new invites!')
    .addChannelOption(option => option
      .setName('channel')
      .setDescription('To what channel?'))
    .addBooleanOption(option => option
      .setName('temporary')
      .setDescription('Temporary?'))
    .addIntegerOption(option => option
      .setName('max_age')
      .setDescription('Max age?'))
    .addIntegerOption(option => option
      .setName('max_uses')
      .setDescription('Max uses?')),

  async execute(interaction) {
    const channel = interaction.options.getChannel('channel')
      || interaction.client.channels.cache.get(generalChannelId);
    const temporary = interaction.options.getBoolean('temporary') || false;
    const maxAge = interaction.options.getInteger('maxAge') || 0;
    const maxUses = interaction.options.getInteger('maxUses') || 0;

    const unique = true;
    const reason = `Invite requested by ${interaction.member.user.username}`;
    try {
      channel.createInvite({
        maxAge,
        maxUses,
        temporary,
        unique,
        reason,
      }).then(invite => {
        const embed = template.embedTemplate()
          .setDescription(`Created an invite to ${channel} with a code of ${invite.code}`);
        interaction.reply({ embeds: [embed], ephemeral: false });
      }).catch(err => {
        logger.error(`${PREFIX}/invite: ${err}`);
        const embed = template.embedTemplate()
          .setDescription(err);
        interaction.reply({ embeds: [embed], ephemeral: false });
      });
    } catch (err) {
      const embed = template.embedTemplate()
        .setDescription('Make sure you entered a channel!');
      interaction.reply({ embeds: [embed], ephemeral: false });
    }
    logger.debug(`[${PREFIX}] finished!`);
  },
};
