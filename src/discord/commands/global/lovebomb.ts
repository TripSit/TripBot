import {
  SlashCommandBuilder,
} from 'discord.js';
import {SlashCommand} from '../../utils/commandDef';
import logger from '../../../global/utils/logger';
const PREFIX = require('path').parse(__filename).name;

const heartEmojis = [
  '❤', '🧡', '💛', '💚', '💙', '💜',
  '💝', '💖', '💗', '💘', '💕', '💞', '💓', '💟', '❣',
];

export const discordTemplate: SlashCommand = {
  data: new SlashCommandBuilder()
      .setName('lovebomb')
      .setDescription('Spread some love'),

  async execute(interaction) {
    const message = `${heartEmojis.sort(() => 0.5 - Math.random()).slice(0, 30).join(' ')}`;
    interaction.reply(message);

    logger.debug(`[${PREFIX}] finished!`);
  },
};
