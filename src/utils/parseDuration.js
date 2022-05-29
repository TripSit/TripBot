'use strict';

const PREFIX = require('path').parse(__filename).name;
const logger = require('./logger');

module.exports = {
  async execute(duration) {
  // Those code inspired by https://gist.github.com/substanc3-dev/306bb4d04b2aad3a5d019052b1a0dec0
  // This is super cool, thanks a lot!
    const supported = 'smhdwmoy';
    const numbers = '0123456789';
    let stage = 1;
    let idx = 0;
    let tempNumber = 0;
    let tempString = '';
    let timeValue = 0;
    while (idx < duration.length) {
      const c = duration[idx];
      switch (stage) {
        default:
          break;
        case 1: // waiting for number
        {
          idx += 1;
          if (numbers.includes(c)) {
            tempString = c.toString();
            stage = 2;
          }
          break;
        }
        case 2: // parsing the number
        {
          if (numbers.includes(c)) {
            tempString += c;
            idx += 1;
          } else {
            logger.debug(`[${PREFIX}] TValue: ${tempString}`);
            tempNumber = Number.parseInt(tempString, 10);
            stage = 3;
          }
          break;
        }
        case 3: // parsing the qualifier
        {
          idx += 1;
          if (c === ' ') { break; } else if (supported.includes(c)) {
          // logger.debug(`[${PREFIX}] Qualifier ${c}`);
            switch (c) {
              default:
                logger.debug(`[${PREFIX}] Unknown qualifier ${c}`);
                break;
              case 'h':
                timeValue += tempNumber * 60 * 60 * 1000;
                break;
              case 'mo':
                timeValue += tempNumber * 30 * 24 * 60 * 60 * 1000;
                break;
              case 'm':
                timeValue += tempNumber * 60 * 1000;
                break;
              case 's':
                timeValue += tempNumber * 1000;
                break;
              case 'd':
                timeValue += tempNumber * 24 * 60 * 60 * 1000;
                break;
              case 'w':
                timeValue += tempNumber * 7 * 24 * 60 * 60 * 1000;
                break;
              case 'y':
                timeValue += tempNumber * 365 * 24 * 60 * 60 * 1000;
                break;
            }
            stage = 1;
            break;
          } else return timeValue;
        }
      }
    }
    return timeValue;
  },
};
