import {
  MessageFlags,
  SlashCommandBuilder,
} from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import { joke } from '../../../global/commands/g.joke';
import commandContext from '../../utils/context';
import { t, getCommandLocalizations } from '../../../i18n/index';
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
    .setNameLocalizations(getCommandLocalizations('joke.commandName'))
    .setDescription('Random jokes')
    .setDescriptionLocalizations(getCommandLocalizations('joke.commandDescription'))
    .setIntegrationTypes([0])
    .addBooleanOption(option => option.setName('ephemeral')
      .setDescription(t('en-US', 'joke.ephemeralOption'))) as SlashCommandBuilder,

  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    const ephemeral = interaction.options.getBoolean('ephemeral') ? MessageFlags.Ephemeral : undefined;
    await interaction.deferReply({ flags: ephemeral });
    const data = await joke();

    const embed = embedTemplate();
    if (data.type === 'twopart') embed.setTitle((data as Double).setup).setDescription((data as Double).delivery);
    else embed.setTitle((data as Single).joke);

    await interaction.editReply({ embeds: [embed] });
    return true;
  },
};

export default dJoke;
