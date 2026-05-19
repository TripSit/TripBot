import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  GuildMember,
  TextChannel,
  MessageFlags,
} from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
import { parseDuration } from '../../../global/utils/parseDuration';
import commandContext from '../../utils/context';
import { t, getLocale, getCommandLocalizations } from '../../../i18n/index';

const F = f(__filename);

export const selfTimeout: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('selftimeout')
    .setNameLocalizations(getCommandLocalizations('selftimeout', 'commandName'))
    .setDescription(t('en-US', 'selftimeout', 'commandDescription'))
    .setDescriptionLocalizations(getCommandLocalizations('selftimeout', 'commandDescription'))
    .setIntegrationTypes([0])
    .addStringOption(option => option
      .setName('duration')
      .setDescription(t('en-US', 'selftimeout', 'durationOption'))
      .setDescriptionLocalizations(getCommandLocalizations('selftimeout', 'durationOption'))
      .setRequired(true))
    .addStringOption(option => option
      .setName('confirmation')
      .setDescription(t('en-US', 'selftimeout', 'confirmationOption'))
      .setDescriptionLocalizations(getCommandLocalizations('selftimeout', 'confirmationOption'))
      .addChoices(
        { name: t('en-US', 'selftimeout', 'yesChoice'), value: 'yes' },
        { name: t('en-US', 'selftimeout', 'noChoice'), value: 'no' },
      )
      .setRequired(true)) as SlashCommandBuilder,
  async execute(interaction: ChatInputCommandInteraction) {
    log.info(F, await commandContext(interaction));
    const locale = await getLocale(interaction, 'selftimeout');
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    if (!interaction.guild) return false;

    const confirmation = interaction.options.getString('confirmation');

    if (confirmation === 'no') {
      await interaction.editReply({ content: t(locale, 'selftimeout', 'testingReply') });
      return false;
    }

    const target = interaction.member as GuildMember;
    const duration = interaction.options.getString('duration');
    const durationValue = await parseDuration(`${duration}`);
    await target.timeout(durationValue, 'Self timeout');

    await interaction.editReply({ content: t(locale, 'selftimeout', 'seeYouIn', { duration }) });

    const tripsitGuild = await interaction.client.guilds.fetch(env.DISCORD_GUILD_ID);
    const modLog = await tripsitGuild.channels.fetch(env.CHANNEL_MODLOG) as TextChannel;
    await modLog.send(t('en-US', 'selftimeout', 'modlogMsg', { tag: target.user.tag, duration }));

    return true;
  },
};

export default selfTimeout;
