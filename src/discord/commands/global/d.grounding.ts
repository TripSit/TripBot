import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
} from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
import { grounding } from '../../../global/commands/g.grounding';
import { startLog } from '../../utils/startLog';
// import log from '../../../global/utils/log';
const F = f(__filename);

export default dGrounding;

export const dGrounding: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('grounding')
    .setDescription('Send an image with the 5-senses grounding exercise'),
  async execute(interaction:ChatInputCommandInteraction) {
    startLog(F, interaction);
    interaction.reply(await grounding());
    return true;
  },
};
