import { MessageFlags, SlashCommandBuilder } from 'discord.js';

import type { SlashCommand } from '../../@types/commandDef';

import { joke } from '../../../global/commands/g.joke';
import commandContext from '../../utils/context';
import { embedTemplate } from '../../utils/embedTemplate';
// import log from '../../../global/utils/log';
const F = f(__filename);

interface Double {
  delivery: string;
  setup: string;
  type: 'twopart';
}

interface Single {
  joke: string;
  type: 'single';
}

export const dJoke: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('joke')
    .setDescription('Random jokes')
    .setIntegrationTypes([0])
    .addBooleanOption((option) =>
      option.setName('ephemeral').setDescription('Set to "True" to show the response only to you'),
    ) as SlashCommandBuilder,

  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    const ephemeral = interaction.options.getBoolean('ephemeral')
      ? MessageFlags.Ephemeral
      : undefined;
    await interaction.deferReply({ flags: ephemeral });
    const data = await joke();

    const embed = embedTemplate();
    if (data.type === 'twopart') {
      embed.setTitle((data as Double).setup).setDescription((data as Double).delivery);
    } else {
      embed.setTitle((data as Single).joke);
    }

    await interaction.editReply({ embeds: [embed] });
    return true;
  },
};

export default dJoke;
