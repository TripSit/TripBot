import express from 'express';
import RateLimit from 'express-rate-limit';
import checkAuth from '../../utils/checkAuth';
import { notifyPrOpened } from '../../../discord/commands/global/d.prReview';

const F = f(__filename);
const router = express.Router();

// Set up rate limiter: maximum of ten requests per minute
const limiter = RateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10,
});

// Apply rate limiter to all requests
router.use(limiter);

// POST endpoint for GitHub Actions to notify TripBot of a newly opened PR
router.post('/notify', async (req, res, next) => {
  try {
    if (await checkAuth(req, res)) {
      const {
        number, title, body, url, author, testsPassed, testsTotal, checksPassed, checksSummary,
      } = req.body;

      if (!number || !title || !url) {
        return res.status(400).json({
          error: 'Missing required fields: number, title, or url',
        });
      }

      await notifyPrOpened({
        number,
        title,
        body: body ?? '',
        url,
        author: author ?? 'unknown',
        testsPassed: typeof testsPassed === 'number' ? testsPassed : 0,
        testsTotal: typeof testsTotal === 'number' ? testsTotal : 0,
        checksPassed: typeof checksPassed === 'boolean' ? checksPassed : false,
        checksSummary: typeof checksSummary === 'string' ? checksSummary : '',
      });

      return res.json({ success: true });
    }
    return next();
  } catch (error) {
    log.error(F, `Error notifying PR opened: ${error}`);
    return next(error);
  }
});

export default router;
