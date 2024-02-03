import { parse } from 'path';
import {
  createLogger,
  format,
  transports,
  addColors,
  Logger,
} from 'winston';
// import { Logtail } from '@logtail/node'; // eslint-disable-line
// import { LogtailTransport } from '@logtail/winston'; // eslint-disable-line
import Rollbar, { Level } from 'rollbar';
// import SentryTransport from 'winston-transport-sentry-node'; // eslint-disable-line
import * as Sentry from '@sentry/node';
import { env } from './env.config';

// const RollbarTransport = require('winston-transport-rollbar-3');

const {
  combine,
  splat,
  timestamp,
  printf,
} = format;

addColors({
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
});

const myFormat = printf(({
  level, message, timestamp, stack, ...metadata // eslint-disable-line
}) => {
  let msg = '';
  if (env.NODE_ENV === 'production') {
    msg += '(Prd) ';
  } else {
    msg += `(Dev) ${timestamp} `;
  }

  // This makes it so that the logs look nice and even
  // Idk why the length is 15, maybe cuz of colors
  if (level.length < 15) {
    msg += `${level}  `;
  } else {
    msg += `${level} `;
  }

  msg += `${message} `;

  if (JSON.stringify(metadata) !== '{}') {
    console.debug(`metadata: ${JSON.stringify(metadata, null, 2)}`); // eslint-disable-line no-console
    msg += JSON.stringify(metadata);
  }
  if (stack) {
    console.debug(`stack: ${stack}`); // eslint-disable-line no-console
    msg += `\n${stack}`;
  }
  return msg;
});

// Old sentry stuff
// const sentryConfig = {
//   dsn: env.SENTRY_TOKEN,
//   debug: true, // Enable debug mode to         log internal transactions
//   // level: 'error',
//   tracesSampleRate: 1.0,
//   // environment: env.NODE_ENV,
//   // integrations: [
//   //   // enable HTTP calls tracing
//   //   new Sentry.Integrations.Http({ tracing: true }),
//   //   // Automatically instrument Node.js libraries and frameworks
//   //   ...Sentry.autoDiscoverNodePerformanceMonitoringIntegrations(),
//   // ],
// };

// console.log(`sentryConfig: ${JSON.stringify(sentryConfig)}`); // eslint-disable-line no-console

// Sentry.init(sentryConfig);

// const sentryTransportConfig = {
//   sentry: sentryConfig,
//   skipSentryInit: true,
//   level: 'error',
// };

// global.sentry = Sentry;

// const transaction = Sentry.startTransaction({
//   op: 'test',
//   name: 'My First Test Transaction',
// });

// setTimeout(() => {
//   try {
//     console.log('foo');
//     // @ts-ignore
//     foo(); // eslint-disable-line
//     console.log('bar');
//   } catch (e) {
//     console.log('error');
//     Sentry.captureException(e);
//   } finally {
//     transaction.finish();
//   }
// }, 99);

const transportOptions = [
  new transports.Console(),
];

// We only want rollbar logs in production
// let transportOptions = [];
if (env.NODE_ENV === 'production') {
  const rollbarConfig = {
    accessToken: env.ROLLBAR_TOKEN,
    // captureUncaught: true,
    // captureUnhandledRejections: true,
    logLevel: 'error' as Level,
  };

  // transportOptions.push(new RollbarTransport({ rollbarConfig }));
  // Setup Rollbar

  global.rollbar = new Rollbar(rollbarConfig);

  // Setup glitchTip
  Sentry.init({
    dsn: env.GLITCHTIP_DSN,
    // debug: true,
    environment: env.NODE_ENV,
  });
}

const logger = createLogger({
  level: env.DEBUG_LEVEL,
  format: combine(
    format.colorize({ all: true }),
    splat(),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    myFormat,
  ),
  transports: transportOptions,
});

declare global {
  // eslint-disable-next-line no-var, vars-on-top
  var log: { // NOSONAR
    info: (prefix:string, message:string) => Logger,
    error: (prefix:string, message:string) => Logger,
    warn: (prefix:string, message:string) => Logger,
    debug: (prefix:string, message:string) => Logger,
    http: (prefix:string, message:string) => Logger,
  };
  // eslint-disable-next-line no-var, vars-on-top
  var f:(filename:string) => string; // NOSONAR
}

export const log = {
  info: (F: string, message: string) => logger.info(`[${F}] ${message}`),
  error: (F: string, message: string) => logger.error(`[${F}] ${message}`),
  warn: (F: string, message: string) => {
    if (!message.includes('Missing')) {
      global.rollbar.warn(message);
    }
    return logger.warn(`[${F}] ${message}`);
  },
  debug: (F: string, message: string) => logger.debug(`[${F}] ${message}`),
  http: (F: string, message: string) => logger.http(`[${F}] ${message}`),
};

global.log = log;

global.f = function f(filename: string) {
  return `${parse(filename).name}`;
};

export default log;
