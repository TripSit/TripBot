import type { AwaitModalSubmitOptions, ModalSubmitInteraction } from 'discord.js';

/** How long a modal is waited for. Discord itself stops accepting the modal's submit after a while. */
export const MODAL_TIMEOUT_MS = 15 * 60 * 1000;

type ModalWaiter = {
  awaitModalSubmit(options: AwaitModalSubmitOptions<ModalSubmitInteraction>): Promise<ModalSubmitInteraction>;
};

/**
 * Waits for the submit of a modal that was just shown, for at most MODAL_TIMEOUT_MS.
 *
 * `awaitModalSubmit` with `time: 0` never ends, so every modal that is opened and then dismissed would leave a
 * collector listening on the client forever. With a finite time the collector is removed at the end; the promise
 * returned here then simply never settles, because a dismissed modal has nothing left to do and the callers have no
 * timeout handling to run.
 */
export function awaitModal(
  interaction: ModalWaiter,
  filter: (submit: ModalSubmitInteraction) => boolean,
): Promise<ModalSubmitInteraction> {
  return new Promise(resolve => {
    interaction.awaitModalSubmit({ filter, time: MODAL_TIMEOUT_MS }).then(resolve).catch(() => {
      // Timed out without a submit: the collector has been removed, and there is nothing to answer
    });
  });
}
