import type { ModalSubmitInteraction } from 'discord.js';

/**
 * Predefined moderation reasons, taken from the "Limitations on use" section of the Terms of Service
 * (https://tripsit.me/terms). Picking one fills the message to the user when the moderator leaves it blank and
 * tags the internal note with the rule. The wording only restates the Terms; it adds no new rules.
 */
export type BanReason = {
  value: string;
  label: string;
  message: string;
};

export const BAN_REASON_SELECT_ID = 'rule';

export const BAN_REASONS: BanReason[] = [
  { value: 'underage', label: 'Under 18', message: 'TripSit is 18+ only. This includes joking about being under 18.' },
  { value: 'disruptive', label: 'Disruptive or offensive content', message: 'Your content impaired other members\' enjoyment of the server (for example flashing or spammed images, gore, or an offensive name or profile picture).' },
  { value: 'harassment', label: 'Harassment or hate', message: 'Content that victimizes, harasses, degrades, or intimidates a person or group is not allowed.' },
  { value: 'explicit', label: 'Explicit content outside designated areas', message: 'Explicit content is only allowed in the designated areas.' },
  { value: 'arguing', label: 'Arguing rules in public', message: 'Please do not argue rules or moderator actions in public channels. Use the appeal process instead.' },
  { value: 'sourcing', label: 'Sourcing', message: 'Discussing, requesting, or posting information about vendors or people who sell or coordinate substances is not allowed.' },
  { value: 'harmful', label: 'Promoting harmful practices', message: 'Content that encourages or normalizes dangerous substance use, or refusing to follow harm reduction standards, is not allowed.' },
  { value: 'misinformation', label: 'Misinformation or medical advice', message: 'Please do not post inaccurate content or medical advice.' },
  { value: 'privacy', label: 'Privacy violation or doxxing', message: 'Posting or collecting other people\'s personal information is not allowed.' },
  { value: 'evasion', label: 'Ban evasion', message: 'Creating a new account or otherwise getting around a moderator action is ban evasion.' },
  { value: 'links', label: 'Unapproved community links', message: 'Links to other communities that are not focused on harm reduction need prior permission.' },
  { value: 'interference', label: 'Interfering with the service', message: 'Flooding, probing, or otherwise interfering with the services is not allowed.' },
];

export function findBanReason(value: string | undefined): BanReason | undefined {
  return BAN_REASONS.find(reason => reason.value === value);
}

/** The reason picked in the modal, if the modal had the picker and one was chosen. */
export function selectedBanReason(modalInt: ModalSubmitInteraction): BanReason | undefined {
  try {
    return findBanReason(modalInt.fields.getStringSelectValues(BAN_REASON_SELECT_ID)[0]);
  } catch {
    return undefined;
  }
}

/** Tags the internal note with the rule, and fills the user-facing message only when it was left blank. */
export function applyBanReason(
  reason: BanReason | undefined,
  internalNote: string,
  description: string,
): { internalNote: string; description: string } {
  if (!reason) return { internalNote, description };
  return {
    internalNote: `[${reason.label}] ${internalNote}`.slice(0, 1000),
    description: description.trim() ? description : reason.message,
  };
}
