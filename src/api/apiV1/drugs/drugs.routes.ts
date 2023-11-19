/* eslint-disable sonarjs/no-duplicate-string */
import express from 'express';
import RateLimit from 'express-rate-limit';

import queries from './drugs.queries';

const F = f(__filename);

const router = express.Router();

// set up rate limiter: maximum of five requests per minute
const limiter = RateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5,
});

// apply rate limiter to all requests
router.use(limiter);

// getInteraction
router.get('/getInteraction', (req, res) => {
  res.json({
    endpoint: 'getInteraction',
    properties: [
      '/drugAName',
      '/drugBName',
    ],
    example: '/getInteraction/DXM/MDMA',
  });
});
router.get('/getInteraction/:drugAName/:drugBName', async (req, res, next) => {
  const { drugAName, drugBName } = req.params;
  // console.log('drugAName', drugAName);
  // console.log('drugBName', drugBName);
  try {
    if (drugAName === 'error') throw new Error('error');
    if (drugBName === 'error') throw new Error('error');
    const result = await queries.getInteraction(drugAName, drugBName);
    log.debug(F, `result: ${JSON.stringify(result)}`);
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

// getDrug
router.get('/getDrug', (req, res) => {
  res.json({
    endpoint: 'getDrug',
    properties: [
      '/name',
    ],
    example: '/getDrug/DXM',
  });
});
router.get('/getDrug/:name', async (req, res, next) => {
  const { name } = req.params;
  // log.debug(F, `name: ${name}`);
  try {
    if (name === 'error') throw new Error('error');
    const result = await queries.getDrug(name);
    log.debug(F, `result: ${JSON.stringify(result)}`);
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
  // console.log('category', category);
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

// // getDrugCategory
// router.get('/getDrugCategory/', async (req, res) => {
//   res.json({
//     wecome: 'You must supply a drug category name',
//   });
// });
// router.get('/getDrugCategory/:name', async (req, res, next) => {
//   const { name } = req.params;
//   // console.log('name', name);
//   try {
//     if (name === 'error') throw new Error('error');
//     const result = await queries.getDrugCategory(name);
//     if (result) {
//       return res.json(result);
//     }
//     return next();
//   } catch (error) {
//     return next(error);
//   }
// });

// // getIRCFormattedDrug
// router.get('/getDrugCategory/', async (req, res) => {
//   res.json({
//     wecome: 'You must supply a drug category name',
//   });
// });
// router.get('/getIRCFormattedDrug/:name/:property', async (req, res, next) => {
//   const { name, property } = req.params;
//   // console.log('name', name);
//   // console.log('property', property);
//   try {
//     if (name === 'error') throw new Error('error');
//     if (property === 'error') throw new Error('error');
//     const result = await queries.getIRCFormattedDrug(name, property);
//     if (result) {
//       return res.json(result);
//     }
//     return next();
//   } catch (error) {
//     return next(error);
//   }
// });

// // delDrug
// router.post('/:name', async (req, res, next) => {
//   const { name } = req.params;
//   // console.log('name', name);
//   try {
//     if (name === 'error') throw new Error('error');
//     const result = await queries.getDrugCategory(name);
//     if (result) {
//       return res.json(result);
//     }
//     return next();
//   } catch (error) {
//     return next(error);
//   }
// });

// // setDrugProperty
// router.post('/:name', async (req, res, next) => {
//   const { name } = req.params;
//   // console.log('name', name);
//   try {
//     if (name === 'error') throw new Error('error');
//     const result = await queries.getDrugCategory(name);
//     if (result) {
//       return res.json(result);
//     }
//     return next();
//   } catch (error) {
//     return next(error);
//   }
// });

// // setCategoryProperty
// router.post('/:name', async (req, res, next) => {
//   const { name } = req.params;
//   // console.log('name', name);
//   try {
//     if (name === 'error') throw new Error('error');
//     const result = await queries.getDrugCategory(name);
//     if (result) {
//       return res.json(result);
//     }
//     return next();
//   } catch (error) {
//     return next(error);
//   }
// });

// // delDrugProperty
// router.post('/:name', async (req, res, next) => {
//   const { name } = req.params;
//   // console.log('name', name);
//   try {
//     if (name === 'error') throw new Error('error');
//     const result = await queries.getDrugCategory(name);
//     if (result) {
//       return res.json(result);
//     }
//     return next();
//   } catch (error) {
//     return next(error);
//   }
// });

// // createDrug
// router.post('/:name', async (req, res, next) => {
//   const { name } = req.params;
//   // console.log('name', name);
//   try {
//     if (name === 'error') throw new Error('error');
//     const result = await queries.getDrugCategory(name);
//     if (result) {
//       return res.json(result);
//     }
//     return next();
//   } catch (error) {
//     return next(error);
//   }
// });

export default router;
