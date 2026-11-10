import { parseDuration } from '../../utils/parseDuration';

const DAY = 24 * 60 * 60 * 1000;

describe('parseDuration months', () => {
  it.each([['2 months', 60 * DAY], ['2 month', 60 * DAY], ['3M', 90 * DAY], ['1 month 2 days', 32 * DAY], ['2months 1h', 60 * DAY + 3600000]])(
    '%s',
    async (input, expected) => {
      expect(await parseDuration(input)).toBe(expected);
    },
  );

  it('treats a lone "m" as minutes and stops at unsupported qualifiers', async () => {
    expect(await parseDuration('5 m')).toBe(300000);
    expect(await parseDuration('5 q')).toBe(0);
    expect(await parseDuration('1h 5 q 2d')).toBe(3600000);
  });
});
