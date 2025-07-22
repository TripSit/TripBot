import bodyParser from 'body-parser';
import express from 'express';
import RateLimit from 'express-rate-limit';
import helmet from 'helmet';
import morgan from 'morgan';

import { errorHandler, notFound } from './middlewares/middlewares';
import api1 from './v1';
import api2 from './v2';

const F = f(__filename);

log.info(F, 'Started!');

const app = express();

// Middleware to log before rate limiting
// app.use((req, res, next) => {
//   // console.log(`Incoming request for ${req.method} ${req.url}`);
//   next();
// });

// set up rate limiter: maximum of five requests per minute
const limiter = RateLimit({
  handler: (request, res /* next */) => {
    res.status(429).send('Too many requests, please try again later.');
  },
  max: 60,
  windowMs: 1 * 60 * 1000, // 1 minute
});

// Apply rate limiter to all requests
app.use(limiter);

// For traefik reverse proxy
app.set('trust proxy', 2);

// Standard middleware
app.use(morgan('tiny'));
app.use(helmet());
app.use(express.json()); // configure the app to parse requests with JSON payloads
app.use(express.urlencoded({ extended: false })); // configure the app to parse requests with urlencoded payloads
app.use(bodyParser.text()); // configure the app to be able to read text

// CORS middleware
app.use((request, res, next) => {
  const allowedOrigins = [`https://${env.DNS_DOMAIN}`, `https://${env.BOT_DOMAIN}`];
  const { origin } = request.headers;
  if (origin) {
    if (allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.header(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept, Authorization',
    );
  }
  next();
});

// Routes
app.get('/api/ip', (request, response) => response.send(request.ip));
app.get('/api', (request, res) => {
  res.json({
    data: 'Want to change the data here? Check out the drug database repo at https://github.com/tripsit/drugs',
    description: 'You likely want one of the below endpoints.',
    developers:
      "Want type definitions? npm install tripsit/drugs and import { Drug, Interaction, Category } from 'tripsit_drug_db';",
    discord:
      'Want to discuss this API or other TripSit projects? Join the discord https://discord.gg/tripsit and check out the development rooms.',
    endpoints: {
      '/tripsit': {
        description: "TripSit's original API, preserved for legacy purposes.",
        endpoints: {
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
      },
      // '/v1': {
      //   description: 'Same as /tripsit, just renamed to v1 for consistency.',
      // },
      // '/v2': {
      //   description: 'TripSit\'s new API, under active development.',
      //   warning: 'This does not work, don\'t use it',
      //   endpoints: [
      //     '/drugs',
      //     '/interactions',
      //     '/combinations',
      //     '/categories',
      //     '/aliases',
      //     '/search',
      //   ],
      // },
    },
    github:
      'Want to help improve the API? Check out the code on the github: https://github.com/TripSit/TripBot/tree/main/src/api',
    welcome: "Welcome to TripSit's API endpoint.",
  });
});
app.use('/api/tripsit', api1);
app.use('/api/v1', api1);
app.use('/api/v2', api2);

// Error handling
app.use(notFound);
app.use(errorHandler);

export default app;
