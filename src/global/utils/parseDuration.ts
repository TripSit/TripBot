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
  let index = 0;
  let temporaryNumber = 0;
  let temporaryString = '';
  let timeValue = 0;

  while (index < duration.length) {
    const c = duration[index]; // Normalize to lowercase for easier comparison
    switch (stage) {
      case 1: {
        // Waiting for number
        if (numbers.includes(c)) {
          temporaryString = c;
          stage = 2;
        }
        index += 1;
        break;
      }

      case 2: {
        // Parsing the number
        if (numbers.includes(c)) {
          temporaryString += c;
          index += 1;
        } else {
          temporaryNumber = Number.parseInt(temporaryString, 10);
          stage = 3;
        }
        break;
      }

      case 3: {
        // Parsing the qualifier
        if (c === ' ') {
          index += 1;
          break;
        } else if (supported.includes(c)) {
          // Handle single-letter qualifiers
          switch (c) {
            case 'd': {
              timeValue += temporaryNumber * 24 * 60 * 60 * 1000; // Days

              break;
            }
            case 'h': {
              timeValue += temporaryNumber * 60 * 60 * 1000; // Hours

              break;
            }
            case 'M':
            case 'm': {
              // Check if the next characters spell "month" or "months"
              const nextChars = duration.slice(index, index + 5).toLowerCase();
              if (nextChars.startsWith('month') || c === 'M') {
                timeValue += temporaryNumber * 30 * 24 * 60 * 60 * 1000; // Convert months to milliseconds
                if (c === 'M') {
                  index += 1; // Skip 'M'
                } else if (nextChars.startsWith('months')) {
                  index += 6; // Skip 'months'
                } else {
                  index += 5; // Skip 'month'
                }
              } else {
                timeValue += temporaryNumber * 60 * 1000; // Minutes
              }

              break;
            }
            case 's': {
              timeValue += temporaryNumber * 1000; // Seconds

              break;
            }
            case 'w': {
              timeValue += temporaryNumber * 7 * 24 * 60 * 60 * 1000; // Weeks

              break;
            }
            case 'y': {
              timeValue += temporaryNumber * 365 * 24 * 60 * 60 * 1000; // Years

              break;
            }
            // No default
          }
          stage = 1;
          break;
        } else {
          return timeValue; // Unsupported qualifier
        }
      }

      default: {
        break;
      }
    }
  }
  return timeValue;
}

/*
 Input validation for parseDuration. Ensures string is a written time in one or multiple of 3 formats.
 Huge thank you to /u/gumnos on Reddit for the regex!
*/
export const validateDurationInput = (input: string): boolean => {
  const regex =
    /^(?: *(?:\d+ *(?:y(?:ears?)?|M|mon(ths?)?|w(?:eeks?)?|d(?:ays?)?|h(?:ours?)?|m(?:in(?:ute)?s?)?|s(?:ec(?:ond)?s?)?)))+$/;

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
    day: 'd',
    days: 'd',
    hour: 'h',
    hours: 'h',
    minute: 'm',
    minutes: 'm',
    month: 'M',
    months: 'M',
    second: 's',
    seconds: 's',
    week: 'w',
    weeks: 'w',
    year: 'y',
    years: 'y',
  };

  // Regular expression to match the input format
  const regex = /\b(\d+)\s*(years?|months?|weeks?|days?|hours?|minutes?|seconds?)\b/gi;

  // Array to store the parsed results
  const parts: string[] = [];

  // Replace matched parts with their formatted versions
  let match;

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
