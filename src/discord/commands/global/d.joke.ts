import {
  SlashCommandBuilder,
} from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import { joke } from '../../../global/commands/g.joke';
import { commandContext } from '../../utils/context';
// import log from '../../../global/utils/log';
const F = f(__filename);

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
    .setDescription('Random jokes')
    .addBooleanOption(option => option.setName('ephemeral')
      .setDescription('Set to "True" to show the response only to you')),

  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    await interaction.deferReply({ ephemeral: (interaction.options.getBoolean('ephemeral') === true) });
    const data = await joke();

    const embed = embedTemplate();
    if (data.type === 'twopart') embed.setTitle((data as Double).setup).setDescription((data as Double).delivery);
    else embed.setTitle((data as Single).joke);

    await interaction.editReply({ embeds: [embed] });
    return true;
  },
};

export default dJoke;
