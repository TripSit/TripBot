import express from 'express';
import RateLimit from 'express-rate-limit';

import queries from './drugs.queries';

const router = express.Router();

// set up rate limiter: maximum of five requests per minute
const limiter = RateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5,
});

// apply rate limiter to all requests
router.use(limiter);

router.get('/', async (req, res) => {
  const result = await queries.getAllDrugs();
  res.json(result);
});

router.get('/:name', async (req, res, next) => {
  const { name } = req.params;
  // console.log('name', name);
  try {
    if (name === 'error') throw new Error('error');
    const result = await queries.getDrug(name);
    if (result) {
      return res.json(result);
    }
    return next();
  } catch (error) {
    return next(error);
  }
});

export default router;
