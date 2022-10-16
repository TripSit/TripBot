import {
  createLogger,
  format,
  transports,
  addColors,
} from 'winston';
import {Logtail} from '@logtail/node';
import {LogtailTransport} from '@logtail/winston';
import env from './env.config';

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

const myFormat = printf( ({level, message, timestamp, stack, ...metadata}) => {
  let msg = ``;
  if (env.NODE_ENV === 'production') {
    msg += `(Prd) `;
  } else {
    msg += `(Dev) ${timestamp} `;
  }

  // This makes it so that the logs look nice and even
  // Idk why the length is 15, maybe cuz of colors?
  if (level.length < 15) {
    msg += `${level}  `;
  } else {
    msg += `${level} `;
  }

  msg += `${message} `;

  if (JSON.stringify(metadata) !== '{}') {
    console.debug(`metadata: ${JSON.stringify(metadata, null, 2)}`);
    msg += JSON.stringify(metadata);
  }
  if (stack) {
    console.debug(`stack: ${stack}`);
    msg += `\n${stack}`;
  }
  return msg;
});

// We only want logtail logs in production
let transportOptions = [];
if (env.NODE_ENV === 'production') {
  transportOptions = [
    new transports.Console(),
    new LogtailTransport(new Logtail('wCKy55XyvN5aJRqyiRTYbza5')),
  ];
} else {
  transportOptions = [
    new transports.Console(),
  ];
}

const Logger = createLogger({
  level: 'debug',
  format: combine(
    format.colorize({all: true}),
    splat(),
    timestamp({format: 'YYYY-MM-DD HH:mm:ss'}),
    myFormat,
  ),
  transports: transportOptions,
});

export default Logger;
