import {
  SlashCommandBuilder,
} from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
import { startLog } from '../../utils/startLog';
import { reagents } from '../../../global/commands/g.reagents';
// import log from '../../../global/utils/log';
const F = f(__filename);

export default dReagents;

export const dReagents: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('reagents')
    .setDescription('Display reagent color chart!'),
  async execute(interaction) {
    startLog(F, interaction);
    interaction.reply(await reagents());
    return true;
  },
};
