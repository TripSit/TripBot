'use strict';

// const winston = require('winston');
const {
  createLogger, format, transports, addColors,
} = require('winston');

const {
  NODE_ENV,
} = require('../../env');

const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  modules: 3,
  modwarn: 4,
  modinfo: 5,
  debug: 6,
};

Object.defineProperty(global, '__stack', {
  get() {
    const orig = Error.prepareStackTrace;
    Error.prepareStackTrace = function prepareStackTrace(_, stack) {
      return stack;
    };
    const err = new Error();
    Error.captureStackTrace(err, arguments.callee); // eslint-disable-line
    const { stack } = err;
    Error.prepareStackTrace = orig;
    return stack;
  },
});

Object.defineProperty(global, '__line', {
  get() {
    return __stack[1].getLineNumber(); // eslint-disable-line
  },
});

Object.defineProperty(global, '__function', {
  get() {
    return __stack[1].getFunctionName(); // eslint-disable-line
  },
});

// const logger = winston.createLogger({
module.exports = createLogger({
  levels: logLevels,
  transports: [new transports.Console({ colorize: true, timestamp: true })],
  format: format.combine(
    format.colorize(),
    format.padLevels({ levels: logLevels }),
    format.timestamp({ format: 'MMM-DD-YYYY HH:mm:ss' }),
    format.printf(info => `${info.timestamp} ${info.level}:${info.message} ${info.stack ? `\n${info.stack}` : ''}`),
    format.printf(info => `${NODE_ENV !== 'production' ? `${info.timestamp}` : ''} ${info.level}:${info.message} ${info.stack ? `\n${info.stack}` : ''}`),
  ),
  level: 'debug',

  // export { logger };
  // export default logger;
  // module.exports = logger;
});

addColors({
  error: 'red',
  warn: 'yellow',
  info: 'green',
  modules: 'cyan',
  modwarn: 'yellow',
  modinfo: 'green',
  debug: 'blue',
});
