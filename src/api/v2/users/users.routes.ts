import express from 'express';
import RateLimit from 'express-rate-limit';
import keycloakAuth, { AuthenticatedRequest } from '../../middlewares/keycloakAuth';

import users from './users.queries';

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

router.get('/', async (req, res) => {
  res.json({ message: 'Oh, hello there!' });
});

// Check if user is banned
router.get('/banned', async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.discord_id) {
      return res.status(400).json({ error: 'Discord ID not found in token' });
    }

    log.debug(F, `Checking ban status for discord_id: ${req.user.discord_id}`);
    const banStatus = await users.checkBanStatus(req.user.discord_id);
    return res.json(banStatus);
  } catch (error) {
    log.error(F, `Error checking ban status: ${error}`);
    return res.status(200).json({
      success: false,
      banned: false,
      error: 'Failed to check ban status',
    });
  }
});

// Get user Discord avatar
router.get('/avatar', async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.discord_id) {
      return res.status(400).json({ error: 'Discord ID not found in token' });
    }

    log.debug(F, `Getting avatar for discord_id: ${req.user.discord_id}`);
    const avatarData = await users.getDiscordAvatar(req.user.discord_id);
    return res.json(avatarData);
  } catch (error) {
    log.error(F, `Error getting Discord avatar: ${error}`);
    return res.status(200).json({
      success: false,
      avatarUrl: '/assets/img/guest.png',
      error: 'Failed to get Discord avatar',
    });
  }
});

export default router;
