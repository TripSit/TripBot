import {
  ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle,
} from 'discord.js';

export const WerewolfModalId = {
  DIARY: 'werewolfDiary',
  DIARY_ENTRY: 'werewolfDiaryEntry',
};

export function diaryModal(day: number, interactionId: string): ModalBuilder {
  return new ModalBuilder()
    .setCustomId(`${WerewolfModalId.DIARY}~${interactionId}`)
    .setTitle(`My Diary on Night ${day}`)
    .addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder()
      .setLabel('Dear Diary,')
      .setStyle(TextInputStyle.Paragraph)
      .setCustomId(WerewolfModalId.DIARY_ENTRY)
      .setRequired(true)));
}
