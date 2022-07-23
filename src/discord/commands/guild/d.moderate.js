'use strict';

const PREFIX = require('path').parse(__filename).name;
const { SlashCommandBuilder } = require('@discordjs/builders');
const logger = require('../../../global/utils/logger');
const template = require('../../utils/embed-template');
const { moderate } = require('../../../global/utils/moderate');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mod')
    .setDescription('Moderation actions!')
    .addSubcommand(subcommand => subcommand
      .setDescription('Info on a user')
      .addStringOption(option => option
        .setName('target')
        .setDescription('User to get info on!')
        .setRequired(true))
      .setName('info'))
    .addSubcommand(subcommand => subcommand
      .setDescription('Warn a user')
      .addStringOption(option => option
        .setName('target')
        .setDescription('User to warn!')
        .setRequired(true))
      .addStringOption(option => option
        .setName('reason')
        .setDescription('VISIBLE TO USER: Reason for warn!')
        .setRequired(true))
      .setName('warn'))
    .addSubcommand(subcommand => subcommand
      .setDescription('Create a note about a user')
      .addStringOption(option => option
        .setName('target')
        .setDescription('User to note about!')
        .setRequired(true))
      .addStringOption(option => option
        .setName('reason')
        .setDescription('Reason for note!')
        .setRequired(true))
      .setName('note'))
    .addSubcommand(subcommand => subcommand
      .setDescription('Timeout a user')
      .addStringOption(option => option
        .setName('target')
        .setDescription('User to timeout!')
        .setRequired(true))
      .addStringOption(option => option
        .setName('reason')
        .setDescription('VISIBLE TO USER: Reason for timeout!')
        .setRequired(true))
      .addStringOption(option => option
        .setName('toggle')
        .setDescription('On off?')
        .addChoice('On', 'on')
        .addChoice('Off', 'off'))
      .addStringOption(option => option
        .setName('duration')
        .setDescription('Duration of ban!'))
      .setName('timeout'))
    .addSubcommand(subcommand => subcommand
      .setDescription('Kick a user')
      .addStringOption(option => option
        .setName('target')
        .setDescription('User to kick!')
        .setRequired(true))
      .addStringOption(option => option
        .setName('reason')
        .setDescription('Reason for kick!')
        .setRequired(true))
      .addStringOption(option => option
        .setName('channel')
        .setDescription('Channel to kick from!'))
      .setName('kick'))
    .addSubcommand(subcommand => subcommand
      .setDescription('Ban a user')
      .addStringOption(option => option
        .setName('target')
        .setDescription('User to ban!')
        .setRequired(true))
      .addStringOption(option => option
        .setName('reason')
        .setDescription('Reason for ban!')
        .setRequired(true))
      .addStringOption(option => option
        .setName('duration')
        .setDescription('How long to ban!'))
      .addStringOption(option => option
        .setName('toggle')
        .setDescription('On off?')
        .addChoice('On', 'on')
        .addChoice('Off', 'off'))
      .setName('ban')),
  async execute(interaction) {
    logger.debug(`[${PREFIX}] started!`);
    await interaction.deferReply({ ephemeral: true });
    const embed = template.embedTemplate()
      .setColor('DARK_BLUE')
      .setDescription('Moderating...');
    await interaction.editReply({ embeds: [embed], ephemeral: true });

    const actor = interaction.member;
    const command = interaction.options.getSubcommand();
    const target = interaction.options.getString('target');
    const toggle = interaction.options.getString('toggle');
    const reason = interaction.options.getString('reason');
    const duration = interaction.options.getString('duration');
    const channel = interaction.options.getString('channel');
    // logger.debug(`[${PREFIX}] Actor: ${actor}`);
    // logger.debug(`[${PREFIX}] Command: ${command}`);
    // logger.debug(`[${PREFIX}] Target: ${target}`);
    // logger.debug(`[${PREFIX}] toggle: ${toggle}`);
    // logger.debug(`[${PREFIX}] reason: ${reason}`);
    // logger.debug(`[${PREFIX}] duration: ${duration}`);
    // logger.debug(`[${PREFIX}] Channel: ${channel}`);

    const result = await moderate(actor, command, target, channel, toggle, reason, duration);
    logger.debug(`[${PREFIX}] Result: ${result}`);

    embed.setDescription(result);

    interaction.editReply({ embeds: [embed], ephemeral: true });

    logger.debug(`[${PREFIX}] finished!`);
  },
};
