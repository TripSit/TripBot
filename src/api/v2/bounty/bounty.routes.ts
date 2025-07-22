import type { TextChannel } from 'discord.js';

import express from 'express';
import RateLimit from 'express-rate-limit';

import { awardGitHubXP } from '../../../global/utils/experience';
import { getDiscordUserByGitHub } from '../../../global/utils/keycloak';
import checkAuth from '../../utils/checkAuth';

const F = f(__filename);
const router = express.Router();

// Set up rate limiter: maximum of five requests per minute
const limiter = RateLimit({
  max: 5,
  windowMs: 1 * 60 * 1000, // 1 minute
});

// Apply rate limiter to all requests
router.use(limiter);

// POST endpoint for GitHub to award bounty XP
router.post('/award-xp', async (request, res, next) => {
  try {
    if (await checkAuth(request, res)) {
      const { bounty: bountyAmount, github_username: githubUsername } = request.body;

      // Validate input
      if (!githubUsername || !bountyAmount) {
        return res.status(400).json({
          error: 'Missing required fields: github_username or bounty',
        });
      }

      if (typeof bountyAmount !== 'number' || bountyAmount <= 0 || bountyAmount >= 100_000) {
        return res.status(400).json({
          error: 'Bounty amount must be a positive number less than 100000 and greater than 0.',
        });
      }

      log.debug(F, `Awarding ${bountyAmount} XP to GitHub user: ${githubUsername}`);

      // Step 1: Look up Discord user via Keycloak using GitHub username
      const discordUserData = await getDiscordUserByGitHub(githubUsername);
      if (!discordUserData) {
        return res.status(404).json({
          error: `No Discord user found linked to GitHub username: ${githubUsername}`,
        });
      }

      // Step 2: Fetch the Discord guild and member
      const guild = await discordClient.guilds.fetch(env.DISCORD_GUILD_ID);
      const guildMember = await guild.members.fetch(discordUserData.id);
      if (!guildMember) {
        return res.status(404).json({
          error: `Guild Member with ID ${discordUserData.id} could not be found in TripSit Guild.`,
        });
      }

      log.debug(F, `Found Discord user ${guildMember.id} for GitHub user ${githubUsername}`);

      // Step 3: Make sure we aren't awarding to a team member
      if (guildMember.roles.cache.has(env.ROLE_TEAMTRIPSIT)) {
        log.error(
          F,
          `Cannot award XP to team members: ${guildMember.displayName} (${guildMember.id})`,
        );
        return res.status(403).json({
          error: 'Cannot award XP to team members.',
        });
      }

      const announceChannel = (await guild.channels.fetch(env.CHANNEL_DEVELOPMENT)) as TextChannel;

      // Step 4: Award XP to the Discord user
      await awardGitHubXP(guildMember, bountyAmount, announceChannel);

      log.info(
        F,
        `Successfully awarded ${bountyAmount} XP to ${guildMember.displayName} (${guildMember.id}) for GitHub contributions`,
      );

      // Step 5: Log the bounty in the database
      await db.claimed_bounties.create({
        data: {
          amount: bountyAmount,
          type: 'GitHub',
          user_id: guildMember.id,
        },
      });

      return res.json({
        bountyAmount,
        discordUserId: guildMember.id,
        message: `Awarded ${bountyAmount} XP to ${guildMember.displayName}`,
        success: true,
      });
    }
    next();
    return;
  } catch (error) {
    log.error(F, `Error awarding bounty XP: ${error}`);
    next(error);
    return;
  }
});

export default router;
