import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
} from 'discord.js';
import {SlashCommand} from '../../@types/commandDef';
import {eyeballing} from '../../../global/commands/g.eyeballing';
// import logger from '../../../global/utils/logger';
// import * as path from 'path';
// const PREFIX = path.parse(__filename).name;

export const deyeballing: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('eyeballing')
    .setDescription('Instructions on how to eyeball a dose'),
  async execute(interaction:ChatInputCommandInteraction) {
    // logger.debug(`[${PREFIX}] starting!`);
    interaction.reply(await eyeballing());
    // logger.debug(`[${PREFIX}] finished!`);
  },
};
