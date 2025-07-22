import express from 'express';

import appeals from './appeals/appeals.routes';
import bounty from './bounty/bounty.routes';
import discord from './discord/discord.routes';
import drugs from './drugs/drugs.routes';
import users from './users/users.routes';

const router = express.Router();

router.get('/', (request, res) => {
  res.json({
    description:
      "This is the new API for TripSit's database. It is currently in development and is not yet ready for production use.",
    privateEndpoints: ['/users', '/appeals', '/discord', '/bounty'],
    publicEndpoints: ['/drugs'],
    welcome: "Welcome to TripSit's new API",
  });
});

router.use('/drugs', drugs);
router.use('/users', users);
router.use('/appeals', appeals);
router.use('/discord', discord);
router.use('/bounty', bounty);

export default router;
