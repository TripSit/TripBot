import { combochart } from '../../commands/g.combochart';
import { grounding } from '../../commands/g.grounding';
import { recovery } from '../../commands/g.recovery';
import { reagents } from '../../commands/g.reagents';
import { breathe } from '../../commands/g.breathe';
import { invite } from '../../commands/g.invite';
import { magick8Ball } from '../../commands/g.magick8Ball';
import { warmline } from '../../commands/g.warmline';
import testkits from '../../commands/g.testkits';

describe('static link commands', () => {
  it.each([
    ['combochart', combochart],
    ['grounding', grounding],
    ['recovery', recovery],
    ['reagents', reagents],
  ])('%s returns a URL', async (_name, fn) => {
    expect(await fn()).toMatch(/^https:\/\//);
  });
});

describe('breathe', () => {
  it('defaults to the polygon exercise', async () => {
    expect(await breathe(null)).toContain('tenor.com');
  });

  it.each(['2', '3', '4'])('returns a distinct gif for choice %s', async choice => {
    const result = await breathe(choice);
    expect(result).toContain('imgur.com');
    expect(result).not.toBe(await breathe(null));
  });
});

describe('invite', () => {
  const original = process.env.NODE_ENV;
  afterEach(() => {
    process.env.NODE_ENV = original;
  });

  it('returns production links', async () => {
    process.env.NODE_ENV = 'production';
    expect((await invite()).discord).toBe('https://discord.gg/TripSit');
  });

  it('returns development links otherwise', async () => {
    process.env.NODE_ENV = 'development';
    expect((await invite()).discord).not.toBe('https://discord.gg/TripSit');
  });
});

describe('magick8Ball', () => {
  it('returns an answer chosen by Math.random', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    expect(await magick8Ball()).toBe('It is certain');
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    expect(await magick8Ball()).toBe('Very doubtful');
    vi.restoreAllMocks();
  });
});

describe('warmline and testkits', () => {
  it('lists warmline resources', async () => {
    const resources = await warmline();
    expect(resources.length).toBeGreaterThan(0);
    expect(resources.every(r => r.website.startsWith('http'))).toBe(true);
  });

  it('lists test kit vendors', async () => {
    const kits = await testkits();
    expect(kits.map(k => k.name)).toContain('DanceSafe');
  });
});
