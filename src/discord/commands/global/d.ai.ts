import { MessageFlags, SlashCommandBuilder } from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
import { getOrCreateUser } from '../../../global/utils/dbRecords';

const F = f(__filename);
const VISIBILITY_DESCRIPTION = 'Set to False to show the response to everyone';

const policies = {
  tos: `AI Terms of Service

AI chat has been removed. Translation and RPG flair review remain available.
The AI is not a harm reduction tool. DO NOT rely on TripBot AI for drug safety, dosage, or medical advice.
In an emergency, use #tripsit to speak with a human or contact local emergency services.
AI can be wrong or generate misleading, dangerous, offensive, or disturbing text. There is no human oversight
for individual AI responses. You must be 18+ to use AI features. These features are experimental.

Use /ai tos agree:True to accept these terms, or agree:False to revoke your agreement.`,
  privacy: `AI Privacy Policy

Translation sends the selected message to OpenAI only if its author agreed to both the terms and privacy policy.
RPG flair review sends the submitted flair text to OpenAI. Neither feature fetches conversation history.
TripBot keeps consent timestamps linked to your account, but does not save translation or flair prompts and
responses as AI message history or copy them to the former AI audit channel. Translation replies are private;
flair review follows the RPG response visibility option. Discord messages remain until deleted on Discord.
Provider handling is separate from TripBot database deletion. TripBot does not train or fine-tune models
using these messages. Historical AI chat audit posts and replies require separate Discord cleanup.
Use /privacy delete to remove your consent records along with the other data covered by that command.

Use /ai privacy agree:True to accept this policy, or agree:False to revoke your agreement.`,
};

export const aiCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('ai')
    .setDescription('Terms and privacy controls for AI translation and flair review')
    .setIntegrationTypes([0])
    .addSubcommand(subcommand => subcommand
      .setName('tos')
      .setDescription('Read and manage agreement to the AI terms of service')
      .addBooleanOption(option => option.setName('agree').setDescription('Accept or revoke your agreement'))
      .addBooleanOption(option => option.setName('ephemeral').setDescription(VISIBILITY_DESCRIPTION)))
    .addSubcommand(subcommand => subcommand
      .setName('privacy')
      .setDescription('Read and manage agreement to the AI privacy policy')
      .addBooleanOption(option => option.setName('agree').setDescription('Accept or revoke your agreement'))
      .addBooleanOption(option => option.setName('ephemeral').setDescription(VISIBILITY_DESCRIPTION))),
  async execute(interaction) {
    log.info(F, 'AI consent controls used');
    const ephemeral = interaction.options.getBoolean('ephemeral') ?? true;
    await interaction.deferReply({ flags: ephemeral ? MessageFlags.Ephemeral : undefined });
    const subcommand = interaction.options.getSubcommand();
    if (subcommand !== 'tos' && subcommand !== 'privacy') {
      await interaction.editReply({ content: 'AI chat has been removed. Use /ai tos or /ai privacy for consent controls.' });
      return false;
    }

    const agree = interaction.options.getBoolean('agree');
    if (agree !== null) {
      const user = await getOrCreateUser(interaction.user.id);
      const field = subcommand === 'tos' ? 'ai_tos_agree' : 'ai_privacy_agree';
      const data = { [field]: agree ? new Date() : null };
      if (agree) {
        await db.ai_info.upsert({
          where: { user_id: user.id },
          create: { user_id: user.id, ...data },
          update: data,
        });
      } else {
        await db.ai_info.updateMany({ where: { user_id: user.id }, data });
      }
    }
    const confirmation = agree === null ? '' : `\n\nYour agreement was ${agree ? 'saved' : 'revoked'}.`;
    await interaction.editReply({ content: policies[subcommand] + confirmation });
    return true;
  },
};

export default aiCommand;
