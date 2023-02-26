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
    .setDescription('Ask the magick 8-ball a question!')
    .addBooleanOption(option => option.setName('ephemeral')
      .setDescription('Set to "True" to show the response only to you')),
  async execute(interaction) {
    startLog(F, interaction);
    const ephemeral:boolean = (interaction.options.getBoolean('ephemeral') === true);
    interaction.reply({ content: await magick8Ball(), ephemeral });
    return true;
  },
};
