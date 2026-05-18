import {
  SlashCommandBuilder,
  DiscordAPIError,
  MessageFlags,
} from 'discord.js';

import { SlashCommand } from '../../@types/commandDef';
import commandContext from '../../utils/context';
import { embedTemplate } from '../../utils/embedTemplate';
import { t, getLocale, getCommandLocalizations } from '../../../i18n/index';

const F = f(__filename);

export const dAvatar: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('avatar')
    .setNameLocalizations(getCommandLocalizations('avatar', 'commandName'))
    .setDescription('Shows a member\'s profile picture in large format.')
    .setDescriptionLocalizations(getCommandLocalizations('avatar', 'commandDescription'))
    .setIntegrationTypes([0])
    .addUserOption(option => option.setName('user')
      .setDescription(t('en', 'avatar', 'userOption'))
      .setDescriptionLocalizations(getCommandLocalizations('avatar', 'userOption'))
      .setRequired(true))
    .addBooleanOption(option => option.setName('ephemeral')
      .setDescription(t('en', 'avatar', 'ephemeralOption'))
      .setDescriptionLocalizations(getCommandLocalizations('avatar', 'ephemeralOption'))) as SlashCommandBuilder,
  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    const locale = await getLocale(interaction, 'avatar');
    const ephemeral = interaction.options.getBoolean('ephemeral') ? MessageFlags.Ephemeral : undefined;
    await interaction.deferReply({ flags: ephemeral });
    // log.debug(F, `${JSON.stringify(interaction.options, null, 2)}`);
    // If this doesn't happen in a guild then ignore it
    if (!interaction.guild) {
      await interaction.editReply({ content: t(locale, 'avatar', 'guildOnlyError') });
      return false;
    }

    const user = interaction.options.getUser('user', true);

    // log.debug(F, `user: ${JSON.stringify(user, null, 2)}`);
    // log.debug(F, `user.id: ${user.id}`);

    try {
      const member = await interaction.guild.members.fetch(user.id);
      // log.debug(F, `member: ${JSON.stringify(member, null, 2)}`);
      const embed = embedTemplate()
        .setTitle(t(locale, 'avatar', 'profilePictureTitle', { displayName: member.displayName }))
        .setImage(`${member.displayAvatarURL()}?size=4096`);
      await interaction.editReply({ embeds: [embed] });
      return true;
    } catch (err) {
      if ((err as DiscordAPIError).code === 10007) {
        await interaction.editReply({ content: t(locale, 'avatar', 'memberNotFoundError') });
        return false;
      }
    }
    // If this line is reached, then there was a problem.
    return false;
  },
};

export default dAvatar;
