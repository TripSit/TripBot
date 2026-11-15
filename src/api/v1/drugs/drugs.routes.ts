/* eslint-disable sonarjs/no-duplicate-string */
import express from 'express';
import RateLimit from 'express-rate-limit';

import queries from './drugs.queries';

const F = f(__filename); // eslint-disable-line

const router = express.Router();

// set up rate limiter: maximum of five requests per minute
const limiter = RateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5,
});

// apply rate limiter to all requests
router.use(limiter);

// getInteraction - readme
router.get('/getInteraction', (req, res) => {
  res.json({
    input: {
      drugA: 'string',
      drugB: 'string',
    },
    example: '/getInteraction/DXM/MDMA',
    output: {
      success: {
        result: 'string',
        interactionCategoryA: 'string',
        interactionCategoryB: 'string',
        definition: 'string?',
        thumbnail: 'string?',
        color: 'string?',
        note: 'string?',
        source: 'string?',
      },
      error: {
        err: 'boolean',
        msg: 'string',
        options: 'string[]',
      },
    },
  });
});

// getInteraction - function
router.get('/getInteraction/:drugAName/:drugBName', async (req, res, next) => {
  const { drugAName, drugBName } = req.params;
  try {
    if (drugAName === 'error') throw new Error('error');
    if (drugBName === 'error') throw new Error('error');
    const result = await queries.getInteraction(drugAName, drugBName);
    if (result) {
      return res.json({
        err: null,
        data: [result],
      });
    }
    return next();
  } catch (error) {
    return next(error);
  }
});

// getDrug - readme
router.get('/getDrug', (req, res) => {
  res.json({
    input: {
      drugName: 'string',
    },
    example: '/getDrug/DXM',
    output: {
      success: 'Drug Object, see github./com/tripsit/drugs for type info',
      error: {
        err: 'boolean',
        msg: 'string',
        options: 'string[]',
      },
    },
  });
});

// getDrug - function
router.get('/getDrug/:name', async (req, res, next) => {
  const { name } = req.params;
  try {
    if (name === 'error') throw new Error('error');
    const result = await queries.getDrug(name);
    if (result) {
      return res.json({
        err: null,
        data: [result],
      });
    }
    return next();
  } catch (error) {
    return next(error);
  }
});

// getAllDrugNames
router.get('/getAllDrugNames', async (req, res, next) => {
  try {
    const result = await queries.getAllDrugNames();
    if (result) {
      return res.json({
        err: null,
        data: [result],
      });
    }
    return next();
  } catch (error) {
    return next(error);
  }
});

// getAllDrugNamesByCategory
router.get('/getAllDrugNamesByCategory', (req, res) => {
  res.json({
    endpoint: 'getAllDrugNamesByCategory',
    properties: [
      '/category',
    ],
    example: '/getAllDrugNamesByCategory/stimulants',
  });
});

router.get('/getAllDrugNamesByCategory/:category', async (req, res, next) => {
  const { category } = req.params;
  try {
    if (category === 'error') throw new Error('error');
    const result = await queries.getAllDrugNamesByCategory(category);
    if (result) {
      return res.json({
        err: null,
        data: [result],
      });
    }
    return next();
  } catch (error) {
    return next(error);
  }
});

// getAllDrugs
router.get('/getAllDrugs', async (req, res, next) => {
  try {
    const result = await queries.getAllDrugs();
    if (result) {
      return res.json({
        err: null,
        data: [result],
      });
    }
    return next();
  } catch (error) {
    return next(error);
  }
});

// getAllCategories
router.get('/getAllCategories', async (req, res, next) => {
  try {
    const result = await queries.getAllCategories();
    if (result) {
      return res.json({
        err: null,
        data: [result],
      });
    }
    return next();
  } catch (error) {
    return next(error);
  }
});

// getAllDrugAliases
router.get('/getAllDrugAliases', async (req, res, next) => {
  try {
    const result = await queries.getAllDrugAliases();
    if (result) {
      return res.json({
        err: null,
        data: [result],
      });
    }
    return next();
  } catch (error) {
    return next(error);
  }
});

export default router;
