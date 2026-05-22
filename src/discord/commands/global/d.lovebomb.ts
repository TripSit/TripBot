import {
  SlashCommandBuilder,
} from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
import commandContext from '../../utils/context';
import { getCommandLocalizations } from '../../../i18n/index';
// import log from '../../../global/utils/log';
const F = f(__filename);

const heartEmojis = [
  '❤', '🧡', '💛', '💚', '💙', '💜',
  '💝', '💖', '💗', '💘', '💕', '💞', '💓', '💟', '❣',
];

export const dlovebomb: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('lovebomb')
    .setNameLocalizations(getCommandLocalizations('lovebomb.commandName'))
    .setDescription('Spread some love')
    .setDescriptionLocalizations(getCommandLocalizations('lovebomb.commandDescription'))
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
