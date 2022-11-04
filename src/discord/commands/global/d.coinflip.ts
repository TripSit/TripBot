import {
  SlashCommandBuilder,
} from 'discord.js';
import {SlashCommand} from '../../@types/commandDef';
import {coinflip} from '../../../global/commands/g.coinflip';
import {startLog} from '../../utils/startLog';
// import log from '../../../global/utils/log';
import {parse} from 'path';
const PREFIX = parse(__filename).name;

export const dcoinflip: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('coinflip')
    .setDescription('Flip a coin'),
  async execute(interaction) {
    startLog(PREFIX, interaction);
    interaction.reply(await coinflip());
    return true;
  },

};
