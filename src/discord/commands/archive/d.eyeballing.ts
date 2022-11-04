import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
} from 'discord.js';
import {SlashCommand} from '../../@types/commandDef';
import {eyeballing} from '../../../global/commands/archive/g.eyeballing';
// import log from '../../../global/utils/log';
// import * as path from 'path';
// const PREFIX = path.parse(__filename).name;

export const deyeballing: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('eyeballing')
    .setDescription('Instructions on how to eyeball a dose'),
  async execute(interaction:ChatInputCommandInteraction) {
    // log.debug(`[${PREFIX}] starting!`);
    interaction.reply(await eyeballing());
    // log.debug(`[${PREFIX}] finished!`);
    return true;
  },
};
