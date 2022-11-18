import {
  SlashCommandBuilder,
} from 'discord.js';
import { parse } from 'path';
import { SlashCommand } from '../../@types/commandDef';
import { startLog } from '../../utils/startLog';
import { reagents } from '../../../global/commands/g.reagents';
// import log from '../../../global/utils/log';
const PREFIX = parse(__filename).name;

export default dReagents;

export const dReagents: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('reagents')
    .setDescription('Display reagent color chart!'),

  async execute(interaction) {
    startLog(PREFIX, interaction);
    interaction.reply(await reagents());
    return true;
  },
};
