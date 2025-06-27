import { parse } from 'path';
import {
  createLogger,
  format,
  transports,
  addColors,
  Logger,
} from 'winston';
import Transport from 'winston-transport';
// import { Logtail } from '@logtail/node'; // eslint-disable-line
// import { LogtailTransport } from '@logtail/winston'; // eslint-disable-line
import Rollbar, { Level } from 'rollbar';
// import SentryTransport from 'winston-transport-sentry-node'; // eslint-disable-line
import * as Sentry from '@sentry/node';
import { ConsoleTransportInstance } from 'winston/lib/winston/transports';
import { TextChannel } from 'discord.js';
import { env } from './env.config';

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

class DiscordTransport extends Transport {
  async log(info: any, callback: () => void) {
    setImmediate(() => {
      this.emit('logged', info);
    });

    if (!global.discordClient || !discordClient.isReady()) {
      if (callback) callback();
      return;
    }

    const prefixDict = {
      error: '❌',
      warn: '⚠️',
      info: 'ℹ️',
      debug: '🐛',
      http: '🌐',
    } as {
      [key: string]: string;
    };

    try {
      const channel = await discordClient.channels.fetch(env.CHANNEL_BOTERRORS);
      if (!channel) return;
      if (!channel.isTextBased()) return;
      if (!(channel instanceof TextChannel)) return;
      await channel.send(`${prefixDict[info.level]} ${info.message}`);
    } catch (error) {
      console.error('Failed to send message to Discord:', error); // eslint-disable-line no-console
    }

    if (callback) {
      callback();
    }
  }
}

const transportOptions = [
  new transports.Console({
    format: combine(
      format.colorize({ all: true }),
      splat(),
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      printf(({
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
      }),
    ),
  }),
];

// We only want rollbar logs in production
if (env.NODE_ENV === 'production') {
  transportOptions.push(new DiscordTransport({
    format: combine(
      printf(({
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
      }),
    ),
  }) as ConsoleTransportInstance);
  const rollbarConfig = {
    accessToken: env.ROLLBAR_TOKEN,
    // captureUncaught: true,
    // captureUnhandledRejections: true,
    logLevel: 'error' as Level,
  };
  global.rollbar = new Rollbar(rollbarConfig);

  // Setup Sentry
  Sentry.init({
    dsn: env.GLITCHTIP_DSN,
    // debug: true,
    environment: env.NODE_ENV,
  });
}

const logger = createLogger({
  level: env.DEBUG_LEVEL,
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
