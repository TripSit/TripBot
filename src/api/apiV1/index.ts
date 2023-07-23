import express, { Request, Response } from 'express';

import appeals from './appeals/appealSubmit.routes';

const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    welecome: `Welcome to TripBot API`,
    description: `This is an internal API and you should probably not be able to see this`,
    privateEndpoints: [
      '/appeals',
    ],
  });
});

router.use('/appeals', appeals);

export default router;
