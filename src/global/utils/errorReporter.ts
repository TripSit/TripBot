/**
 * Decides whether an error may be posted to Discord. When Discord is unreachable every report fails and produces
 * more errors, so reports are capped globally and identical ones are suppressed for a while.
 */
export class ReportLimiter {
  private sent: number[] = [];

  private lastByKey = new Map<string, number>();

  constructor(
    private readonly maxPerWindow = 5,
    private readonly windowMs = 60_000,
    private readonly duplicateMs = 300_000,
  ) {}

  allow(message: string, now = Date.now()): boolean {
    const key = message.split('\n')[0].slice(0, 200);
    this.sent = this.sent.filter(t => now - t < this.windowMs);
    Array.from(this.lastByKey.entries()).forEach(([k, t]) => {
      if (now - t >= this.duplicateMs) this.lastByKey.delete(k);
    });
    if (this.sent.length >= this.maxPerWindow) return false;
    if (this.lastByKey.has(key)) return false;
    this.sent.push(now);
    this.lastByKey.set(key, now);
    return true;
  }
}

/** Resolves with the promise's result, or rejects after ms so a hung Discord call cannot stall the reporter. */
export function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}
