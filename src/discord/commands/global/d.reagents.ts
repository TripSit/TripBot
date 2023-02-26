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
    .setDescription('Display reagent color chart!')
    .addBooleanOption(option => option.setName('ephemeral')
      .setDescription('Set to "True" to show the response only to you')),
  async execute(interaction) {
    startLog(F, interaction);
    const ephemeral:boolean = (interaction.options.getBoolean('ephemeral') === true);
    interaction.reply({ content: await reagents(), ephemeral });
    return true;
  },
};
