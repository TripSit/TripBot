import {
  SlashCommandBuilder,
  GuildMember,
  MessageFlags,
} from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
import commandContext from '../../utils/context';
import { embedTemplate } from '../../utils/embedTemplate';
import { t, getLocale, getCommandLocalizations } from '../../../i18n/index';

const F = f(__filename);

export const dKarma: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('karma')
    .setNameLocalizations(getCommandLocalizations('karma', 'commandName'))
    .setDescription(t('en-US', 'karma', 'commandDescription'))
    .setDescriptionLocalizations(getCommandLocalizations('karma', 'commandDescription'))
    .setIntegrationTypes([0])
    .addUserOption(option => option
      .setName('target')
      .setDescription(t('en-US', 'karma', 'targetOption'))
      .setDescriptionLocalizations(getCommandLocalizations('karma', 'targetOption')))
    .addBooleanOption(option => option.setName('ephemeral')
      .setDescription(t('en-US', 'karma', 'ephemeralOption'))
      .setDescriptionLocalizations(getCommandLocalizations('karma', 'ephemeralOption'))) as SlashCommandBuilder,
  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    const locale = await getLocale(interaction, 'karma');
    const ephemeral = interaction.options.getBoolean('ephemeral') ? MessageFlags.Ephemeral : undefined;
    await interaction.deferReply({ flags: ephemeral });
    const member = interaction.options.getMember('target')
      ? interaction.options.getMember('target') as GuildMember
      : interaction.member as GuildMember;

    const userData = await db.users.upsert({
      where: { discord_id: member.id },
      create: { discord_id: member.id },
      update: {},
    });

    const embed = embedTemplate()
      .setTitle(t(locale, 'karma', 'karmaMsg', {
        name: member.displayName,
        received: userData.karma_received,
        given: userData.karma_given,
      }));
    await interaction.editReply({ embeds: [embed] });
    return true;
  },
};

export default dKarma;
