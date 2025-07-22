import { MessageFlags, SlashCommandBuilder } from 'discord.js';

import type { SlashCommand } from '../../@types/commandDef';

import { wikiGuides } from '../../../global/commands/g.guides';
import commandContext from '../../utils/context';
import { embedTemplate } from '../../utils/embedTemplate';

const F = f(__filename);

export const dGuides: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('guides')
    .setDescription('Get a link to all the guides from our wiki')
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

    const guides = await wikiGuides();

    let message = '';

    for (const element of guides) {
      message += `[${element.split('_').join(' ')}](https://wiki.tripsit.me/wiki/${element})\n`;
    }

    const embed = embedTemplate()
      .setTitle('Wiki Guides')
      .setDescription(
        `These are the guides currently available on our [Wiki](https://wiki.tripsit.me)\n\n${message}\nYou're welcome to contribute. :heart:`,
      );

    await interaction.editReply({ embeds: [embed] });

    return true;
  },
};

export default dGuides;
