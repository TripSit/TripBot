import { ReportLimiter, withTimeout } from '../../utils/errorReporter';

describe('ReportLimiter', () => {
  it('suppresses an identical error until the duplicate window passes', () => {
    const limiter = new ReportLimiter(5, 60_000, 300_000);
    expect(limiter.allow('boom\nstack a', 0)).toBe(true);
    expect(limiter.allow('boom\nstack b', 1_000)).toBe(false);
    expect(limiter.allow('boom', 300_001)).toBe(true);
  });

  it('caps reports per window and recovers afterwards', () => {
    const limiter = new ReportLimiter(2, 60_000, 300_000);
    expect(limiter.allow('a', 0)).toBe(true);
    expect(limiter.allow('b', 1)).toBe(true);
    expect(limiter.allow('c', 2)).toBe(false);
    expect(limiter.allow('c', 60_010)).toBe(true);
  });
});

describe('withTimeout', () => {
  afterEach(() => vi.useRealTimers());

  it('rejects when the promise hangs', async () => {
    vi.useFakeTimers();
    const result = withTimeout(new Promise(() => {}), 1000, 'Hung call');
    const assertion = expect(result).rejects.toThrow('Hung call timed out after 1000ms');
    await vi.advanceTimersByTimeAsync(1000);
    await assertion;
  });

  it('passes the result through', async () => {
    await expect(withTimeout(Promise.resolve(7), 1000, 'ok')).resolves.toBe(7);
  });
});
