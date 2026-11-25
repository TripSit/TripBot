/* eslint-disable max-len */
// Separate file: modHistory needs this and modUtils imports modHistory.
// Only the account's own age and avatar are used: bans and memberships in other guilds are deliberately not checked.
export default tripSitTrustScore;

type ScoreResult = { score: number; reasoning: string };

// The older the account, the more it is trusted: the first unit that the account is old enough for wins
const ACCOUNT_AGE_SCORES: [number, number, string][] = [
  [1000 * 60 * 60 * 24 * 365, 6, 'at least a year ago'],
  [1000 * 60 * 60 * 24 * 30, 5, 'months ago'],
  [1000 * 60 * 60 * 24 * 7, 4, 'weeks ago'],
  [1000 * 60 * 60 * 24, 3, 'days ago'],
  [1000 * 60 * 60, 2, 'hours ago'],
  [1000 * 60, 1, 'minutes ago'],
  [1000, 0, 'seconds ago'],
];

function scoreAccountAge(accountAgeMs: number): ScoreResult {
  const bracket = ACCOUNT_AGE_SCORES.find(([unitMs]) => accountAgeMs >= unitMs);
  /* v8 ignore next -- accounts are never created less than a second ago */
  if (!bracket) return { score: 0, reasoning: '' };
  const [, score, description] = bracket;
  return { score, reasoning: `+${score} | Account was created ${description}\n` };
}

export async function tripSitTrustScore(
  targetId: string,
): Promise<{
    trustScore: number;
    tsReasoning: string;
  }> {
  const targetPromise = discordClient.users.fetch(targetId);

  const target = await targetPromise; // Await here since target is needed for the calculations below
  // Calculate how like it is that this user is a trust.
  // This is based off of factors like, how old is their account, do they have a profile picture, etc.
  const age = scoreAccountAge(Math.abs(Date.now() - Date.parse(target.createdAt.toString())));

  const avatar: ScoreResult = target.avatarURL()
    ? { score: 1, reasoning: '+1 | Account has a profile picture\n' }
    : { score: 0, reasoning: '+0 | Account does not have a profile picture\n' };

  return {
    trustScore: age.score + avatar.score,
    tsReasoning: age.reasoning + avatar.reasoning,
  };
}
