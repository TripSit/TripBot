import { log } from '../../utils/log';

const WARNING = 'something happened';
const originalRollbar = global.rollbar;

afterEach(() => {
  global.rollbar = originalRollbar;
});

describe('log.warn', () => {
  it('does not throw when rollbar is not initialized, as in development', () => {
    global.rollbar = undefined as unknown as typeof global.rollbar;
    expect(() => log.warn('test', WARNING)).not.toThrow();
  });

  it('forwards warnings to rollbar when it is initialized', () => {
    log.warn('test', WARNING);
    expect(global.rollbar.warn).toHaveBeenCalledWith(WARNING);
  });

  it('does not forward "Missing" configuration warnings to rollbar', () => {
    log.warn('test', 'Missing GITHUB_TOKEN');
    expect(global.rollbar.warn).not.toHaveBeenCalled();
  });
});
