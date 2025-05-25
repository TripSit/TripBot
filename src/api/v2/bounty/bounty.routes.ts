import express from 'express';
import RateLimit from 'express-rate-limit';
import checkAuth from '../../utils/checkAuth';
import { getDiscordUserByGitHub } from '../../../global/utils/keycloak'; // or similar

const F = f(__filename);
const router = express.Router();

// Set up rate limiter: maximum of five requests per minute
const limiter = RateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5,
});

// Apply rate limiter to all requests
router.use(limiter);

// POST endpoint for GitHub to award bounty XP
router.post('/award-xp', async (req, res, next) => {
  try {
    if (await checkAuth(req, res)) {
      const { github_username: githubUsername, bounty: bountyAmount } = req.body;

      // Validate input
      if (!githubUsername || !bountyAmount) {
        return res.status(400).json({
          error: 'Missing required fields: github_username or bounty',
        });
      }

      if (typeof bountyAmount !== 'number' || bountyAmount <= 0) {
        return res.status(400).json({
          error: 'Bounty amount must be a positive number',
        });
      }

      log.debug(F, `Awarding ${bountyAmount} XP to GitHub user: ${githubUsername}`);

      // Step 1: Look up Discord user via Keycloak using GitHub username
      const discordUser = await getDiscordUserByGitHub(githubUsername);
      if (!discordUser) {
        return res.status(404).json({
          error: `No Discord user found linked to GitHub username: ${githubUsername}`,
        });
      }

      log.debug(F, `Found Discord user ${discordUser.id} for GitHub user ${githubUsername}`);

      // Step 2: Award XP to the Discord user
      const xpResult = await awardXP(discordUser.id, bountyAmount, 'GitHub Bounty');

      // eslint-disable-next-line max-len
      log.info(F, `Successfully awarded ${bountyAmount} XP to ${discordUser.username} (${discordUser.id}) for GitHub contributions`);

      return res.json({
        success: true,
        message: `Awarded ${bountyAmount} XP to ${discordUser.username}`,
        discordUserId: discordUser.id,
        bountyAmount,
      });
    }
    return next();
  } catch (error) {
    log.error(F, `Error awarding bounty XP: ${error}`);
    return next(error);
  }
});

export default router;
