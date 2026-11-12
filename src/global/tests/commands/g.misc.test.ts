import axios from 'axios';
import { coinflip } from '../../commands/g.coinflip';
import naloxoneSources from '../../commands/g.narcan';
import { rssCreate, rssDelete, rssList } from '../../commands/g.rss';
import { getBountyStats } from '../../commands/g.bountyleaderboard';
import { wikipedia } from '../../commands/g.wikipedia';
import { urbanDefine } from '../../commands/g.urbanDefine';
import { imgurSearch } from '../../commands/g.imgur';
import { dbMock } from '../../../vitest/utils/mockDb';

const asMock = (fn: unknown) => fn as ReturnType<typeof vi.fn>;

vi.mock('axios');
const get = vi.mocked(axios.get);

describe('coinflip', () => {
  const cases: [number, RegExp][] = [
    [0.0, /subspace/],
    [0.01, /its side/],
    [0.02, /rolled off/],
    [0.03, /dice/],
    [0.04, /spinning/],
    [0.1, /^Heads!$/],
    [0.6, /^Tails!$/],
    [0.96, /Some kid/],
    [0.97, /came and took your coin/],
    [0.98, /both heads and tails/],
    [0.99, /The coin says/],
  ];
  it.each(cases)('roll %s', async (value, pattern) => {
    vi.spyOn(Math, 'random').mockReturnValue(value);
    expect(await coinflip()).toMatch(pattern);
    vi.restoreAllMocks();
  });
});

describe('naloxoneSources', () => {
  it('lists resources', async () => {
    const list = await naloxoneSources();
    expect(list.length).toBeGreaterThan(3);
    expect(list.every(r => r.name)).toBe(true);
  });
});

describe('rss', () => {
  it('creates a subscription', async () => {
    await rssCreate('c', 'g', 'http://feed');
    expect(dbMock.rss.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { guild_id_destination: { guild_id: 'g', destination: 'c' } },
    }));
  });
  it('lists subscriptions for a guild', async () => {
    await rssList('g');
    expect(dbMock.rss.findMany).toHaveBeenCalledWith({ where: { guild_id: 'g' } });
  });
  it('deletes a subscription', async () => {
    await rssDelete('c', 'g');
    expect(dbMock.rss.delete).toHaveBeenCalledWith({
      where: { guild_id_destination: { guild_id: 'g', destination: 'c' } },
    });
  });
});

describe('getBountyStats', () => {
  type Rows = Awaited<ReturnType<typeof dbMock.claimed_bounties.findMany>>;
  type Groups = Awaited<ReturnType<typeof dbMock.claimed_bounties.groupBy>>;

  it('returns [] when nothing has been claimed', async () => {
    dbMock.claimed_bounties.findMany.mockResolvedValueOnce([]);
    expect(await getBountyStats()).toEqual([]);
  });

  it('uses groupBy results and drops zero counts', async () => {
    dbMock.claimed_bounties.findMany.mockResolvedValueOnce([{ user_id: 'a', amount: 1 }] as unknown as Rows);
    asMock(dbMock.claimed_bounties.groupBy).mockResolvedValueOnce([
      { user_id: 'a', _count: { id: 2 }, _sum: { amount: 30 } },
      { user_id: 'b', _count: { id: 0 }, _sum: { amount: null } },
    ] as unknown as Groups);
    expect(await getBountyStats()).toEqual([{
      userId: 'a', username: '<@a>', totalBounties: 2, totalXP: 30,
    }]);
  });

  it('aggregates manually when groupBy is empty', async () => {
    dbMock.claimed_bounties.findMany.mockResolvedValueOnce([
      { user_id: 'a', amount: 5 }, { user_id: 'a', amount: null }, { user_id: 'b', amount: 2 },
    ] as unknown as Rows);
    asMock(dbMock.claimed_bounties.groupBy).mockResolvedValueOnce([] as unknown as Groups);
    expect(await getBountyStats()).toEqual([
      {
        userId: 'a', username: '<@a>', totalBounties: 2, totalXP: 5,
      },
      {
        userId: 'b', username: '<@b>', totalBounties: 1, totalXP: 2,
      },
    ]);
  });

  it('returns [] on database errors', async () => {
    dbMock.claimed_bounties.findMany.mockRejectedValueOnce(new Error('db down'));
    expect(await getBountyStats()).toEqual([]);
  });
});

