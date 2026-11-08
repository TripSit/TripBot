import { describe, expect, it } from 'vitest';

describe('log.warn', () => {
  it('logs a warning without throwing', () => {
    expect(() => log.warn('test', 'something happened')).not.toThrow();
  });
});
