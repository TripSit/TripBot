import {
  SlashCommandBuilder,
} from 'discord.js';
import { parse } from 'path';
import { SlashCommand } from '../../@types/commandDef';
import { magick8Ball } from '../../../global/commands/g.magick8Ball';
import { startLog } from '../../utils/startLog';

const PREFIX = parse(__filename).name;

export default magick8ball;

export const magick8ball: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('magick8ball')
    .setDescription('Ask the magick 8-ball a question!'),
  async execute(interaction) {
    startLog(PREFIX, interaction);
    interaction.reply(await magick8Ball());
    return true;
  },
};
