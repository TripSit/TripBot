import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
} from 'discord.js';
import {SlashCommand} from '../../utils/commandDef';
import {embedTemplate} from '../../utils/embedTemplate';
import {whoisIRC} from '../../../global/commands/g.whois';
import logger from '../../../global/utils/logger';
const PREFIX = require('path').parse(__filename).name;

export const discordTemplate: SlashCommand = {
  data: new SlashCommandBuilder()
      .setName('whois')
      .setDescription('IRC whois')
      .addStringOption((option) => option
          .setDescription('User to whois!')
          .setRequired(true)
          .setName('target')),

  async execute(interaction:ChatInputCommandInteraction) {
    logger.debug(`[${PREFIX}] started!`);
    const target = interaction.options.getString('target');

    let body;

    try {
      body = await whoisIRC(target!);
    } catch (err:any) {
      const embed = embedTemplate()
          .setDescription(err.message)
          .setTitle(`Whois for ${target}`)
          .setColor(0x00FF00);
      interaction.reply({
        embeds: [embed],
        ephemeral: true,
      });
      return;
    }

    const embed = embedTemplate()
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
