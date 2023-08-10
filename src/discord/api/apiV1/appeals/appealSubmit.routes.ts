import express from 'express';
import RateLimit from 'express-rate-limit';
import checkAuth from '../../utils/checkAuth';

import appeals from './appealSubmit.queries';

const F = f(__filename); // eslint-disable-line

const router = express.Router();

// set up rate limiter: maximum of five requests per minute
const limiter = RateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5,
});

// apply rate limiter to all requests
router.use(limiter);

router.post('/', async (req, res, next) => {
  if (await checkAuth(req, res)) {
    try {
      await appeals.handle(req, res);
      return next();
    } catch (error) {
      return next(error);
    }
  } else {
    return next();
  }
});

router.get('/', async (req, res, next) => {
  if (await checkAuth(req, res)) {
    try {
      res.json({
        welecome: 'Appeals API expects a POST request',
      });
      return next();
    } catch (error) {
      return next(error);
    }
  } else {
    return next();
  }
});

export default router;
