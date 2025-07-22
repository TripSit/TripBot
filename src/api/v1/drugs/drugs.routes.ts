import express from 'express';
import RateLimit from 'express-rate-limit';

import queries from './drugs.queries';

const F = f(__filename); // eslint-disable-line

const router = express.Router();

// set up rate limiter: maximum of five requests per minute
const limiter = RateLimit({
  max: 5,
  windowMs: 1 * 60 * 1000, // 1 minute
});

// apply rate limiter to all requests
router.use(limiter);

// getInteraction - readme
router.get('/getInteraction', (request, res) => {
  res.json({
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
  });
});

// getInteraction - function
router.get('/getInteraction/:drugAName/:drugBName', async (request, res, next) => {
  const { drugAName, drugBName } = request.params;
  // console.log('drugAName', drugAName);
  // console.log('drugBName', drugBName);
  try {
    if (drugAName === 'error') {
      throw new Error('error');
    }
    if (drugBName === 'error') {
      throw new Error('error');
    }
    const result = await queries.getInteraction(drugAName, drugBName);
    // log.debug(F, `result: ${JSON.stringify(result)}`);
    if (result) {
      return res.json({
        data: [result],
        err: null,
      });
    }
    next();
    return;
  } catch (error) {
    next(error);
    return;
  }
});

// getDrug - readme
router.get('/getDrug', (request, res) => {
  res.json({
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
  });
});

// getDrug - function
router.get('/getDrug/:name', async (request, res, next) => {
  const { name } = request.params;
  // log.debug(F, `name: ${name}`);
  try {
    if (name === 'error') {
      throw new Error('error');
    }
    const result = queries.getDrug(name);
    // log.debug(F, `result: ${JSON.stringify(result)}`);
    if (result) {
      return res.json({
        data: [result],
        err: null,
      });
    }
    next();
    return;
  } catch (error) {
    next(error);
    return;
  }
});

// getAllDrugNames
router.get('/getAllDrugNames', async (request, res, next) => {
  try {
    const result = await queries.getAllDrugNames();
    if (result) {
      return res.json({
        data: [result],
        err: null,
      });
    }
    next();
    return;
  } catch (error) {
    next(error);
    return;
  }
});

// getAllDrugNamesByCategory
router.get('/getAllDrugNamesByCategory', (request, res) => {
  res.json({
    endpoint: 'getAllDrugNamesByCategory',
    example: '/getAllDrugNamesByCategory/stimulants',
    properties: ['/category'],
  });
});

router.get('/getAllDrugNamesByCategory/:category', async (request, res, next) => {
  const { category } = request.params;
  // console.log('category', category);
  try {
    if (category === 'error') {
      throw new Error('error');
    }
    const result = await queries.getAllDrugNamesByCategory(category);
    if (result) {
      return res.json({
        data: [result],
        err: null,
      });
    }
    next();
    return;
  } catch (error) {
    next(error);
    return;
  }
});

// getAllDrugs
router.get('/getAllDrugs', async (request, res, next) => {
  try {
    const result = await queries.getAllDrugs();
    if (result) {
      return res.json({
        data: [result],
        err: null,
      });
    }
    next();
    return;
  } catch (error) {
    next(error);
    return;
  }
});

// getAllCategories
router.get('/getAllCategories', async (request, res, next) => {
  try {
    const result = await queries.getAllCategories();
    if (result) {
      return res.json({
        data: [result],
        err: null,
      });
    }
    next();
    return;
  } catch (error) {
    next(error);
    return;
  }
});

// getAllDrugAliases
router.get('/getAllDrugAliases', async (request, res, next) => {
  try {
    const result = await queries.getAllDrugAliases();
    if (result) {
      return res.json({
        data: [result],
        err: null,
      });
    }
    next();
    return;
  } catch (error) {
    next(error);
    return;
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
