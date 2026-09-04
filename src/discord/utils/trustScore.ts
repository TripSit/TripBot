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

export async function tripSitTrustScore(
  targetId: string,
): Promise<{
    trustScore: number;
    tsReasoning: string;
  }> {
  // const startTime = Date.now();
  let trustScore = 0;
  let tsReasoning = '';
  const targetPromise = discordClient.users.fetch(targetId);
  const guildsPromise = discordClient.guilds.fetch();

  const target = await targetPromise; // Await here since target is needed for the calculations below
  // Calculate how like it is that this user is a trust.
  // This is based off of factors like, how old is their account, do they have a profile picture, etc.
  const diff = Math.abs(Date.now() - Date.parse(target.createdAt.toString()));
  const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365));
  const months = Math.floor(diff / (1000 * 60 * 60 * 24 * 30));
  const weeks = Math.floor(diff / (1000 * 60 * 60 * 24 * 7));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  if (years > 0) {
    trustScore += 6;
    tsReasoning += '+6 | Account was created at least a year ago\n';
  } else if (years === 0 && months > 0) {
    trustScore += 5;
    tsReasoning += '+5 | Account was created months ago\n';
  } else if (months === 0 && weeks > 0) {
    trustScore += 4;
    tsReasoning += '+4 | Account was created weeks ago\n';
  } else if (weeks === 0 && days > 0) {
    trustScore += 3;
    tsReasoning += '+3 | Account was created days ago\n';
  } else if (days === 0 && hours > 0) {
    trustScore += 2;
    tsReasoning += '+2 | Account was created hours ago\n';
  } else if (hours === 0 && minutes > 0) {
    trustScore += 1;
    tsReasoning += '+1 | Account was created minutes ago\n';
  } else if (minutes === 0 && seconds > 0) {
    trustScore += 0;
    tsReasoning += '+0 | Account was created seconds ago\n';
  }

  if (target.avatarURL()) {
    trustScore += 1;
    tsReasoning += '+1 | Account has a profile picture\n';
  } else {
    trustScore += 0;
    tsReasoning += '+0 | Account does not have a profile picture\n';
  }

  // if (target.bannerURL() !== null) {
  //   trustScore += 1;
  //   tsReasoning += '+1 | Account has a banner\n';
  // } else {
  //   trustScore += 0;
  //   tsReasoning += '+0 | Account does not have a banner\n';
  // }

  // Check how many guilds the member is in
  // await discordClient.guilds.fetch();
  // const targetInGuilds = await Promise.all(discordClient.guilds.cache.map(async guild => {
  //   try {
  //     await guild.members.fetch(target.id);
  //     // log.debug(F, `User is in guild: ${guild.name}`);
  //     return guild;
  //   } catch (err: unknown) {
  //     return null;
  //   }
  // }));

  const [, targetInGuilds] = await Promise.all([
    guildsPromise, // Await the fetched guilds
    Promise.all(discordClient.guilds.cache.map(async guild => {
      if (guild.members.cache.get(target.id)) {
        return guild;
      }
      return null;
    })),
  ]);
  const mutualGuilds = targetInGuilds.filter(item => item);

  if (mutualGuilds.length > 0) {
    trustScore += mutualGuilds.length;
    tsReasoning += `+${mutualGuilds.length} | I currently share ${mutualGuilds.length} guilds with them\n`;
  } else {
    trustScore += 0;
    tsReasoning += '+0 | Account is only in this guild, that i can tell\n';
  }

  await discordClient.guilds.fetch();
  // const noPermissionGuilds = [] as Guild[];
  const notFoundGuilds = [] as Guild[];
  const errorGuilds = [] as Guild[];
  // const bannedTest = await Promise.all(discordClient.guilds.cache.map(async guild => {
  //   // log.debug(F, `Checking guild: ${guild.name}`);
  //   const guildPerms = await checkGuildPermissions(guild, [
  //     'BanMembers' as PermissionResolvable,
  //   ]);

  //   if (!guildPerms) {
  //     // log.debug(F, `No permission to check guild: ${guild.name}`);
  //     noPermissionGuilds.push(guild);
  //     return null;
  //   }

  //   try {
  //     return await guild.bans.fetch(target.id);
  //     // log.debug(F, `User is banned in guild: ${guild.name}`);
  //     // return guild.name;
  //   } catch (err: unknown) {
  //     if ((err as DiscordAPIError).code === 10026) {
  //       // log.debug(F, `User is not banned in guild: ${guild.name}`);
  //       notFoundGuilds.push(guild);
  //       return null;
  //     }
  //     // log.debug(F, `Error checking guild: ${guild.name}`);
  //     errorGuilds.push(guild);
  //     return null;
  //   }
  // }));

  // Separate promises for checking permissions and bans
  const permissionsPromises = discordClient.guilds.cache.map(guild => checkGuildPermissions(guild, ['BanMembers' as PermissionResolvable]));
  const bansPromises = discordClient.guilds.cache.map(async guild => {
    try {
      return guild.bans.cache.get(target.id);
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
  // log.debug(F, `Banned Guilds: ${bannedGuilds.join(', ')}`);

  // log.debug(F, `permissionsResults: ${permissionsResults}`);
  // log.debug(F, `bannedTest: ${bannedTest}`);
  const noPermissionGuilds = permissionsResults.filter(item => !item.hasPermission);

  // count how many i didn't have permission to check
  // log.debug(F, `No Permission Guilds: ${noPermissionGuilds.map(guild => guild.name).join(', ')}`);
  // log.debug(F, `Not Found Guilds: ${notFoundGuilds.map(guild => guild.name).join(', ')}`);
  // log.debug(F, `Error Guilds: ${errorGuilds.map(guild => guild.name).join(', ')}`);
  const checkedGuildNumber = bannedTest.length - noPermissionGuilds.length;

  if (bannedGuilds.length === 0) {
    trustScore += 0;
    tsReasoning += stripIndents`+0 | Not banned in ${checkedGuildNumber} other guilds that I can see.`;
  } else {
    trustScore -= (bannedGuilds.length * 5);
    // eslint-disable-next-line max-len

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

    tsReasoning += stripIndents`-${(bannedGuilds.length * 5)} | Banned in least ${bannedGuilds.length} of the ${checkedGuildNumber} guilds I can check.
    ${tsBanReasons}
    `;
  }

  // log.debug(F, `[trust score] time: ${Date.now() - startTime}ms`);
  return {
    trustScore,
    tsReasoning,
  };
}
