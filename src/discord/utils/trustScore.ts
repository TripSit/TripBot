/* eslint-disable max-len */
import { stripIndents } from 'common-tags';
import {
  DiscordAPIError,
  Guild,
  GuildBan,
  PermissionResolvable,
} from 'discord.js';
import { checkGuildPermissions } from './checkPermissions';

// Separate file: modHistory needs this and modUtils imports modHistory.
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
  if (!bracket) return { score: 0, reasoning: '' };
  const [, score, description] = bracket;
  return { score, reasoning: `+${score} | Account was created ${description}\n` };
}

async function scoreMutualGuilds(targetId: string, guildsPromise: Promise<unknown>): Promise<ScoreResult> {
  const [, targetInGuilds] = await Promise.all([
    guildsPromise, // Await the fetched guilds
    Promise.all(discordClient.guilds.cache.map(async guild => {
      if (guild.members.cache.get(targetId)) {
        return guild;
      }
      return null;
    })),
  ]);
  const mutualGuilds = targetInGuilds.filter(item => item);

  if (mutualGuilds.length > 0) {
    return {
      score: mutualGuilds.length,
      reasoning: `+${mutualGuilds.length} | I currently share ${mutualGuilds.length} guilds with them\n`,
    };
  }
  return { score: 0, reasoning: '+0 | Account is only in this guild, that i can tell\n' };
}

async function scoreBans(targetId: string): Promise<ScoreResult> {
  await discordClient.guilds.fetch();
  const notFoundGuilds = [] as Guild[];
  const errorGuilds = [] as Guild[];

  // Separate promises for checking permissions and bans
  const permissionsPromises = discordClient.guilds.cache.map(guild => checkGuildPermissions(guild, ['BanMembers' as PermissionResolvable]));
  const bansPromises = discordClient.guilds.cache.map(async guild => {
    try {
      return guild.bans.cache.get(targetId);
    } catch (err: unknown) {
      if ((err as DiscordAPIError).code === 10026) {
        notFoundGuilds.push(guild);
        return null;
      }
      errorGuilds.push(guild);
      return null;
    }
  });

  const [permissionsResults, bannedTest] = await Promise.all([
    Promise.all(permissionsPromises),
    Promise.all(bansPromises),
  ]);

  // count how many 'banned' appear in the array
  const bannedGuilds = bannedTest.filter(item => item) as GuildBan[];

  // count how many i didn't have permission to check
  const noPermissionGuilds = permissionsResults.filter(item => !item.hasPermission);
  const checkedGuildNumber = bannedTest.length - noPermissionGuilds.length;

  if (bannedGuilds.length === 0) {
    return { score: 0, reasoning: stripIndents`+0 | Not banned in ${checkedGuildNumber} other guilds that I can see.` };
  }

  const tsBanReasons = (await Promise.all(bannedGuilds.map(async banData => {
    if (banData.partial) {
      await banData.fetch();
    }

    let reasonStr = ': No reason found.';
    if (banData.reason) {
      reasonStr = `: ${banData.reason}`;
    }

    return `${banData.guild.name}${reasonStr}`;
  }))).join('\n');

  return {
    score: -(bannedGuilds.length * 5),
    reasoning: stripIndents`-${(bannedGuilds.length * 5)} | Banned in least ${bannedGuilds.length} of the ${checkedGuildNumber} guilds I can check.
    ${tsBanReasons}
    `,
  };
}

export async function tripSitTrustScore(
  targetId: string,
): Promise<{
    trustScore: number;
    tsReasoning: string;
  }> {
  const targetPromise = discordClient.users.fetch(targetId);
  const guildsPromise = discordClient.guilds.fetch();

  const target = await targetPromise; // Await here since target is needed for the calculations below
  // Calculate how like it is that this user is a trust.
  // This is based off of factors like, how old is their account, do they have a profile picture, etc.
  const age = scoreAccountAge(Math.abs(Date.now() - Date.parse(target.createdAt.toString())));

  const avatar: ScoreResult = target.avatarURL()
    ? { score: 1, reasoning: '+1 | Account has a profile picture\n' }
    : { score: 0, reasoning: '+0 | Account does not have a profile picture\n' };

  // Check how many guilds the member is in
  const mutual = await scoreMutualGuilds(target.id, guildsPromise);
  const bans = await scoreBans(target.id);

  return {
    trustScore: age.score + avatar.score + mutual.score + bans.score,
    tsReasoning: age.reasoning + avatar.reasoning + mutual.reasoning + bans.reasoning,
  };
}
