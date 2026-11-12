import { EventEmitter } from 'node:events';
import fs from 'fs';
import axios from 'axios';
import Canvas from '@napi-rs/canvas';
import { deFuckifyText, generateColors, resizeText } from '../../utils/canvasUtils';
import getAsset, { downloadAsset } from '../../utils/getAsset';

vi.mock('fs');
vi.mock('axios');
vi.mock('@napi-rs/canvas', () => ({ default: { GlobalFonts: { registerFromPath: vi.fn() } } }));

describe('deFuckifyText', () => {
  it('leaves plain ASCII alone', () => {
    expect(deFuckifyText('Hello, World 123!')).toBe('Hello, World 123!');
  });

  it('maps fancy alphabets back to plain letters', () => {
    expect(deFuckifyText('𝓗𝓮𝓵𝓵𝓸')).toBe('Hello');
    expect(deFuckifyText('ＨＥＬＬＯ')).toBe('HELLO');
    expect(deFuckifyText('ⓗⓔⓛⓛⓞ')).toBe('hello');
    expect(deFuckifyText('𝐀𝐛')).toBe('Ab');
  });

  it('drops characters it cannot translate', () => {
    expect(deFuckifyText('a🙂b☃c')).toBe('abc');
  });
});

describe('generateColors', () => {
  it('returns the same colour with zero modifiers (3 and 6 digit hex)', () => {
    expect(generateColors('#ff0000', 0, 0, 0)).toBe('#ff0000');
    expect(generateColors('#0f0', 0, 0, 0)).toBe('#00ff00');
    expect(generateColors('#0000ff', 0, 0, 0)).toBe('#0000ff');
    expect(generateColors('#808080', 0, 0, 0)).toBe('#808080');
  });

  it('rotates hue and scales saturation and lightness', () => {
    expect(generateColors('#ff0000', 120, 0, 0)).toBe('#00ff00');
    expect(generateColors('#ff0000', 0, -100, 0)).toBe('#808080');
    expect(generateColors('#ff0000', 0, 0, -100)).toBe('#000000');
    expect(generateColors('#ff0000', 360, 0, 0)).toBe('#ff0000');
  });

  it('handles every dominant channel when computing hue', () => {
    expect(generateColors('#ff0080', 0, 0, 0)).toMatch(/^#[0-9a-f]{6}$/);
    expect(generateColors('#00ff80', 0, 0, 0)).toMatch(/^#[0-9a-f]{6}$/);
    expect(generateColors('#8000ff', 0, 0, 0)).toMatch(/^#[0-9a-f]{6}$/);
    expect(generateColors('#ffffff', 0, 0, 0)).toBe('#ffffff');
    expect(generateColors('nonsense', 0, 0, 0)).toBe('#000000');
  });
});

describe('resizeText', () => {
  it('shrinks the font until the text fits', () => {
    const context = {
      font: '',
      measureText: vi.fn(() => ({ width: Number.parseInt(context.font, 10) * 10 })),
    };
    const canvas = { getContext: () => context } as unknown as Canvas.Canvas;
    expect(resizeText(canvas, 'hi', 50, 'Acme', 300)).toBe('30px Acme');
  });
});

describe('getAsset', () => {
  const fsMock = vi.mocked(fs);

  beforeEach(() => {
    fsMock.mkdirSync.mockReturnValue(undefined);
  });

  it('rejects unknown assets', async () => {
    await expect(getAsset('nope')).rejects.toThrow('Asset not found: nope');
  });

  it('returns existing files without downloading', async () => {
    fsMock.existsSync.mockReturnValue(true);
    expect(await getAsset('rules')).toMatch(/RULES\.png$/);
    expect(axios).not.toHaveBeenCalled();
  });

  function stubDownload(emitError = false) {
    const writer = new EventEmitter();
    const pipe = vi.fn(() => {
      setImmediate(() => (emitError ? writer.emit('error', new Error('disk full')) : writer.emit('close')));
      return writer;
    });
    vi.mocked(axios).mockResolvedValue({ data: { pipe } } as never);
    fsMock.createWriteStream.mockReturnValue(writer as never);
  }

  it('downloads missing images, creating directories as needed', async () => {
    fsMock.existsSync.mockReturnValue(false);
    stubDownload();
    expect(await getAsset('rules')).toMatch(/RULES\.png$/);
    expect(fsMock.mkdirSync).toHaveBeenCalledWith(expect.any(String), { recursive: true });
    expect(Canvas.GlobalFonts.registerFromPath).not.toHaveBeenCalled();
  });

  it('registers downloaded fonts with canvas', async () => {
    fsMock.existsSync.mockReturnValue(false);
    stubDownload();
    await getAsset('Acme');
    expect(Canvas.GlobalFonts.registerFromPath).toHaveBeenCalledWith(expect.stringMatching(/Acme\.woff2$/), 'Acme');
  });

  it('skips mkdir when the directory exists and rejects on write errors', async () => {
    fsMock.existsSync.mockReturnValue(true);
    stubDownload(true);
    await expect(downloadAsset('http://x', '/tmp/dir/file.png')).rejects.toThrow('disk full');
    expect(fsMock.mkdirSync).not.toHaveBeenCalled();
  });
});
