import {
  SlashCommandBuilder,
} from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
import { startLog } from '../../utils/startLog';
// import log from '../../../global/utils/log';
const F = f(__filename);

const heartEmojis = [
  '❤', '🧡', '💛', '💚', '💙', '💜',
  '💝', '💖', '💗', '💘', '💕', '💞', '💓', '💟', '❣',
];

export default dlovebomb;

export const dlovebomb: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('lovebomb')
    .setDescription('Spread some love'),

  async execute(interaction) {
    startLog(F, interaction);
    await interaction.deferReply({ ephemeral: false });
    const message = `${[...heartEmojis].sort(() => 0.5 - Math.random()).slice(0, 30).join(' ')}`;
    await interaction.editReply(message);

    return true;
  },
};
