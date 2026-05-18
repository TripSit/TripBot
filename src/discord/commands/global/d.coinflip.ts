import {
  MessageFlags,
  SlashCommandBuilder,
} from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
import { coinflip } from '../../../global/commands/g.coinflip';
import commandContext from '../../utils/context';
import { t, getLocale, getCommandLocalizations } from '../../../i18n/index';
// import log from '../../../global/utils/log';
const F = f(__filename);

export const dCoinflip: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('coinflip')
    .setNameLocalizations(getCommandLocalizations('coinflip', 'commandName'))
    .setDescription('Flip a coin')
    .setDescriptionLocalizations(getCommandLocalizations('coinflip', 'commandDescription'))
    .setIntegrationTypes([0])
    .addBooleanOption(option => option.setName('ephemeral')
      .setDescription(t('en', 'coinflip', 'ephemeralOption'))
      .setDescriptionLocalizations(getCommandLocalizations('coinflip', 'ephemeralOption'))) as SlashCommandBuilder,
  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    const locale = await getLocale(interaction, 'coinflip');
    const ephemeral = interaction.options.getBoolean('ephemeral') ? MessageFlags.Ephemeral : undefined;
    await interaction.deferReply({ flags: ephemeral });
    await interaction.editReply({ content: await coinflip(locale) });
    return true;
  },

};

export default dCoinflip;
