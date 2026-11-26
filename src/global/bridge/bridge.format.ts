const DISCORD_FORBIDDEN_USERNAME = /discord|clyde/gi;
// Conservative ASCII IRC nick characters; the RELAYMSG separator is added only in the suffix.
const IRC_NICK_INVALID = /[^A-Za-z0-9[\]\\`_^{|}-]+/g;

const byteLength = (text: string) => Buffer.byteLength(text, 'utf8');

function splitLine(line: string, maxBytes: number): string[] {
  const chunks: string[] = [];
  let current = '';
  // Prefer word boundaries; fall back to splitting a single oversized word by code point
  line.split(/(?<=\s)/).forEach(word => {
    if (byteLength(current + word) <= maxBytes) {
      current += word;
      return;
    }
    if (current.trim()) chunks.push(current.trimEnd());
    current = '';
    Array.from(word).forEach(char => {
      if (byteLength(current + char) > maxBytes) {
        chunks.push(current);
        current = '';
      }
      current += char;
    });
  });
  if (current.trim()) chunks.push(current.trimEnd());
  return chunks;
}

/** Splits text into non-empty lines of at most maxBytes UTF-8 bytes, since IRC has no multi-line messages. */
export function splitMessage(text: string, maxBytes: number): string[] {
  return text
    .split(/\r?\n/)
    .flatMap(line => splitLine(line, maxBytes));
}

/** Splits text into chunks of at most maxLength characters, keeping whole lines where possible. */
export function chunkText(text: string, maxLength: number): string[] {
  const chunks: string[] = [];
  let current = '';
  text.split('\n').forEach(line => {
    const candidate = current ? `${current}\n${line}` : line;
    if (candidate.length <= maxLength) {
      current = candidate;
      return;
    }
    if (current) chunks.push(current);
    current = line;
    while (current.length > maxLength) {
      chunks.push(current.slice(0, maxLength));
      current = current.slice(maxLength);
    }
  });
  if (current) chunks.push(current);
  return chunks;
}

/** Removes Discord markdown so IRC users see plain text. */
export function stripMarkdown(text: string): string {
  const escaped: string[] = [];
  // Set escaped characters aside so they aren't treated as formatting, then restore them literally
  return text
    .replace(/\\([*_~`|>#\\])/g, (_match, char: string) => {
      escaped.push(char);
      return `\uE000${escaped.length - 1}\uE001`;
    })
    .replace(/```(?:[\w+-]*\n)?([\s\S]*?)```/g, '$1')
    .replace(/`([^`\n]+)`/g, '$1')
    .replace(/\[([^\]\n]+)\]\((https?:\/\/[^)\s]+)\)/g, '$1 ($2)')
    .replace(/\|\|([\s\S]+?)\|\|/g, '$1')
    .replace(/(\*\*|__|~~)([\s\S]+?)\1/g, '$2')
    .replace(/(^|[^\w*])\*(?!\s)([^*\n]+?)\*(?![\w*])/g, '$1$2')
    .replace(/(^|[^\w])_(?!\s)([^_\n]+?)_(?!\w)/g, '$1$2')
    .replace(/^(?:>>> |> |#{1,3} |-# )/gm, '')
    .replace(/\uE000(\d+)\uE001/g, (_match, index: string) => escaped[Number(index)]);
}

/** Removes IRC bold/italic/underline/color control codes. */
export function stripIrcFormatting(text: string): string {
  return text
    .replace(/\x03(?:\d{1,2}(?:,\d{1,2})?)?/g, '') // eslint-disable-line no-control-regex
    .replace(/\x04(?:[0-9a-f]{6}(?:,[0-9a-f]{6})?)?/gi, '') // eslint-disable-line no-control-regex
    .replace(/[\x02\x0F\x11\x16\x1D\x1E\x1F]/g, ''); // eslint-disable-line no-control-regex
}

/** Builds a RELAYMSG-safe nick like `name/d`, truncated to the server's nick length. */
export function toIrcNick(nick: string, label: string, maxBytes: number): string {
  const suffix = `/${label}`;
  const baseBytes = maxBytes - byteLength(suffix);
  if (baseBytes < 1) {
    throw new RangeError('IRC nick length must fit a base character and the relay suffix');
  }
  // NFKD turns styled letters (𝕸𝖔𝖔𝖓, ｆｕｌｌｗｉｄｔｈ) into plain ones and splits accents off so they can be dropped
  const plain = nick.normalize('NFKD').replace(/\p{M}/gu, '');
  const base = plain.replace(IRC_NICK_INVALID, '_').replace(/^[-\d]/, '_$&') || 'unknown';
  // The allowlist makes the base ASCII, so slicing characters also limits UTF-8 bytes.
  return base.slice(0, baseBytes) + suffix;
}

/** Makes a nick acceptable as a Discord webhook username (1-80 characters, no "discord"/"clyde"). */
export function toDiscordUsername(nick: string): string {
  const cleaned = nick.replace(DISCORD_FORBIDDEN_USERNAME, '').trim();
  return (cleaned || 'unknown').slice(0, 80);
}
