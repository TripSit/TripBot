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
  max: 5,
});

// apply rate limiter to all requests
router.use(limiter);

router.get('/', async (req, res) => {
  if (await checkAuth(req, res)) {
    const result = await appeals.getAllAppeals();
    res.json(result);
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

export default router;
