import {
  SlashCommandBuilder,
} from 'discord.js';
import {SlashCommand1} from '../../@types/commandDef';
import {coinflip} from '../../../global/commands/g.coinflip';
// import logger from '../../../global/utils/logger';
// import * as path from 'path';
// const PREFIX = path.parse(__filename).name;

export const dcoinflip: SlashCommand1 = {
  data: new SlashCommandBuilder()
    .setName('coinflip')
    .setDescription('Flip a coin'),
  async execute(interaction) {
    interaction.reply(await coinflip());
    return true;
  },

};
