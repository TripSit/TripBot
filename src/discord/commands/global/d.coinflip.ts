import {
  SlashCommandBuilder,
} from 'discord.js';
import {SlashCommand} from '../../@types/commandDef';
import {coinflip} from '../../../global/commands/g.coinflip';
// import log from '../../../global/utils/log';
// import * as path from 'path';
// const PREFIX = path.parse(__filename).name;

export const dcoinflip: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('coinflip')
    .setDescription('Flip a coin'),
  async execute(interaction) {
    interaction.reply(await coinflip());
    return true;
  },

};
