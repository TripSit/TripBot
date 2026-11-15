/** Like `||` for values where an empty string, 0 or false should also fall back to the default. */
export default function orDefault<T>(value: T | null | undefined, fallback: T): T {
  if (value) return value;
  return fallback;
}
