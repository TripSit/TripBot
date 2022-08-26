import {
  createLogger,
  format,
  transports,
  addColors,
} from 'winston';
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
  if (env.NODE_ENV !== 'production') {
    msg += `${timestamp} `;
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

const Logger = createLogger({
  level: 'debug',
  format: combine(
      format.colorize({all: true}),
      splat(),
      timestamp({format: 'YYYY-MM-DD HH:mm:ss'}),
      myFormat,
  ),
  transports: [
    new transports.Console(),
    new transports.File({
      filename: 'logs/error.log',
      level: 'error',
    }),
    new transports.File({
      filename: 'logs/all.log',
    }),
  ],
});

export default Logger;
