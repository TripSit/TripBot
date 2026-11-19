import {
  ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, EmbedBuilder, InteractionEditReplyOptions,
} from 'discord.js';

export default function warningInteraction(messageId = 'warning-message', receiptFails = false) {
  const message = {
    id: messageId,
    embeds: [new EmbedBuilder().setTitle('Warned')],
    components: [new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId('acknowledgeButton').setLabel('Accept').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('refusalButton').setLabel('Reject').setStyle(ButtonStyle.Danger),
    )],
  };
  const raw = {
    user: { id: '111111111111111111', username: 'user', toString: (): string => '<@user>' },
    deferred: false,
    replied: false,
    message: { ...message, fetch: vi.fn(async () => message) },
    deferUpdate: vi.fn(async () => { raw.deferred = true; }),
    editReply: vi.fn(async (payload: InteractionEditReplyOptions) => {
      if (receiptFails && payload.embeds) throw new Error('gone');
      if (payload.components?.length === 0) message.components = [];
    }),
  };
  return { interaction: raw as unknown as ButtonInteraction, raw, message };
}
