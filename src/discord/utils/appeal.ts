/* eslint-disable sonarjs/no-duplicate-string */
import { ButtonInteraction, InteractionEditReplyOptions, ModalSubmitInteraction } from 'discord.js';
import { appeal_status } from '@prisma/client';

const F = f(__filename);

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
  log.info(F, 'appealAccept called with modModal');
  if (!interaction.guild) {
    return { content: 'This command can only be used in a guild.' };
  }
  // If no modal, show modal first
  if (!modalInteraction) {
    return { content: 'Modal interaction required.' };
  }

  const [, userId] = interaction.customId.split('~');
  const userMessage = modalInteraction.fields.getTextInputValue('appealDescription');

  const result = await updateAppeal(interaction, userId, userMessage, 'ACCEPTED' as appeal_status);

  if (!result.success) {
    return { content: result.message };
  }

  try {
    await interaction.guild.bans.remove(userId, 'Appeal accepted');
  } catch (err) {
    log.error(F, `Error unbanning user: ${err}`);
  }
  log.info(F, 'appealAccept completed');
  return { content: `User <@${userId}> has been unbanned and their appeal approved.` };
}

export async function appealReject(
  interaction: ButtonInteraction,
  modalInteraction?: ModalSubmitInteraction,
): Promise<InteractionEditReplyOptions> {
  log.info(F, 'appealReject called with modModal');
  if (!interaction.guild) {
    return { content: 'This command can only be used in a guild.' };
  }
  // If no modal, show modal first
  if (!modalInteraction) {
    return { content: 'Modal interaction required.' };
  }

  const [, userId] = interaction.customId.split('~');
  const userMessage = modalInteraction.fields.getTextInputValue('appealDescription');

  const result = await updateAppeal(interaction, userId, userMessage, 'DENIED' as appeal_status);

  if (!result.success) {
    return { content: result.message };
  }
  log.info(F, 'appealReject completed');
  return { content: `User <@${userId}> appeal has been rejected.` };
}
