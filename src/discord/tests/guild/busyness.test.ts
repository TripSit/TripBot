import { calculateSpamminess } from '../../commands/guild/d.busyness';

// Regression test for TripSit/TripBot#1356: the spamminess component used to be 0 for every real distribution
describe('calculateSpamminess', () => {
  it('is 0 for an empty or silent channel', () => {
    expect(calculateSpamminess([])).toBe(0);
    expect(calculateSpamminess([0, 0])).toBe(0);
  });

  it('is 0 when everyone sent the same number of messages', () => {
    expect(calculateSpamminess([1])).toBe(0);
    expect(calculateSpamminess([3, 3, 3, 3])).toBe(0);
  });

  it('rises when one person sent most of the messages', () => {
    expect(calculateSpamminess([1, 9])).toBeCloseTo(0.4, 5);
    expect(calculateSpamminess([1, 1, 1, 17])).toBeCloseTo(0.6, 5);
    expect(calculateSpamminess([1, 1, 1, 17])).toBeGreaterThan(calculateSpamminess([5, 5, 5, 5]));
  });

  it('does not depend on the order users appear in', () => {
    expect(calculateSpamminess([17, 1, 1, 1])).toBeCloseTo(calculateSpamminess([1, 1, 1, 17]), 10);
    expect(calculateSpamminess([1, 17, 1, 1])).toBeCloseTo(0.6, 5);
  });

  it('stays between 0 and 1 and does not change its input', () => {
    const counts = [50, 1, 1, 1, 1, 1];
    const result = calculateSpamminess(counts);
    expect(result).toBeGreaterThan(0.5);
    expect(result).toBeLessThanOrEqual(1);
    expect(counts).toEqual([50, 1, 1, 1, 1, 1]);
  });
});
