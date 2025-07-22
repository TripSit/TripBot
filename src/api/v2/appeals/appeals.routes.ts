import express from 'express';
import RateLimit from 'express-rate-limit';

import checkAuth from '../../utils/checkAuth';
import appeals from './appeals.queries';
// import users from '../users/users.queries';

const F = f(__filename);

const router = express.Router();

// set up rate limiter: maximum of five requests per minute
const limiter = RateLimit({
  max: 5,
  windowMs: 1 * 60 * 1000, // 1 minute
});

// apply rate limiter to all requests
router.use(limiter);

router.get('/', async (request, res) => {
  if (await checkAuth(request, res)) {
    const result = await appeals.getAllAppeals();
    res.json(result);
  }
});

router.get('/:userId', async (request, res, next) => {
  if (await checkAuth(request, res)) {
    const { userId } = request.params;
    log.debug(F, `userId: ${userId}`);
    try {
      if (userId === 'error') {
        throw new Error('error');
      }
      const result = await appeals.getAppeals(userId);
      if (result) {
        return res.json(result);
      }
      next();
      return;
    } catch (error) {
      next(error);
      return;
    }
  } else {
    next();
    return;
  }
});

router.get('/:userId/latest', async (request, res, next) => {
  if (await checkAuth(request, res)) {
    const { userId } = request.params;
    log.debug(F, `userId: ${userId}`);
    try {
      if (userId === 'error') {
        throw new Error('error');
      }
      const result = await appeals.getLatestAppeal(userId);
      if (result) {
        return res.json(result);
      }
      next();
      return;
    } catch (error) {
      next(error);
      return;
    }
  } else {
    next();
    return;
  }
});

export default router;
