import {
  SlashCommandBuilder,
} from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
import { magick8Ball } from '../../../global/commands/g.magick8Ball';
import { commandContext } from '../../utils/context';

const F = f(__filename);

export const dMagick8ball: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('magick8ball')
    .setDescription('Ask the magick 8-ball a question!')
    .addBooleanOption(option => option.setName('ephemeral')
      .setDescription('Set to "True" to show the response only to you')),
  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    await interaction.deferReply({ ephemeral: (interaction.options.getBoolean('ephemeral') === true) });
    await interaction.editReply({ content: await magick8Ball() });
    return true;
  },
};

export default dMagick8ball;
