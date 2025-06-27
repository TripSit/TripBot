import express from 'express';

import drugs from './drugs/drugs.routes';
import users from './users/users.routes';
import appeals from './appeals/appeals.routes';
import discord from './discord/discord.routes';
import bounty from './bounty/bounty.routes';

const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    welcome: 'Welcome to TripSit\'s new API',
    description: 'This is the new API for TripSit\'s database. It is currently in development and is not yet ready for production use.', // eslint-disable-line max-len
    publicEndpoints: [
      '/drugs',
    ],
    privateEndpoints: [
      '/users',
      '/appeals',
      '/discord',
      '/bounty',
    ],
  });
});

router.use('/drugs', drugs);
router.use('/users', users);
router.use('/appeals', appeals);
router.use('/discord', discord);
router.use('/bounty', bounty);

export default router;
