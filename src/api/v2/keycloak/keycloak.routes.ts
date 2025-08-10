import express from 'express';
import RateLimit from 'express-rate-limit';
import keycloak from './keycloak.queries';

const F = f(__filename);

const router = express.Router();

// Set up rate limiter: maximum of 20 requests per minute
const limiter = RateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: process.env.NODE_ENV === 'production' ? 20 : 1000,
});

// Apply rate limiter to all requests
router.use(limiter);

router.post('/token', async (req, res) => {
  try {
    const { code } = req.body;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Missing code' });
    }

    const tokenData = await keycloak.exchangeCodeForToken(code);
    return res.status(200).json(tokenData);
  } catch (error) {
    log.error(F, `Error in /token route: ${error}`);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.post('/userinfo', async (req, res) => {
  try {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const { access_token } = req.body;
    log.info(F, `Received access token: ${access_token}`);
    if (!access_token || typeof access_token !== 'string') {
      return res.status(400).json({ error: 'Missing access token' });
    }

    const userInfo = await keycloak.getUserInfo(access_token);
    return res.status(200).json(userInfo);
  } catch (error) {
    log.error(F, `Error in /userinfo route: ${error}`);
    return res.status(500).json({ error: 'Server error' });
  }
});

export default router;
