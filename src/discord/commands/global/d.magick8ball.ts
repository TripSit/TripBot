import {
  SlashCommandBuilder,
} from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
import { magick8Ball } from '../../../global/commands/g.magick8Ball';
import { startLog } from '../../utils/startLog';

const F = f(__filename);

export default dMagick8ball;

export const dMagick8ball: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('magick8ball')
    .setDescription('Ask the magick 8-ball a question!'),
  async execute(interaction) {
    startLog(F, interaction);
    interaction.reply(await magick8Ball());
    return true;
  },
};
