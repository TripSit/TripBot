import express from 'express';
import RateLimit from 'express-rate-limit';

import queries from './drugs.queries';

const router = express.Router();

// set up rate limiter: maximum of five requests per minute
const limiter = RateLimit({
  max: 5,
  windowMs: 1 * 60 * 1000, // 1 minute
});

// apply rate limiter to all requests
router.use(limiter);

router.get('/', async (request, res) => {
  const result = await queries.getAllDrugs();
  res.json(result);
});

router.get('/:name', async (request, res, next) => {
  const { name } = request.params;
  // console.log('name', name);
  try {
    if (name === 'error') {
      throw new Error('error');
    }
    const result = await queries.getDrug(name);
    if (result) {
      return res.json(result);
    }
    next();
    return;
  } catch (error) {
    next(error);
    return;
  }
});

export default router;
