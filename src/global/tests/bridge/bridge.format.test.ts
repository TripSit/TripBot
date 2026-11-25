import {
  chunkText, splitMessage, stripIrcFormatting, stripMarkdown, toDiscordUsername, toIrcNick,
} from '../../bridge/bridge.format';

describe('splitMessage', () => {
  it('turns each line into its own message and drops blank lines', () => {
    expect(splitMessage('one\n\ntwo\r\nthree', 400)).toEqual(['one', 'two', 'three']);
  });

  it('splits long lines on word boundaries within the byte limit', () => {
    const lines = splitMessage('aaaa bbbb cccc dddd', 10);
    expect(lines).toEqual(['aaaa bbbb', 'cccc dddd']);
  });

  it('hard-splits a single word that is longer than the limit', () => {
    expect(splitMessage('abcdefghij', 4)).toEqual(['abcd', 'efgh', 'ij']);
  });

  it('counts multi-byte characters by their UTF-8 size', () => {
    const lines = splitMessage('ééééé', 4);
    expect(lines).toEqual(['éé', 'éé', 'é']);
    lines.forEach(line => expect(Buffer.byteLength(line)).toBeLessThanOrEqual(4));
  });

  it('never splits a character in half', () => {
    expect(splitMessage('👍👍', 5)).toEqual(['👍', '👍']);
  });
});

describe('chunkText', () => {
  it('keeps short text as one chunk', () => {
    expect(chunkText('hello\nworld', 2000)).toEqual(['hello\nworld']);
  });

  it('breaks between lines before exceeding the limit', () => {
    expect(chunkText('aaaa\nbbbb\ncccc', 9)).toEqual(['aaaa\nbbbb', 'cccc']);
  });

  it('hard-splits a single line that is too long', () => {
    expect(chunkText('abcdefghij', 4)).toEqual(['abcd', 'efgh', 'ij']);
  });
});

describe('stripMarkdown', () => {
  it.each([
    ['**bold** and __underline__', 'bold and underline'],
    ['*italic* and _italic_', 'italic and italic'],
    ['~~gone~~', 'gone'],
    ['||spoiler||', 'spoiler'],
    ['`code`', 'code'],
    ['```js\nconst a = 1;\n```', 'const a = 1;\n'],
    ['[TripSit](https://tripsit.me)', 'TripSit (https://tripsit.me)'],
    ['> quoted', 'quoted'],
    ['# Heading', 'Heading'],
    ['\\*not italic\\*', '*not italic*'],
  ])('strips %j', (input, expected) => {
    expect(stripMarkdown(input)).toBe(expected);
  });

  it('leaves snake_case, URLs, and arithmetic alone', () => {
    const text = 'my_var_name https://example.com/a_b_c 2 * 3 * 4';
    expect(stripMarkdown(text)).toBe(text);
  });
});

describe('stripIrcFormatting', () => {
  it('removes bold, italics, underline, reset, and colors', () => {
    const formatted = '\x02bold\x02 \x1Ditalic\x1D \x0304,01red\x03 \x0F\x1Funder\x1F';
    expect(stripIrcFormatting(formatted)).toBe('bold italic red under');
  });

  it('removes hex colors', () => {
    expect(stripIrcFormatting('\x04ff0000red\x04')).toBe('red');
  });
});

describe('toIrcNick', () => {
  it('appends the platform label', () => {
    expect(toIrcNick('Moonbear', 'd', 32)).toBe('Moonbear/d');
  });

  it('replaces characters IRC nicks cannot contain', () => {
    expect(toIrcNick('Moon Bear!@#/x', 'd', 32)).toBe('Moon_Bear_x/d');
  });

  it.each([
    ['Moon🌙Bear', 'Moon_Bear/d'],
    ['🌙✨', '_/d'],
    ['José', 'Jos_/d'],
    ['東京', '_/d'],
    ['e\u0301', 'e_/d'],
    ['<Moon>"Bear\';', '_Moon_Bear_/d'],
    ['~+%&user', '_user/d'],
    ['a\u0000\r\n\tb', 'a_b/d'],
  ])('sanitizes %j to an ASCII relay nick', (input, expected) => {
    expect(toIrcNick(input, 'd', 32)).toBe(expected);
  });

  it('preserves conventional IRC nickname characters', () => {
    const nick = '[Moon]\\`_^{Bear|}-9';
    expect(toIrcNick(nick, 'd', 32)).toBe(`${nick}/d`);
  });

  it('does not start with a digit or dash', () => {
    expect(toIrcNick('1user', 'd', 32)).toBe('_1user/d');
    expect(toIrcNick('-user', 'd', 32)).toBe('_-user/d');
  });

  it('truncates to the nick length including the label', () => {
    const nick = toIrcNick('a'.repeat(40), 'd', 32);
    expect(nick).toBe(`${'a'.repeat(30)}/d`);
  });

  it.each(['d', 'M', 'i'])('keeps /%s and counts the complete nickname in UTF-8 bytes', label => {
    const nick = toIrcNick('🌙éMoon'.repeat(1000), label, 8);
    expect(nick).toBe(`_Moon_/${label}`);
    expect(Buffer.byteLength(nick, 'utf8')).toBe(8);
  });

  it('fits a single base character with the suffix', () => {
    expect(toIrcNick('123', 'd', 3)).toBe('_/d');
    expect(toIrcNick('', 'M', 3)).toBe('u/M');
  });

  it('rejects a byte limit that cannot fit a relay nickname', () => {
    expect(() => toIrcNick('user', 'd', 2)).toThrow(RangeError);
  });

  it('falls back when nothing usable is left', () => {
    expect(toIrcNick('   ', 'M', 32)).toBe('_/M');
    expect(toIrcNick('', 'M', 32)).toBe('unknown/M');
  });
});

describe('toDiscordUsername', () => {
  it('removes words Discord rejects in webhook usernames', () => {
    expect(toDiscordUsername('DiscordFan clyde')).toBe('Fan');
  });

  it('falls back when the name is empty after cleaning', () => {
    expect(toDiscordUsername('discord')).toBe('unknown');
  });

  it('limits usernames to 80 characters', () => {
    expect(toDiscordUsername('x'.repeat(100))).toHaveLength(80);
  });
});
