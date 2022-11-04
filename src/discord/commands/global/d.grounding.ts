import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
} from 'discord.js';
import {SlashCommand} from '../../@types/commandDef';
import {grounding} from '../../../global/commands/g.grounding';
// import logger from '../../../global/utils/logger';
// import * as path from 'path';
// const PREFIX = path.parse(__filename).name;

export const dgrounding: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('grounding')
    .setDescription('Send an image with the 5-senses grounding exercise'),
  async execute(interaction:ChatInputCommandInteraction) {
    interaction.reply(await grounding());
    return true;
  },
};
