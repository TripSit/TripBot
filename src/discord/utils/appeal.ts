/* eslint-disable sonarjs/no-duplicate-string */
import { ButtonInteraction, InteractionEditReplyOptions, ModalSubmitInteraction } from 'discord.js';
import { appeal_status, appeals } from '@prisma/client';

const F = f(__filename);

function sanitizeAppealMessage(message: string): string {
  return message
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
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

  // Find the latest appeal (any status)
  const latestAppeal = await db.appeals.findFirst({
    where: {
      user_id: userData.id,
      guild_id: interaction.guild.id,
    },
    orderBy: {
      created_at: 'desc',
    },
  });

  if (!latestAppeal) {
    return { success: false, message: 'No appeal found for this user.' };
  }

  // Check current status and validate state transitions
  if (latestAppeal.status === 'ACCEPTED' && appealStatus === 'ACCEPTED') {
    return { success: false, message: 'This appeal has already been accepted.' };
  }
  if (latestAppeal.status === 'ACCEPTED' && appealStatus === 'DENIED') {
    return {
      success: false,
      message: 'This appeal has already been accepted and cannot be changed.',
    };
  }
  if (latestAppeal.status === 'DENIED' && appealStatus === 'DENIED') {
    return {
      success: false,
      message: 'This appeal has already been denied. You can accept it to override the decision.',
    };
  }
  // Allow: RECEIVED → any status, DENIED → ACCEPTED

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
  // Sanitize moderator input to prevent XSS (Yes, I know. This will never be necessary, but good practice)
  const userMessage = sanitizeAppealMessage(rawUserMessage);

  const result = await updateAppeal(interaction, userId, userMessage, 'DENIED' as appeal_status);

  if (!result.success) {
    return { content: result.message };
  }

  return { content: `<@${userId}>'s appeal has been rejected.` };
}

export async function appealReminder(
  appeal: appeals,
) {
  const userData = await db.users.findFirst({
    where: { id: appeal.user_id },
  });

  if (!userData) {
    log.error(F, `User not found for appeal ID: ${appeal.id}`);
    return { success: false, message: `User not found for appeal ID: ${appeal.id}` };
  }

  if (!userData.mod_thread_id) {
    log.error(F, `No mod thread ID found for user ID: ${appeal.user_id}`);
    return { success: false, message: 'No mod thread found for this user' };
  }

  try {
    // Get the mod thread channel
    const modThread = await discordClient.channels.fetch(userData.mod_thread_id);

    if (!modThread || !modThread.isThread()) {
      log.error(F, `Mod thread not found or invalid: ${userData.mod_thread_id}`);
      return { success: false, message: 'Mod thread not found or invalid' };
    }

    // Create the reminder message
    const reminderMessage = `<@${userData.discord_id}> reminded us to review their ban appeal:

**Submitted:** ${new Date(appeal.created_at).toLocaleString()}
**Status:** ${appeal.status}

This appeal has been pending review. Please check when you have a moment.

<@&${env.ROLE_MODERATOR}>`;

    // Send the message to the mod thread
    await modThread.send({
      content: reminderMessage,
      allowedMentions: {
        roles: [env.ROLE_MODERATOR as string],
      },
    });

    log.info(F, `Appeal reminder sent for appeal ID: ${appeal.id} in thread: ${userData.mod_thread_id}`);
    return { success: true, message: 'Your reminder has been sent!' };
  } catch (error) {
    log.error(F, `Error sending appeal reminder: ${error}`);
    return { success: false, message: 'Something went wrong. Your reminder was not sent.' };
  }
}
