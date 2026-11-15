export default parseDuration;

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

// Milliseconds per single-letter qualifier (months are handled separately because of the "month" spelling)
const QUALIFIER_MS: Record<string, number> = {
  h: HOUR,
  s: SECOND,
  d: DAY,
  w: 7 * DAY,
  y: 365 * DAY,
};

/**
 * Converts a number followed by the qualifier at `duration[idx]` into milliseconds.
 * `skip` is how many extra characters the qualifier consumed (the "onth" of "month").
 */
function qualifierValue(duration: string, idx: number, count: number): { ms: number; skip: number } {
  const c = duration[idx];
  if (c === 'M' || c === 'm') {
    // Check if the next characters spell "month" or "months"
    const spellsMonth = duration.slice(idx, idx + 5).toLowerCase().startsWith('month');
    if (spellsMonth || c === 'M') {
      // 'month' is 5 characters; a trailing 's' is ignored by stage 1 (it waits for a number)
      return { ms: count * 30 * DAY, skip: c === 'M' ? 1 : 5 };
    }
    return { ms: count * MINUTE, skip: 0 };
  }
  return { ms: count * (QUALIFIER_MS[c] ?? 0), skip: 0 };
}

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
    const c = duration[idx];
    if (stage === 1) { // Waiting for number
      if (numbers.includes(c)) {
        tempString = c;
        stage = 2;
      }
      idx += 1;
    } else if (stage === 2) { // Parsing the number
      if (numbers.includes(c)) {
        tempString += c;
        idx += 1;
      } else {
        tempNumber = Number.parseInt(tempString, 10);
        stage = 3;
      }
    } else if (c === ' ') { // Parsing the qualifier
      idx += 1;
    } else if (supported.includes(c)) {
      const { ms, skip } = qualifierValue(duration, idx, tempNumber);
      timeValue += ms;
      idx += skip;
      stage = 1;
    } else {
      return timeValue; // Unsupported qualifier
    }
  }
  return timeValue;
}

/*
 Input validation for parseDuration. Ensures string is a written time in one or multiple of 3 formats.
 Huge thank you to /u/gumnos on Reddit for the regex!
*/
export const validateDurationInput = (input: string): boolean => {
  const units = 'y(?:ears?)?|M|mon(?:ths?)?|w(?:eeks?)?|d(?:ays?)?|h(?:ours?)?|m(?:in(?:ute)?s?)?|s(?:ec(?:ond)?s?)?';
  const regex = new RegExp(`^(?: *(?:\\d+ *(?:${units})))+$`);

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
  const regex = new RegExp(`\\b(\\d+)\\s*(${Object.keys(unitMap).join('|')})\\b`, 'gi');

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
