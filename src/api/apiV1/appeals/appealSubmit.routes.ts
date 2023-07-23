import express from 'express';
import checkAuth from '../../utils/checkAuth';

import appeals from './appealSubmit.queries';

const F = f(__filename);

const router = express.Router();

router.post('/', async (req, res, next) => {
  if (await checkAuth(req, res)) {
    try {
      const result = await appeals.handle(req, res);
      // if (result) {
      //   return res.json(result);
      // }
      return next();
    } catch (error) {
      return next(error);
    }
  }
});

router.get('/', async (req, res, next) => {
  if (await checkAuth(req, res)) {
    try {
      res.json({
        welecome: `Appeals API expects a POST request`,
      });
      return next();
    } catch (error) {
      return next(error);
    }
  }
});

export default router;