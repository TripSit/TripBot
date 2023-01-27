import {
  createLogger,
  format,
  transports,
  addColors,
  Logger,
} from 'winston';
import { Logtail } from '@logtail/node';
import { LogtailTransport } from '@logtail/winston';
import { parse } from 'path';
import { env } from './env.config';
//

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

// We only want logtail logs in production
let transportOptions = [];
if (env.NODE_ENV === 'production') {
  transportOptions = [
    new transports.Console(),

    new LogtailTransport(new Logtail('UHsXGDC8SgMzMNSNXeqyFpf7')),
  ];
} else {
  transportOptions = [
    new transports.Console(),
  ];
}

export const logger = createLogger({
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
  type Log = Logger;
  // eslint-disable-next-line no-var, vars-on-top
  var logger: Log; // NOSONAR
  // eslint-disable-next-line no-var, vars-on-top
  var log: { // NOSONAR
    info: (prefix:string, message:string) => Log,
    error: (prefix:string, message:string) => Log,
    warn: (prefix:string, message:string) => Log,
    debug: (prefix:string, message:string) => Log,
    http: (prefix:string, message:string) => Log,
  };
  // eslint-disable-next-line no-var, vars-on-top
  var f:(filename:string) => string; // NOSONAR
}

export const log = {
  info: (F: string, message: string) => logger.info(`[${F}] ${message}`),
  error: (F: string, message: string) => logger.error(`[${F}] ${message}`),
  warn: (F: string, message: string) => logger.warn(`[${F}] ${message}`),
  debug: (F: string, message: string) => logger.debug(`[${F}] ${message}`),
  http: (F: string, message: string) => logger.http(`[${F}] ${message}`),
};

global.log = log;
global.logger = logger;

global.f = function f(filename: string) {
  return `${parse(filename).name}`;
};

export default log;
