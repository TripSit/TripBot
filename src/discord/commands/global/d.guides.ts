import {
  SlashCommandBuilder,
} from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import { wikiGuides } from '../../../global/commands/g.guides';
import { commandContext } from '../../utils/context';

const F = f(__filename);

export const dGuides: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('guides')
    .setDescription('Get a link to all the guides from our wiki')
    .addBooleanOption(option => option.setName('ephemeral')
      .setDescription('Set to "True" to show the response only to you')),

  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    await interaction.deferReply({ ephemeral: (interaction.options.getBoolean('ephemeral') === true) });

    const guides = await wikiGuides();

    let message: string = '';

    for (const element of guides) { // eslint-disable-line no-restricted-syntax
      message += `[${element.split('_').join(' ')}](https://wiki.tripsit.me/wiki/${element})\n`;
    }

    const embed = embedTemplate()
      .setTitle('Wiki Guides')
      .setDescription(`These are the guides currently available on our [Wiki](https://wiki.tripsit.me)\n\n${message}\nYou're welcome to contribute. :heart:`); // eslint-disable-line max-len

    await interaction.editReply({ embeds: [embed] });

    return true;
  },
};

export default dGuides;
