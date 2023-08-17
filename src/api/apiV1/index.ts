import express from 'express';

import drugs from './drugs/drugs.routes';

const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    wecome: 'Welcome to TripSit\'s original API, preserved for legacy purposes.',
    publicEndpoints: [
      '/getInteraction',
      '/getDrug',
      '/getAllDrugNames',
      '/getAllDrugNamesByCategory',
      '/getAllDrugs',
      '/getAllCategories',
      '/getAllDrugAliases',
    ],
  });
});

router.use('/', drugs);

export default router;
