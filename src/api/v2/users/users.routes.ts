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
    return res.status(500).json({ error: 'Failed to check ban status' });
  }
});

// Get authenticated user's profile
router.get('/profile', async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.discord_id) {
      return res.status(400).json({ error: 'Discord ID not found in token' });
    }

    const result = await users.getUser(req.user.discord_id);
    if (result) {
      return res.json(result);
    }

    return res.status(404).json({ error: 'User not found' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to get user profile' });
  }
});

export default router;
