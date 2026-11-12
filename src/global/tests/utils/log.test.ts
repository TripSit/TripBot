import { log } from '../../utils/log';

describe('log.warn', () => {
  it('does not throw, including for "Missing" configuration warnings', () => {
    expect(() => log.warn('test', 'something happened')).not.toThrow();
    expect(() => log.warn('test', 'Missing GITHUB_TOKEN')).not.toThrow();
  });
});