describe('wikipedia', () => {
  const empty = {
    title: '', thumbnail: '', url: '', description: '',
  };

  it('converts html extracts to markdown', async () => {
    get.mockResolvedValueOnce({ data: ['q', ['Page']] });
    get.mockResolvedValueOnce({
      data: {
        title: 'Page',
        extract: 'x',
        extract_html: '<p><b>Bold</b> and <i>it</i> <a href="http://u">link</a></p>',
        thumbnail: { source: 'thumb' },
        content_urls: { desktop: { page: 'http://page' } },
      },
    });
    expect(await wikipedia('page')).toEqual({
      title: 'Page', thumbnail: 'thumb', url: 'http://page', description: '**Bold** and *it* [link](http://u)',
    });
  });

  it('returns empty data when no extract exists', async () => {
    get.mockResolvedValueOnce({ data: ['q', ['Page']] });
    get.mockResolvedValueOnce({ data: {} });
    expect(await wikipedia('page')).toEqual(empty);
  });

  it('asks for a more specific query on disambiguation', async () => {
    get.mockResolvedValueOnce({ data: ['q', ['Page']] });
    get.mockResolvedValueOnce({ data: { extract: 'x', type: 'disambiguation' } });
    expect((await wikipedia('page')).title).toMatch(/more specific/);
  });

  it('returns empty data on request errors', async () => {
    get.mockRejectedValueOnce(new Error('network'));
    expect(await wikipedia('page')).toEqual(empty);
  });
});

describe('urbanDefine', () => {
  it('handles terms without definitions', async () => {
    get.mockResolvedValueOnce({ data: { list: [] } });
    expect(await urbanDefine('zzz')).toMatch(/No definition found/);
    get.mockResolvedValueOnce({ data: {} });
    expect(await urbanDefine('zzz')).toMatch(/No definition found/);
  });

  it('picks the most upvoted definition and strips brackets', async () => {
    get.mockResolvedValueOnce({
      data: {
        list: [
          {
            definition: 'low', example: 'e', thumbs_up: 1, thumbs_down: 0,
          },
          {
            definition: '[top] def', example: '[ex]', thumbs_up: 9, thumbs_down: 2,
          },
        ],
      },
    });
    const result = await urbanDefine('term');
    expect(result).toContain('(+9/-2)');
    expect(result).toContain('top def');
    expect(result).toContain('Example: ex');
  });

  it('truncates very long definitions', async () => {
    get.mockResolvedValueOnce({
      data: {
        list: [{
          definition: 'a'.repeat(2000), example: 'e', thumbs_up: 1, thumbs_down: 0,
        }],
      },
    });
    expect(await urbanDefine('term')).toContain(`${'a'.repeat(1020)}...`);
  });
});

describe('imgurSearch', () => {
  it('reports no results', async () => {
    get.mockResolvedValueOnce({ data: { data: [] } });
    expect(await imgurSearch('http://q')).toBe('No results found for http://q!');
  });

  it.each([
    ['album gifv', { is_album: true, images: [{ gifv: 'g', link: 'l' }] }, 'g'],
    ['album link', { is_album: true, images: [{ link: 'l' }] }, 'l'],
    ['single gifv', { gifv: 'g', link: 'l' }, 'g'],
    ['single link', { link: 'l' }, 'l'],
    ['nothing usable', {}, ''],
  ])('%s', async (_name, item, expected) => {
    get.mockResolvedValueOnce({ data: { data: [item] } });
    expect(await imgurSearch('http://q')).toBe(expected);
  });

  it('rejects when the request fails', async () => {
    get.mockRejectedValueOnce(new Error('nope'));
    await expect(imgurSearch('http://q')).rejects.toThrow('nope');
  });
});
