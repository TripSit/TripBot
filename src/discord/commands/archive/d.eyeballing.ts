import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
} from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
import { eyeballing } from '../../../global/commands/archive/g.eyeballing';
// import log from '../../../global/utils/log';
// import {parse} from 'path';
// const F = f(__filename);

export const deyeballing: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('eyeballing')
    .setDescription('Instructions on how to eyeball a dose'),
  async execute(interaction:ChatInputCommandInteraction) {
    // log.debug(F, `starting!`);
    await interaction.reply(await eyeballing());
    return true;
  },
};
