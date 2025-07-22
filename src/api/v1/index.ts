import express from 'express';

import drugs from './drugs/drugs.routes';

const router = express.Router();

router.get('/', (request, res) => {
  res.json({
    publicEndpoints: {
      '/getAllCategories': {
        output: 'string[]',
      },
      '/getAllDrugAliases': {
        output: 'string[]',
      },
      '/getAllDrugNames': {
        output: 'string[]',
      },
      '/getAllDrugNamesByCategory': {
        output: 'string[]',
      },
      '/getAllDrugs': {
        output: '{ [drugName: string]: Drug }, See github.com/tripsit/drugs for type info',
      },

      '/getDrug': {
        example: '/getDrug/DXM',
        input: {
          drugName: 'string',
        },
        output: {
          error: {
            err: 'boolean',
            msg: 'string',
            options: 'string[]',
          },
          success: 'Drug Object, see github./com/tripsit/drugs for type info',
        },
      },
      '/getInteraction': {
        example: '/getInteraction/DXM/MDMA',
        input: {
          drugA: 'string',
          drugB: 'string',
        },
        output: {
          error: {
            err: 'boolean',
            msg: 'string',
            options: 'string[]',
          },
          success: {
            color: 'string?',
            definition: 'string?',
            interactionCategoryA: 'string',
            interactionCategoryB: 'string',
            note: 'string?',
            result: 'string',
            source: 'string?',
            thumbnail: 'string?',
          },
        },
      },
    },
    welcome: "Welcome to TripSit's original API, preserved for legacy purposes.",
  });
});

router.use('/', drugs);

export default router;
