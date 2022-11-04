import {
  SlashCommandBuilder,
} from 'discord.js';
import {SlashCommand} from '../../@types/commandDef';
import {startLog} from '../../utils/startLog';
// import log from '../../../global/utils/log';
import {parse} from 'path';
const PREFIX = parse(__filename).name;

const heartEmojis = [
  '❤', '🧡', '💛', '💚', '💙', '💜',
  '💝', '💖', '💗', '💘', '💕', '💞', '💓', '💟', '❣',
];

export const dlovebomb: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('lovebomb')
    .setDescription('Spread some love'),

  async execute(interaction) {
    startLog(PREFIX, interaction);
    const message = `${heartEmojis.sort(() => 0.5 - Math.random()).slice(0, 30).join(' ')}`;
    interaction.reply(message);

    return true;
  },
};
