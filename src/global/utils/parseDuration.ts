// import log from './logger';
// import {parse} from 'path';
// const F = f(__filename);

export default parseDuration;

/**
 * This takes a string and converts it into time
 * @param {string} duration A string representing a duration
 * @return {number} The duration in milliseconds
 */
export async function parseDuration(duration: string): Promise<number> {
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
    const c = duration[idx]; // Normalize to lowercase for easier comparison
    switch (stage) {
      case 1: // Waiting for number
        if (numbers.includes(c)) {
          tempString = c;
          stage = 2;
        }
        idx += 1;
        break;

      case 2: // Parsing the number
        if (numbers.includes(c)) {
          tempString += c;
          idx += 1;
        } else {
          tempNumber = Number.parseInt(tempString, 10);
          stage = 3;
        }
        break;

      case 3: // Parsing the qualifier
        if (c === ' ') {
          idx += 1;
          break;
        } else if (supported.includes(c)) {
          // Handle single-letter qualifiers
          if (c === 'h') {
            timeValue += tempNumber * 60 * 60 * 1000; // Hours
          } else if (c === 'M' || c === 'm') {
            // Check if the next characters spell "month" or "months"
            const nextChars = duration.slice(idx, idx + 5).toLowerCase();
            if (nextChars.startsWith('month') || c === 'M') {
              timeValue += tempNumber * 30 * 24 * 60 * 60 * 1000; // Convert months to milliseconds
              if (c === 'M') {
                idx += 1; // Skip 'M'
              } else if (nextChars.startsWith('months')) {
                idx += 6; // Skip 'months'
              } else {
                idx += 5; // Skip 'month'
              }
            } else {
              timeValue += tempNumber * 60 * 1000; // Minutes
            }
          } else if (c === 's') {
            timeValue += tempNumber * 1000; // Seconds
          } else if (c === 'd') {
            timeValue += tempNumber * 24 * 60 * 60 * 1000; // Days
          } else if (c === 'w') {
            timeValue += tempNumber * 7 * 24 * 60 * 60 * 1000; // Weeks
          } else if (c === 'y') {
            timeValue += tempNumber * 365 * 24 * 60 * 60 * 1000; // Years
          }
          stage = 1;
          break;
        } else {
          return timeValue; // Unsupported qualifier
        }

      default:
        break;
    }
  }
  return timeValue;
}

/*
 Input validation for parseDuration. Ensures string is a written time in one or multiple of 3 formats.
*/
export const validateDurationInput = (input: string): boolean => {
  // eslint-disable-next-line max-len
  const regex = /^(\d+\s?(years|year|months|month|weeks|week|days|day|hours|hour|minutes|minute|min|mins|seconds|second|sec|secs|y|M|w|d|h|m|s)\s?)+$/i;

  return regex.test(input.trim());
};

/*
 This function takes input in the form of years/months, etc, as written and converts them to smMhdwmoy format.
 It was used to force string compliance for parseDuration but may not be necessary.
 Feel free to remove it if it's not used in a year or two.
*/
export async function makeValid(duration: string): Promise<string> {
  // Define a map for the units and their short forms
  const unitMap: Record<string, string> = {
    years: 'y',
    year: 'y',
    months: 'M',
    month: 'M',
    weeks: 'w',
    week: 'w',
    days: 'd',
    day: 'd',
    hours: 'h',
    hour: 'h',
    minutes: 'm',
    minute: 'm',
    seconds: 's',
    second: 's',
  };

  // Regular expression to match the input format
  const regex = /\b(\d+)\s*(years?|months?|weeks?|days?|hours?|minutes?|seconds?)\b/gi;

  // Array to store the parsed results
  const parts: string[] = [];

  // Replace matched parts with their formatted versions
  let match;
  // eslint-disable-next-line no-cond-assign
  while ((match = regex.exec(duration)) !== null) {
    const value = match[1]; // The number (e.g., "1")
    const unit = match[2].toLowerCase(); // The unit (e.g., "year" or "years")

    // Map the unit to its short form and combine with the value
    if (unit in unitMap) {
      parts.push(`${value}${unitMap[unit]}`);
    }
  }

  // Join the parts with a space to form the final result
  return parts.join(' ');
}
