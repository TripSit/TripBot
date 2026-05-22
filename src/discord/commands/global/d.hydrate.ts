import {
  Colors,
  SlashCommandBuilder,
} from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import commandContext from '../../utils/context';
import { t, getLocale, getCommandLocalizations } from '../../../i18n/index';
// import log from '../../../global/utils/log';
const F = f(__filename);

export const dHydrate: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('hydrate')
    .setNameLocalizations(getCommandLocalizations('hydrate.commandName'))
    .setDescription('Remember to hydrate!')
    .setDescriptionLocalizations(getCommandLocalizations('hydrate.commandDescription'))
    .setContexts([0, 1, 2])
    .setIntegrationTypes([0, 1]),

  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    await interaction.deferReply({});
    const locale = await getLocale(interaction, 'hydrate');
    const output = t(locale, 'hydrate.reminderMessage');
    const embed = embedTemplate()
      .setColor(Colors.DarkBlue)
      .setDescription(output)
      .setAuthor(null)
      .setFooter(null);

    await interaction.editReply({ embeds: [embed] });
    return true;
  },
};

export default dHydrate;
