/* eslint-disable sonarjs/no-duplicate-string */
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
    const { code, code_verifier: codeVerifier } = req.body;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Missing code' });
    }

    // RFC 7636 permits 43-128 unreserved characters; never trim or transform the proof.
    if (
      typeof codeVerifier !== 'string'
      || codeVerifier.length < 43
      || codeVerifier.length > 128
      || /[^A-Za-z0-9._~-]/.test(codeVerifier)
    ) {
      return res.status(400).json({ error: 'Missing or invalid code verifier' });
    }

    const tokenData = await keycloak.exchangeCodeForToken(code, codeVerifier);
    return res.status(200).json(tokenData);
  } catch (error) {
    log.error(F, `Error in /token route: ${error}`);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.post('/refresh', async (req, res) => {
  try {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const { refresh_token } = req.body;

    if (!refresh_token || typeof refresh_token !== 'string') {
      return res.status(400).json({ error: 'Missing refresh token' });
    }

    const newTokens = await keycloak.refreshToken(refresh_token);
    return res.status(200).json(newTokens);
  } catch (error) {
    log.error(F, `Error in /refresh route: ${error}`);
    return res.status(500).json({ error: 'Server error' });
  }
});

export default router;
