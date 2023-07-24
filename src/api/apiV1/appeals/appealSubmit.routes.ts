import express from 'express';
import checkAuth from '../../utils/checkAuth';

import appeals from './appealSubmit.queries';

const F = f(__filename); // eslint-disable-line

const router = express.Router();

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
