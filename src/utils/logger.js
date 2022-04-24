// const winston = require('winston');
const { createLogger, format, transports, addColors } = require('winston');
const production = process.env.NODE_ENV === 'true';
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
    get: function() {
        const orig = Error.prepareStackTrace;
        Error.prepareStackTrace = function(_, stack) {
            return stack;
        };
        const err = new Error;
        Error.captureStackTrace(err, arguments.callee);
        const stack = err.stack;
        Error.prepareStackTrace = orig;
        return stack;
    },
});

Object.defineProperty(global, '__line', {
    get: function() {
        return __stack[1].getLineNumber();
    },
});

Object.defineProperty(global, '__function', {
    get: function() {
        return __stack[1].getFunctionName();
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
        format.printf(info => `${!production ? `${info.timestamp}` : ''} ${info.level}:${info.message} ${info.stack ? `\n${info.stack}` : ''}`),
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