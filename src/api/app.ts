import express from 'express';
import bodyParser from 'body-parser';
import morgan from 'morgan';

import helmet from 'helmet';
import { log } from '../global/utils/log';

import { notFound, errorHandler } from './middlewares';

import api1 from './apiV1';

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
  res.setHeader('Access-Control-Allow-Origin', 'https://tripbot.site');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization',
  );
  next();
});

app.get('/', (req, res) => {
  res.json({
    message: 'This is TripBot`s API',
  });
});

app.use('/api/v1', api1);

app.use(notFound);
app.use(errorHandler);

export default app;
