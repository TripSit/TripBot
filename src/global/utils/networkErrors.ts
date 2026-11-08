const MAX_DEPTH = 5;

/** Error codes that mean the request never reached Discord, so retrying it cannot duplicate an action. */
export const PRE_SEND_ERROR_CODES = new Set([
  'UND_ERR_CONNECT_TIMEOUT',
  'ENOTFOUND',
  'EAI_AGAIN',
  'ECONNREFUSED',
  'ENETUNREACH',
  'EHOSTUNREACH',
]);

type ErrorLike = { code?: unknown, message?: unknown, cause?: unknown, errors?: unknown, address?: unknown };

function children(err: ErrorLike): unknown[] {
  const out: unknown[] = [];
  if (err.cause) out.push(err.cause);
  if (Array.isArray(err.errors)) out.push(...err.errors);
  return out;
}

/** Finds the first network error code in an error, its cause chain, or an AggregateError's members. */
export function findErrorCode(err: unknown, depth = 0): string | undefined {
  if (!err || typeof err !== 'object' || depth > MAX_DEPTH) return undefined;
  const e = err as ErrorLike;
  if (typeof e.code === 'string' && PRE_SEND_ERROR_CODES.has(e.code)) return e.code;
  return children(e).map(c => findErrorCode(c, depth + 1)).find(Boolean);
}

/** True when the error shows the connection was never established (timeout, DNS failure, refused). */
export function isPreSendFailure(err: unknown): boolean {
  return findErrorCode(err) !== undefined;
}

/** One line describing an error and its causes, including codes and addresses, for logs. */
export function describeError(err: unknown, depth = 0): string {
  if (!err || typeof err !== 'object') return String(err);
  const e = err as ErrorLike;
  const code = typeof e.code === 'string' ? ` [${e.code}]` : '';
  const address = typeof e.address === 'string' ? ` (${e.address})` : '';
  const head = `${typeof e.message === 'string' ? e.message : String(err)}${code}${address}`;
  if (depth >= MAX_DEPTH) return head;
  const inner = children(e).map(c => describeError(c, depth + 1));
  return inner.length ? `${head} <- ${inner.join('; ')}` : head;
}

/** Strips secrets and ids' query strings from a Discord API URL so it can be logged. */
export function redactDiscordUrl(url: string): string {
  let path: string;
  try {
    path = new URL(url).pathname;
  } catch {
    [path] = url.split('?');
  }
  return path
    .replace(/\/api\/v\d+/, '')
    .replace(/(\/(?:webhooks|interactions)\/\d+\/)[^/]+/, '$1<token>');
}
