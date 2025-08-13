import express from 'express';
import RateLimit from 'express-rate-limit';
// import checkAuth from '../../utils/checkAuth';
import keycloakAuth, { AuthenticatedRequest } from '../../utils/keycloakAuth';

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

router.get('/', async (req, res) => {
  // log.debug(F, 'Getting all users');
  // const result = await users.getAllUsers();
  res.json({ message: 'Oh, hello there!' });
});

router.get('/:discordId', async (req: AuthenticatedRequest, res, next) => {
  const { discordId } = req.params;
  log.debug(F, `discordId: ${discordId}`);
  try {
    if (!req.user?.discord_id) {
      return res.status(400).json({ error: 'Discord ID not found in token' });
    }

    if (discordId === 'error') throw new Error('error');
    const result = await users.getUser(discordId);
    if (result) {
      log.debug(F, `Returning result: ${JSON.stringify(result)}`);
      return res.json(result);
    }
    return next();
  } catch (error) {
    return next(error);
  }
});

router.get('/:discordId/banned', async (req: AuthenticatedRequest, res) => {
  const { discordId } = req.params;
  log.debug(F, `Checking ban status for discordId: ${discordId}`);
  try {
    if (!req.user?.discord_id) {
      return res.status(400).json({ error: 'Discord ID not found in token' });
    }

    if (discordId === 'error') throw new Error('error');

    const banStatus = await users.checkBanStatus(discordId);
    return res.json(banStatus);
  } catch (error) {
    log.error(F, `Error checking ban status: ${error}`);
    return res.status(500).json({ error: 'Failed to check ban status' });
  }
});

export default router;
