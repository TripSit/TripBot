/* eslint-disable max-len */
/* eslint-disable sonarjs/no-duplicate-string */
import express from 'express';
import RateLimit from 'express-rate-limit';
import keycloakAuth, { AuthenticatedRequest } from '../../middlewares/keycloakAuth';
import { messageModThread, AppealData } from '../../../discord/utils/modUtils';

import appeals from './appeals.queries';
import users from '../users/users.queries';

const F = f(__filename);

const router = express.Router();

// set up rate limiter: maximum of 20 requests per minute
const limiter = RateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: process.env.NODE_ENV === 'production' ? 20 : 1000,
});

// apply rate limiter to all requests
router.use(limiter);
router.use(keycloakAuth);

router.get('/latest', async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.discord_id) {
      return res.status(400).json({ error: 'Discord ID not found in token' });
    }

    log.debug(F, `Getting latest appeal for discord_id: ${req.user.discord_id}`);
    const result = await appeals.getLatestAppeal(req.user.discord_id);

    if (result) {
      return res.json(result);
    }
    // Temporarily return 200 instead of 404 to test
    return res.status(200).json({ appeal: null, message: 'No appeals found' });
  } catch (error) {
    log.error(F, `Error getting latest appeal: ${error}`);
    return res.status(500).json({ error: 'Failed to get latest appeal' });
  }
});

router.post('/create', async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.discord_id) {
      return res.status(400).json({ error: 'Discord ID not found in token' });
    }

    const banStatus = await users.checkBanStatus(req.user.discord_id);

    if (!banStatus.banned) {
      return res.status(200).json({
        success: false,
        error: 'NOT_BANNED',
        message: 'You are not currently banned from TripSit',
      });
    }

    const appealData = {
      guildId: process.env.DISCORD_GUILD_ID,
      discordId: req.user.discord_id,
      ...req.body,
    } as AppealData;

    const totalLength = (appealData.reason?.length || 0)
                      + (appealData.solution?.length || 0)
                      + (appealData.future?.length || 0)
                      + (appealData.extra?.length || 0);

    // Account for the question text overhead (roughly 400 chars)
    if (totalLength > 3600) {
      return res.status(400).json({ error: 'Total appeal content cannot exceed 3600 characters' });
    }

    const result = await appeals.createAppeal({
      guild_id: appealData.guildId,
      discord_id: appealData.discordId,
      reason: appealData.reason,
      solution: appealData.solution,
      future: appealData.future,
      extra: appealData.extra,
    });

    if (!result.success) {
      if (result.error === 'COOLDOWN') {
        const cooldownPeriod = process.env.NODE_ENV === 'development' ? '30 seconds' : '3 months';
        return res.status(200).json({
          success: false,
          error: 'COOLDOWN',
          message: `You must wait ${cooldownPeriod} between appeal submissions`,
        });
      }
      if (result.error === 'USER_NOT_FOUND') {
        return res.status(200).json({
          success: false,
          error: 'USER_NOT_FOUND',
          message: 'User not found in database',
        });
      }
      return res.status(200).json({
        success: false,
        error: 'DATABASE_ERROR',
        message: 'Failed to create appeal due to a server error',
      });
    }

    const guild = await discordClient.guilds.fetch(process.env.DISCORD_GUILD_ID);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const botMember = await guild.members.fetch(discordClient.user!.id);
    if (!botMember) throw new Error('Failed to fetch bot user.');

    // Fetch the target user
    const targetUser = await discordClient.users.fetch(req.user.discord_id);
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
    return res.json({ success: true, message: 'Appeal submitted successfully' });
  } catch (error: unknown) {
    log.error(F, `Error in create route: ${error}`);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

router.post('/remind', async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.discord_id) {
      return res.status(400).json({ error: 'Discord ID not found in token' });
    }

    const result = await appeals.remindAppeal(req.user.discord_id);

    if (result.success) {
      return res.json({ success: true, message: result.message });
    }
    return res.status(200).json({ success: false, error: 'REMIND_FAILED', message: result.message });
  } catch (error) {
    log.error(F, `Error in remind route: ${error}`);
    return res.status(500).json({ error: 'Failed to send reminder' });
  }
});

// Get all user's appeals
router.get('/', async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.discord_id) {
      return res.status(400).json({ error: 'Discord ID not found in token' });
    }

    // First get the user by discord_id
    const user = await db.users.findFirst({
      where: {
        discord_id: req.user.discord_id,
      },
    });

    if (!user) {
      return res.status(200).json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'User not found',
        appeals: [],
      });
    }

    const result = await appeals.getAppeals(user.id);
    return res.json({ success: true, appeals: result });
  } catch (error) {
    log.error(F, `Error getting appeals: ${error}`);
    return res.status(500).json({ error: 'Failed to get appeals' });
  }
});

export default router;
