import {
  MessageFlags,
  SlashCommandBuilder,
} from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
import { privacy } from '../../../global/commands/g.privacy';
import { embedTemplate } from '../../utils/embedTemplate';
import commandContext from '../../utils/context';
import { t, getLocale, getCommandLocalizations } from '../../../i18n/index';

const F = f(__filename);

export const dPrivacy: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('privacy')
    .setNameLocalizations(getCommandLocalizations('privacy', 'commandName'))
    .setDescription('See and manage how TripSit uses your data!')
    .setDescriptionLocalizations(getCommandLocalizations('privacy', 'commandDescription'))
    .setIntegrationTypes([0])
    .addSubcommand(subcommand => subcommand
      .setName('get')
      .setDescription('Get what data is stored on your user!')
      .setNameLocalizations(getCommandLocalizations('privacy', 'getSubcommandName'))
      .setDescriptionLocalizations(getCommandLocalizations('privacy', 'getSubcommandDescription')))
    .addSubcommand(subcommand => subcommand
      .setName('delete')
      .setDescription('Instructions on deleting your data!')
      .setNameLocalizations(getCommandLocalizations('privacy', 'deleteSubcommandName'))
      .setDescriptionLocalizations(getCommandLocalizations('privacy', 'deleteSubcommandDescription'))
      .addStringOption(option => option.setName('confirmation')
        .setDescription('Enter your confirmation code to delete your data!')
        .setDescriptionLocalizations(getCommandLocalizations('privacy', 'confirmationOption')))),
  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const locale = await getLocale(interaction, 'privacy');
    const command = interaction.options.getSubcommand() as 'get' | 'delete';
    const embed = embedTemplate();

    const userData = await privacy('get', interaction.user.id);

    if (command === 'get') {
      embed.setTitle(t(locale, 'privacy', 'yourDataTitle'))
        .setDescription(t(locale, 'privacy', 'yourDataDescription', { userData }));
    } else if (command === 'delete') {
      const confirmation = interaction.options.getString('confirmation');
      if (confirmation === 'YesPlease!') {
        const userDeleteData = await privacy('delete', interaction.user.id);
        embed.setTitle(t(locale, 'privacy', 'deletingYourDataTitle'))
          .setDescription(t(locale, 'privacy', 'deletingYourDataDescription', { userDeleteData }));
      } else {
        embed.setTitle(t(locale, 'privacy', 'areYouSureTitle')) /* eslint-disable max-len */
          .setDescription(t(locale, 'privacy', 'areYouSureDescription', { userData }));
      }
    }

    await interaction.editReply({ embeds: [embed] });
    return true;
  },
};

export default dPrivacy;
