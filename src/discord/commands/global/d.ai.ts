import { MessageFlags, SlashCommandBuilder } from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
import { getOrCreateUser } from '../../../global/utils/dbRecords';

const F = f(__filename);
const VISIBILITY_DESCRIPTION = 'Set to False to show the response to everyone';

const policies = {
  tos: `AI Terms of Service

All TripBot AI features are currently disabled. AI chat, translation and AI flair review have been removed.
Nothing you write is sent to an AI provider. This record only shows or revokes agreement you gave earlier.

Use /ai tos agree:False to revoke your earlier agreement.`,
  privacy: `AI Privacy Policy

All TripBot AI features are currently disabled, so no message or flair text is sent to OpenAI or any other AI provider.
TripBot keeps consent timestamps linked to your account until you revoke them or use /privacy delete.
Historical AI chat audit posts and replies require separate Discord cleanup.

Use /ai privacy agree:False to revoke your earlier agreement.`,
};

export const aiCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('ai')
    .setDescription('AI features are disabled; review or revoke earlier AI consent')
    .setIntegrationTypes([0])
    .addSubcommand(subcommand => subcommand
      .setName('tos')
      .setDescription('Read and manage agreement to the AI terms of service')
      .addBooleanOption(option => option
        .setName('agree').setDescription('Set to False to revoke your earlier agreement'))
      .addBooleanOption(option => option.setName('ephemeral').setDescription(VISIBILITY_DESCRIPTION)))
    .addSubcommand(subcommand => subcommand
      .setName('privacy')
      .setDescription('Read and manage agreement to the AI privacy policy')
      .addBooleanOption(option => option
        .setName('agree').setDescription('Set to False to revoke your earlier agreement'))
      .addBooleanOption(option => option.setName('ephemeral').setDescription(VISIBILITY_DESCRIPTION))),
  async execute(interaction) {
    log.info(F, 'AI consent controls used');
    const ephemeral = interaction.options.getBoolean('ephemeral') ?? true;
    await interaction.deferReply({ flags: ephemeral ? MessageFlags.Ephemeral : undefined });
    const subcommand = interaction.options.getSubcommand();
    if (subcommand !== 'tos' && subcommand !== 'privacy') {
      await interaction.editReply({
        content: 'AI features have been removed. Use /ai tos or /ai privacy to review or revoke earlier consent.',
      });
      return false;
    }

    // AI features are disabled, so agreement can no longer be given, only revoked.
    const agree = interaction.options.getBoolean('agree');
    let confirmation = '';
    if (agree === true) {
      confirmation = '\n\nAI features are disabled, so no agreement was saved.';
    } else if (agree === false) {
      const user = await getOrCreateUser(interaction.user.id);
      const field = subcommand === 'tos' ? 'ai_tos_agree' : 'ai_privacy_agree';
      await db.ai_info.updateMany({ where: { user_id: user.id }, data: { [field]: null } });
      confirmation = '\n\nYour agreement was revoked.';
    }
    await interaction.editReply({ content: policies[subcommand] + confirmation });
    return true;
  },
};

export default aiCommand;
