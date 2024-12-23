// import log from './logger';
// import {parse} from 'path';
// const F = f(__filename);

export default parseDuration;

/**
 * This takes a string and converts it into time
 * @param {string} duration A string representing a duration
 * @return {number} The duration in milliseconds
 */
export async function parseDuration(duration:string):Promise<number> {
  // Those code inspired by https://gist.github.com/substanc3-dev/306bb4d04b2aad3a5d019052b1a0dec0
  // This is super cool, thanks a lot!
  const supported = 'smMhdwmoy';
  const numbers = '0123456789';
  let stage = 1;
  let idx = 0;
  let tempNumber = 0;
  let tempString = '';
  let timeValue = 0;
  while (idx < duration.length) {
    const c = duration[idx];
    switch (stage) {
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
          // log.debug(F, `TValue: ${tempString}`);
          tempNumber = Number.parseInt(tempString, 10);
          stage = 3;
        }
        break;
      }
      case 3: // parsing the qualifier
      {
        idx += 1;
        if (c === ' ') {
          break;
        } else if (supported.includes(c)) {
          // log.debug(F, `Qualifier ${c}`);
          if (c === 'h') {
            timeValue += tempNumber * 60 * 60 * 1000;
          }
          if (c === 'M') {
            timeValue += tempNumber * 30 * 24 * 60 * 60 * 1000;
          }
          if (c === 'm') {
            timeValue += tempNumber * 60 * 1000;
          }
          if (c === 's') {
            timeValue += tempNumber * 1000;
          }
          if (c === 'd') {
            timeValue += tempNumber * 24 * 60 * 60 * 1000;
          }
          if (c === 'w') {
            timeValue += tempNumber * 7 * 24 * 60 * 60 * 1000;
          }
          if (c === 'y') {
            timeValue += tempNumber * 365 * 24 * 60 * 60 * 1000;
          }
          stage = 1;
          break;
        } else return timeValue;
      }
      default:
        break;
    }
  }
  return timeValue;
}

export const validateDurationInput = (input: string): boolean => {
  const regex = /^(\d+(yr|M|w|d|h|m|s)\s?)+$/;
  return regex.test(input.trim());
};
