import {
  ModalSubmitInteraction,
} from 'discord.js';
import AiModal from '../utils/aiModals';
import { aiModal } from '../commands/global/d.ai';

const F = f(__filename); // eslint-disable-line @typescript-eslint/no-unused-vars

export default async (interaction: ModalSubmitInteraction) => {
  log.debug(F, 'Modal submitted');
  log.debug(F, `interaction: ${JSON.stringify(interaction.customId, null, 2)}`);
  const modalId = interaction.customId as keyof typeof AiModal.ID;
  if (modalId.startsWith('AI')) {
    await aiModal(interaction);
  }
};
