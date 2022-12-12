import {
  SlashCommandBuilder,
} from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import { joke } from '../../../global/commands/g.joke';
import { startLog } from '../../utils/startLog';
// import log from '../../../global/utils/log';
const F = f(__filename);

export default dJoke;

type Single = {
  type: 'single';
  joke: string;
};

type Double = {
  type: 'twopart';
  setup: string;
  delivery: string;
};

export const dJoke: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('joke')
    .setDescription('Random jokes'),

  async execute(interaction) {
    startLog(F, interaction);
    const data = await joke();

    const embed = embedTemplate();
    if (data.type === 'twopart') embed.setTitle((data as Double).setup).setDescription((data as Double).delivery);
    else embed.setTitle((data as Single).joke);

    interaction.reply({ embeds: [embed] });
    return true;
  },
};
