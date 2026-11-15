import {
  SlashCommandBuilder,
} from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
import commandContext from '../../utils/context';

const F = f(__filename);

const heartEmojis = [
  '❤', '🧡', '💛', '💚', '💙', '💜',
  '💝', '💖', '💗', '💘', '💕', '💞', '💓', '💟', '❣',
];

export const dlovebomb: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('lovebomb')
    .setDescription('Spread some love')
    .setIntegrationTypes([0]),

  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    await interaction.deferReply({});
    const message = `${[...heartEmojis].sort(() => 0.5 - Math.random()).slice(0, 30).join(' ')}`;
    await interaction.editReply(message);

    return true;
  },
};

export default dlovebomb;
