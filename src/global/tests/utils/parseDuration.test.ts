import { makeValid, parseDuration, validateDurationInput } from '../../utils/parseDuration';

const MIN = 60 * 1000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

describe('parseDuration', () => {
  it.each([
    ['30s', 30 * 1000],
    ['10m', 10 * MIN],
    ['2h', 2 * HOUR],
    ['1d', DAY],
    ['2w', 14 * DAY],
    ['1y', 365 * DAY],
    ['1M', 30 * DAY],
    ['1 month', 30 * DAY],
    ['2 months', 60 * DAY],
    ['1h 30m', 90 * MIN],
    ['1d2h', DAY + 2 * HOUR],
    ['1 month 2d', 32 * DAY],
    ['abc', 0],
    ['', 0],
    ['5x', 0],
    ['3', 0],
  ])('parses %j', async (input, expected) => {
    expect(await parseDuration(input)).toBe(expected);
  });
});

describe('validateDurationInput', () => {
  it.each(['1h 30m', '5 minutes', '2 weeks', '1y', ' 3 days ', '10 seconds'])('accepts %j', input => {
    expect(validateDurationInput(input)).toBe(true);
  });
  it.each(['abc', '', '5', 'h5', '1 fortnight'])('rejects %j', input => {
    expect(validateDurationInput(input)).toBe(false);
  });
});

describe('makeValid', () => {
  it('normalizes long-form units', async () => {
    expect(await makeValid('1 year 2 Months and 3 days')).toBe('1y 2M 3d');
    expect(await makeValid('4 hours 5 minutes 6 seconds 1 week')).toBe('4h 5m 6s 1w');
  });
  it('returns an empty string when nothing matches', async () => {
    expect(await makeValid('nothing here')).toBe('');
  });
});
