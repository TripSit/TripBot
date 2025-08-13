/* eslint-disable sonarjs/no-duplicate-string */
import express from 'express';
import RateLimit from 'express-rate-limit';
// import checkAuth from '../../utils/checkAuth';
import keycloakAuth, { AuthenticatedRequest } from '../../utils/keycloakAuth';
import { messageModThread, AppealData } from '../../../discord/commands/guild/d.moderate';

import appeals from './appeals.queries';
// import users from '../users/users.queries';

const F = f(__filename);

const router = express.Router();

// set up rate limiter: maximum of 20 requests per minute
const limiter = RateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: process.env.NODE_ENV === 'production' ? 20 : 1000,
});

// apply rate limiter to all requests
router.use(limiter);

router.get('/:userId/latest', async (req: AuthenticatedRequest, res, next) => {
  const { userId } = req.params;
  log.debug(F, `userId: ${userId}`);
  try {
    if (!req.user?.discord_id) {
      return res.status(400).json({ error: 'Discord ID not found in token' });
    }
    if (userId === 'error') throw new Error('error');
    const result = await appeals.getLatestAppeal(userId);
    if (result) {
      return res.json(result);
    }
    return next();
  } catch (error) {
    return next(error);
  }
});

router.post('/:userId/create', async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.discord_id) {
      return res.status(400).json({ error: 'Discord ID not found in token' });
    }

    if (req.params.userId === 'error') throw new Error('error');
    const appealData = req.body.newAppealData as AppealData;
    const result = await appeals.createAppeal({
      guild_id: process.env.DISCORD_GUILD_ID,
      discord_id: req.params.userId,
      reason: appealData.reason,
      solution: appealData.solution,
      future: appealData.future,
      extra: appealData.extra,
      appeal_message_id: '54321',
    });

    if (result) {
      const botMember = await discordClient.guilds.cache.first()?.members.fetch(discordClient.user!.id);
      if (!botMember) throw new Error('Failed to fetch bot user.');

      // Fetch the target user
      const targetUser = await discordClient.users.fetch(appealData.userId);
      if (!targetUser) throw new Error('Failed to fetch target user.');

      const description = `
      **Do you know why you were banned?**: ${appealData.reason}

        **Have you taken any steps to rectify the situation or make amends for the behavior that lead to the ban?**: ${appealData.solution}

        **What steps will you take to ensure that you do not repeat the behavior that lead to the ban?**: ${appealData.future}

        **Is there anything else you would like to add?**: ${appealData.extra}
        `;
      await messageModThread(
        null,
        botMember,
        targetUser,
        'BAN_APPEAL',
        '',
        description,
        '',
        '',
        appealData,
      );
      return res.json(result);
    }
    return res.status(500).json({ error: 'Failed to create appeal' });
  } catch (error: unknown) {
    log.error(F, `Error in create route: ${error}`);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

router.get('/:userId', async (req: AuthenticatedRequest, res) => {
  const { userId } = req.params;
  log.debug(F, `userId: ${userId}`);
  try {
    if (userId === 'error') throw new Error('error');
    const result = await appeals.getAppeals(userId);
    if (result) {
      return res.json(result);
    }
    return res.status(404).json({ error: 'No appeals found' });
  } catch (error: unknown) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

// Get all user's appeals
router.get('/', async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.discord_id) {
      return res.status(400).json({ error: 'Discord ID not found in token' });
    }

    const result = await appeals.getAppeals(req.user.discord_id);
    return res.json(result);
  } catch (error: unknown) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

export default router;
