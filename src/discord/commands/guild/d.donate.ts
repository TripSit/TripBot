import {
  MessageFlags,
  SlashCommandBuilder,
} from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
import commandContext from '../../utils/context';
import { donatePage } from '../global/d.help';
import { t, getCommandLocalizations } from '../../../i18n/index';

const F = f(__filename);

export const dDonate: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('donate')
    .setNameLocalizations(getCommandLocalizations('donate', 'commandName'))
    .setDescription(t('en-US', 'donate', 'commandDescription'))
    .setDescriptionLocalizations(getCommandLocalizations('donate', 'commandDescription'))
    .setIntegrationTypes([0])
    .addBooleanOption(option => option.setName('ephemeral')
      .setDescription(t('en-US', 'donate', 'ephemeralOption'))
      .setDescriptionLocalizations(getCommandLocalizations('donate', 'ephemeralOption'))) as SlashCommandBuilder,
  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    const ephemeral = interaction.options.getBoolean('ephemeral') ? MessageFlags.Ephemeral : undefined;
    await interaction.deferReply({ flags: ephemeral });
    await interaction.editReply(await donatePage('en'));
    return true;
  },
};

export default dDonate;
