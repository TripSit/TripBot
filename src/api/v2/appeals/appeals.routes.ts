import express from 'express';
import RateLimit from 'express-rate-limit';
import checkAuth from '../../utils/checkAuth';

import appeals from './appeals.queries';
// import users from '../users/users.queries';

const F = f(__filename);

const router = express.Router();

// set up rate limiter: maximum of five requests per minute
const limiter = RateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20,
});

// apply rate limiter to all requests
router.use(limiter);

router.get('/:userId/latest', async (req, res, next) => {
  if (await checkAuth(req, res)) {
    const { userId } = req.params;
    log.debug(F, `userId: ${userId}`);
    try {
      if (userId === 'error') throw new Error('error');
      const result = await appeals.getLatestAppeal(userId);
      if (result) {
        return res.json(result);
      }
      return next();
    } catch (error) {
      return next(error);
    }
  } else {
    return next();
  }
});

router.post('/:userId/create', async (req, res, next) => {
  if (await checkAuth(req, res)) {
    try {
      if (req.params.userId === 'error') throw new Error('error');
      const appealData = req.body.newAppealData;
      const result = await appeals.createAppeal({
        guild_id: '960606557622657026',
        user_id: req.params.userId,
        reason: appealData.reason,
        solution: appealData.solution,
        future: appealData.future,
        extra: appealData.extra,
        appeal_message_id: '54321',
      });

      if (result) {
        return res.json(result);
      }
      return next();
    } catch (error) {
      return next(error);
    }
  } else {
    return next();
  }
});

router.get('/:userId', async (req, res, next) => {
  if (await checkAuth(req, res)) {
    const { userId } = req.params;
    log.debug(F, `userId: ${userId}`);
    try {
      if (userId === 'error') throw new Error('error');
      const result = await appeals.getAppeals(userId);
      if (result) {
        return res.json(result);
      }
      return next();
    } catch (error) {
      return next(error);
    }
  } else {
    return next();
  }
});

router.get('/', async (req, res) => {
  if (await checkAuth(req, res)) {
    const result = await appeals.getAllAppeals();
    res.json(result);
  }
});

export default router;
