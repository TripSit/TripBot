// import { Logtail } from '@logtail/node'; // eslint-disable-line
// import { LogtailTransport } from '@logtail/winston'; // eslint-disable-line
import type { Level } from 'rollbar';
import type { Logger } from 'winston';
import type { ConsoleTransportInstance } from 'winston/lib/winston/transports';

// import SentryTransport from 'winston-transport-sentry-node'; // eslint-disable-line
import * as Sentry from '@sentry/node';
import { TextChannel } from 'discord.js';
import { parse } from 'node:path';
import Rollbar from 'rollbar';
import { addColors, createLogger, format, transports } from 'winston';
import Transport from 'winston-transport';

import { env as environment } from './env.config';

const { combine, printf, splat, timestamp } = format;

addColors({
  debug: 'blue',
  error: 'red',
  http: 'magenta',
  info: 'green',
  warn: 'yellow',
});

class DiscordTransport extends Transport {
  async log(info: any, callback: () => void) {
    setImmediate(() => {
      this.emit('logged', info);
    });

    if (!globalThis.discordClient || !discordClient.isReady()) {
      if (callback) {
        callback();
      }
      return;
    }

    const prefixDict = {
      debug: '🐛',
      error: '❌',
      http: '🌐',
      info: 'ℹ️',
      warn: '⚠️',
    } as Record<string, string>;

    try {
      const channel = await discordClient.channels.fetch(environment.CHANNEL_BOTERRORS);
      if (!channel) {
        return;
      }
      if (!channel.isTextBased()) {
        return;
      }
      if (!(channel instanceof TextChannel)) {
        return;
      }
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
      printf(
        ({
        level, message, timestamp, stack, ...metadata // eslint-disable-line
        }) => {
          let message_ = '';
          message_ += environment.NODE_ENV === 'production' ? '(Prd) ' : `(Dev) ${timestamp} `;

          // This makes it so that the logs look nice and even
          // Idk why the length is 15, maybe cuz of colors
          message_ += level.length < 15 ? `${level}  ` : `${level} `;

          message_ += `${message} `;

          if (JSON.stringify(metadata) !== '{}') {
            console.debug(`metadata: ${JSON.stringify(metadata, null, 2)}`); // eslint-disable-line no-console
            message_ += JSON.stringify(metadata);
          }
          if (stack) {
            console.debug(`stack: ${stack}`); // eslint-disable-line no-console
            message_ += `\n${stack}`;
          }
          return message_;
        },
      ),
    ),
  }),
];

// We only want rollbar logs in production
if (environment.NODE_ENV === 'production') {
  transportOptions.push(
    new DiscordTransport({
      format: combine(
        printf(
          ({
        level, message, timestamp, stack, ...metadata // eslint-disable-line
          }) => {
            let message_ = '';
            message_ += environment.NODE_ENV === 'production' ? '(Prd) ' : `(Dev) ${timestamp} `;

            // This makes it so that the logs look nice and even
            // Idk why the length is 15, maybe cuz of colors
            message_ += level.length < 15 ? `${level}  ` : `${level} `;

            message_ += `${message} `;

            if (JSON.stringify(metadata) !== '{}') {
              console.debug(`metadata: ${JSON.stringify(metadata, null, 2)}`); // eslint-disable-line no-console
              message_ += JSON.stringify(metadata);
            }
            if (stack) {
              console.debug(`stack: ${stack}`); // eslint-disable-line no-console
              message_ += `\n${stack}`;
            }
            return message_;
          },
        ),
      ),
    }) as ConsoleTransportInstance,
  );
  const rollbarConfig = {
    accessToken: environment.ROLLBAR_TOKEN,
    // captureUncaught: true,
    // captureUnhandledRejections: true,
    logLevel: 'error' as Level,
  };
  globalThis.rollbar = new Rollbar(rollbarConfig);

  // Setup Sentry
  Sentry.init({
    dsn: environment.GLITCHTIP_DSN,
    // debug: true,
    environment: environment.NODE_ENV,
  });
}

const logger = createLogger({
  level: environment.DEBUG_LEVEL,
  transports: transportOptions,
});

declare global {
  var log: {
    debug: (prefix: string, message: string) => Logger;
    error: (prefix: string, message: string) => Logger;
    http: (prefix: string, message: string) => Logger;
    // NOSONAR
    info: (prefix: string, message: string) => Logger;
    warn: (prefix: string, message: string) => Logger;
  };

  var f: (filename: string) => string; // NOSONAR
}

export const log = {
  debug: (F: string, message: string) => logger.debug(`[${F}] ${message}`),
  error: (F: string, message: string) => logger.error(`[${F}] ${message}`),
  http: (F: string, message: string) => logger.http(`[${F}] ${message}`),
  info: (F: string, message: string) => logger.info(`[${F}] ${message}`),
  warn: (F: string, message: string) => {
    if (!message.includes('Missing')) {
      globalThis.rollbar.warn(message);
    }
    return logger.warn(`[${F}] ${message}`);
  },
};

globalThis.log = log;

globalThis.f = function f(filename: string) {
  return parse(filename).name;
};

export default log;
