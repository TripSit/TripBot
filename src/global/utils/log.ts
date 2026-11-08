import { parse } from 'path';
import {
  addColors,
  createLogger,
  format,
  Logger,
  transports,
} from 'winston';
import Transport from 'winston-transport';
// import { Logtail } from '@logtail/node'; // eslint-disable-line
// import { LogtailTransport } from '@logtail/winston'; // eslint-disable-line
// import SentryTransport from 'winston-transport-sentry-node'; // eslint-disable-line
import * as Sentry from '@sentry/node';
import { TextChannel } from 'discord.js';
import { ConsoleTransportInstance } from 'winston/lib/winston/transports';
import { env } from './env.config';
import { ReportLimiter, withTimeout } from './errorReporter';

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

const TRANSPORT_SEND_TIMEOUT_MS = 10_000;
const transportLimiter = new ReportLimiter(30, 60_000, 60_000);

export class DiscordTransport extends Transport {
  async log(info: any, callback: () => void) {
    setImmediate(() => {
      this.emit('logged', info);
    });

    try {
      // Skip while Discord is down: the send would only time out and add more errors
      if (global.discordClient?.isReady() && transportLimiter.allow(String(info.message))) {
        const prefixDict = {
          error: '❌',
          warn: '⚠️',
          info: 'ℹ️',
          debug: '🐛',
          http: '🌐',
        } as {
          [key: string]: string;
        };

        await withTimeout((async () => {
          const channel = await discordClient.channels.fetch(env.CHANNEL_BOTERRORS);
          if (channel?.isTextBased() && channel instanceof TextChannel) {
            await channel.send(`${prefixDict[info.level]} ${info.message}`);
          }
        })(), TRANSPORT_SEND_TIMEOUT_MS, 'Sending a log line to Discord');
      }
    } catch (error) {
      // Not log.*: that would come straight back into this transport
      console.error('Failed to send message to Discord:', error); // eslint-disable-line no-console
    } finally {
      // Always release winston, or its stream stalls behind a log line that could not be delivered
      if (callback) callback();
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

// Discord error-channel logging and GlitchTip (Sentry) are production only
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
  warn: (F: string, message: string) => logger.warn(`[${F}] ${message}`),
  debug: (F: string, message: string) => logger.debug(`[${F}] ${message}`),
  http: (F: string, message: string) => logger.http(`[${F}] ${message}`),
};

global.log = log;

global.f = function f(filename: string) {
  return `${parse(filename).name}`;
};

export default log;
