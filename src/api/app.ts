/* eslint-disable max-len */

// Add return types
// Make tests

import express from 'express';
import bodyParser from 'body-parser';
import morgan from 'morgan';

import helmet from 'helmet';
import RateLimit from 'express-rate-limit';

import { notFound, errorHandler } from './middlewares';

import api1 from './apiV1';
import api2 from './apiV2';

const F = f(__filename);

log.info(F, 'Started!');

const app = express();

/* Configure the app */

app.use(morgan('tiny'));
app.use(helmet());
app.use(express.json());

app.use(express.urlencoded({ extended: false })); // configure the app to parse requests with urlencoded payloads
app.use(express.json()); // configure the app to parse requests with JSON payloads
app.use(bodyParser.text()); // configure the app to be able to read text
app.use(bodyParser.json()); // configure the app to be able to read json

// from TB: Add Access Control Allow Origin headers
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', `https://${env.DNS_DOMAIN}`);
  res.setHeader('Access-Control-Allow-Origin', `https://${env.BOT_DOMAIN}`);
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization',
  );
  next();
});

// For traefik reverse proxy
app.set('trust proxy', 2);

// Simple IP return to test reverse proxy and "hello world" the api
app.get('/api/ip', (request, response) => response.send(request.ip));

app.get('/api', (req, res) => {
  res.json({
    welcome: 'Welcome to TripSit\'s API endpoint.',
    description: 'You likely want one of the below endpoints.',
    developers: 'Want type definitions? npm install tripsit/drugs and import { Drug, Interaction, Category } from \'tripsit_drug_db\';',
    data: 'Want to change the data here? Check out the drug database repo at https://github.com/tripsit/drugs',
    discord: 'Want to discuss this API or other TripSit projects? Join the discord https://discord.gg/tripsit and check out the development rooms.',
    github: 'Want to help improve the API? Check out the code on the github: https://github.com/TripSit/TripBot/tree/main/src/api',
    endpoints: {
      '/tripsit': {
        description: 'TripSit\'s original API, preserved for legacy purposes.',
        endpoints: [
          '/getInteraction',
          '/getDrug',
          '/getAllDrugNames',
          '/getAllDrugNamesByCategory',
          '/getAllDrugs',
          '/getAllCategories',
          '/getAllDrugAliases',
        ],
      },
      '/v1': {
        description: 'Same as /tripsit, just renamed to v1 for consistency.',
        endpoints: [
          '/getInteraction',
          '/getDrug',
          '/getAllDrugNames',
          '/getAllDrugNamesByCategory',
          '/getAllDrugs',
          '/getAllCategories',
          '/getAllDrugAliases',
        ],
      },
      '/v2': {
        description: 'TripSit\'s new API, under active development.',
        warning: 'This does not work, don\'t use it',
        endpoints: [
          '/drugs',
          '/interactions',
          '/combinations',
          '/categories',
          '/aliases',
          '/search',
        ],
      },
    },
  });
});

app.use('/api/tripsit', api1);
app.use('/api/v1', api1);
app.use('/api/v2', api2);

app.use(notFound);
app.use(errorHandler);

// set up rate limiter: maximum of five requests per minute
const limiter = RateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5,
});

// apply rate limiter to all requests
app.use(limiter);

export default app;
