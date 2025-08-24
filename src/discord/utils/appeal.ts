/* eslint-disable sonarjs/no-duplicate-string */
import { ButtonInteraction, InteractionEditReplyOptions, ModalSubmitInteraction } from 'discord.js';
import { appeal_status } from '@prisma/client';

const F = f(__filename);

function sanitizeAppealMessage(message: string): string {
  return message
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim()
    .slice(0, 1000); // Limit length to 1000 characters
}

async function updateAppeal(
  interaction: ButtonInteraction,
  discordId: string,
  userMessage: string,
  appealStatus: appeal_status,
): Promise<{ success: boolean; message: string }> {
  if (!interaction.guild) {
    return { success: false, message: 'This command can only be used in a guild.' };
  }

  const userData = await db.users.findFirst({
    where: { discord_id: discordId },
  });

  if (!userData) {
    return { success: false, message: 'User not found in database.' };
  }

  // Find the latest appeal first
  const latestAppeal = await db.appeals.findFirst({
    where: {
      user_id: userData.id,
      guild_id: interaction.guild.id,
      status: 'RECEIVED',
    },
    orderBy: {
      created_at: 'desc',
    },
  });

  if (!latestAppeal) {
    return { success: false, message: 'No pending appeal found for this user.' };
  }

  // Update only that specific appeal
  await db.appeals.update({
    where: {
      id: latestAppeal.id,
    },
    data: {
      status: appealStatus as appeal_status,
      decided_at: new Date(),
      response_message: userMessage,
    },
  });

  return { success: true, message: 'Appeal updated successfully' };
}

export async function appealAccept(
  interaction: ButtonInteraction,
  modalInteraction?: ModalSubmitInteraction,
): Promise<InteractionEditReplyOptions> {
  if (!interaction.guild) {
    return { content: 'This command can only be used in a guild.' };
  }
  // If no modal, something went wrong
  if (!modalInteraction) {
    return { content: 'Modal interaction required.' };
  }

  const [, , userId] = interaction.customId.split('~');
  const rawUserMessage = modalInteraction.fields.getTextInputValue('appealDescription');
  // Sanitize moderator input to prevent XSS (Yes, I know. This will never be necessary, but good practice)
  const userMessage = sanitizeAppealMessage(rawUserMessage);

  const result = await updateAppeal(interaction, userId, userMessage, 'ACCEPTED' as appeal_status);

  if (!result.success) {
    return { content: result.message };
  }

  try {
    await interaction.guild.bans.remove(userId, 'Ban appeal accepted by moderator');
  } catch (err) {
    log.error(F, `Error unbanning user: ${err}`);
  }
  return { content: `<@${userId}> has been unbanned and their appeal approved.` };
}

export async function appealReject(
  interaction: ButtonInteraction,
  modalInteraction?: ModalSubmitInteraction,
): Promise<InteractionEditReplyOptions> {
  if (!interaction.guild) {
    return { content: 'This command can only be used in a guild.' };
  }
  // If no modal, something went wrong
  if (!modalInteraction) {
    return { content: 'Modal interaction required.' };
  }

  const [, , userId] = interaction.customId.split('~');
  const rawUserMessage = modalInteraction.fields.getTextInputValue('appealDescription');
  const userMessage = sanitizeAppealMessage(rawUserMessage);

  const result = await updateAppeal(interaction, userId, userMessage, 'DENIED' as appeal_status);

  if (!result.success) {
    return { content: result.message };
  }

  return { content: `<@${userId}>'s appeal has been rejected.` };
}
