'use strict';

const path = require('path');
const { SlashCommandBuilder } = require('@discordjs/builders');
const logger = require('../../utils/logger');
const template = require('../../utils/embed-template');

const PREFIX = path.parse(__filename).name;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ems')
    .setDescription('Information that may be helpful in a serious situation.'),

  async execute(interaction) {
    const embed = template.embedTemplate()
      .setTitle('EMS Information')
      .addFields(
        { name: 'Poison Control (USA)', value: 'Website: https://www.poison.org/\nPhone: (800) 222-1222\nWebhelp: https://triage.webpoisoncontrol.org/', inline: false },
        { name: 'Never Use Alone (USA)', value: 'Website: https://neverusealone.com/\nPhone: (800) 484-3731', inline: false },
        { name: 'National Overdose Response Service (Canada)', value: 'Website: https://www.nors.ca/\nPhone: 1 (888) 688-6677', inline: false },
        { name: 'Talktofrank (UK)', value: 'Website: https://www.talktofrank.com/\nPhone: 0300 123 6600\nWebhelp: https://www.talktofrank.com/livechat', inline: false },
        { name: 'NHS emergency line (UK)', value: 'Website: https://www.nhs.uk/live-well/addiction-support\nPhone: 999', inline: false },
        { name: 'Mindzone (EU/germany)', value: 'Website: https://mindzone.info/gesundheit/drogennotfall/\nPhone: 112 (works EU wide)', inline: false },
      );

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

    logger.debug(`[${PREFIX}] finished!`);
  },
};
