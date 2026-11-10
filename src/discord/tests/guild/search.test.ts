/* eslint-disable max-len, sonarjs/no-duplicate-string */
import { dSearch } from '../../commands/guild/d.search';
import { lastReply, slashStub } from '../../../vitest/utils/commandStubs';

type Reply = { ok?: boolean; json?: unknown; throws?: boolean };
let routes: Array<[string, Reply]> = [];
const fetchMock = vi.fn(async (url: string) => {
  const hit = routes.find(([key]) => String(url).includes(key));
  if (!hit) throw new Error(`unrouted ${url}`);
  const [, reply] = hit;
  if (reply.throws) throw new Error('network');
  return { ok: reply.ok ?? true, json: async () => reply.json };
});

type Embed = { data: { title: string; description?: string; url?: string; fields?: Array<{ name: string; value: string }>; thumbnail?: { url: string } } };
const run = async (subcommand: string, options: Record<string, unknown>, rts: Array<[string, Reply]>) => {
  routes = rts;
  const stub = slashStub({ subcommand, options });
  const result = await dSearch.execute(stub as never);
  const embed = (lastReply(stub).embeds as Embed[] | undefined)?.[0].data;
  return { stub, result, embed: embed as Embed['data'] };
};

describe('search', () => {
  beforeEach(() => {
    fetchMock.mockClear();
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => { vi.unstubAllGlobals(); });

  it('rejects unknown subcommands', async () => {
    const stub = slashStub({ subcommand: 'zzz' });
    expect(await dSearch.execute(stub as never)).toBe(false);
    expect(stub.reply).toHaveBeenCalledWith('Unknown subcommand.');
  });

  describe('define', () => {
    const entry = { meanings: [{ partOfSpeech: 'noun', definitions: [{ definition: 'a thing', example: 'see thing' }] }] };
    const urban = {
      list: [{
        word: 'w', permalink: 'https://ud/w', definition: '[a] def', example: '[b] ex', thumbs_up: 1, thumbs_down: 2,
      }],
    };

    it('uses the dictionary when available', async () => {
      const { embed } = await run('define', { word: 'w' }, [['dictionaryapi', { json: [entry] }]]);
      expect(embed.description).toContain('*(noun)* a thing');
      expect(embed.description).toContain('Example: see thing');
      const bare = await run('define', { word: 'w' }, [['dictionaryapi', { json: [{ meanings: [{ definitions: [{ definition: 'x' }] }] }] }]]);
      expect(bare.embed.description).toBe('x');
    });

    it('falls back to Urban Dictionary, then reports failures', async () => {
      const viaUrban = await run('define', { word: 'w', ephemeral: true }, [['dictionaryapi', { ok: false }], ['urbandictionary', { json: urban }]]);
      expect(viaUrban.embed.title).toBe('Urban Dictionary: w');
      expect(viaUrban.embed.description).toContain('a def');
      expect((await run('define', { word: 'w' }, [['dictionaryapi', { json: [] }], ['urbandictionary', { json: { list: [] } }]])).embed.description).toContain('No results found');
      expect((await run('define', { word: 'w' }, [['dictionaryapi', { throws: true }], ['urbandictionary', { ok: false }]])).embed.description).toContain('currently unavailable');
      expect((await run('define', { word: 'w' }, [['dictionaryapi', { ok: false }], ['urbandictionary', { throws: true }]])).embed.description).toContain('error occurred');
    });
  });

  describe('urbandefine', () => {
    const entry = { meanings: [{ partOfSpeech: 'noun', definitions: [{ definition: 'a thing', example: 'ex' }] }] };
    const urban = {
      list: [{
        word: 'w', permalink: 'https://ud/w', definition: '[a] def', example: '[b] ex', thumbs_up: 1, thumbs_down: 2,
      }],
    };

    it('returns urban results with brackets stripped', async () => {
      const { embed } = await run('urbandefine', { define: 'w' }, [['urbandictionary', { json: urban }]]);
      expect(embed.description).toContain('a def');
      expect(embed.description).not.toContain('[a]');
      expect(embed.url).toBe('https://ud/w');
    });

    it('falls back to the dictionary when nothing is found', async () => {
      expect((await run('urbandefine', { define: 'w' }, [['urbandictionary', { json: { list: [] } }], ['dictionaryapi', { json: [entry] }]])).embed.description).toContain('standard dictionary result');
      expect((await run('urbandefine', { define: 'w' }, [['urbandictionary', { json: {} }], ['dictionaryapi', { ok: false }]])).embed.description).toContain('No dictionary definition');
      expect((await run('urbandefine', { define: 'w' }, [['urbandictionary', { json: {} }], ['dictionaryapi', { json: [] }]])).embed.description).toContain('No dictionary definition');
      expect((await run('urbandefine', { define: 'w' }, [['urbandictionary', { json: {} }], ['dictionaryapi', { throws: true }]])).embed.description).toContain('Dictionary API is currently unavailable');
      expect((await run('urbandefine', { define: 'w' }, [['urbandictionary', { ok: false }]])).embed.description).toContain('currently unavailable');
      expect((await run('urbandefine', {}, [['urbandictionary', { throws: true }]])).embed.description).toContain('error occurred');
    });
  });

  describe('game', () => {
    const item = {
      id: 7, name: 'Game', tiny_image: 'https://tiny', tags: ['a', 'b'], release_date: 'Soon', header_image: 'https://hdr',
    };
    const price = (final: string, discount = 0) => ({ price_overview: { final_formatted: final, discount_percent: discount } });
    const details = (extra = {}) => ({
      7: {
        data: {
          genres: [{ id: 1, description: 'RPG' }], short_description: 'fun', developers: ['Dev'], publishers: ['Pub'], platforms: { windows: true, mac: false }, release_date: { date: '1 Jan', coming_soon: false, steam_release_date: 1700000000 }, header_image: 'h', ...price('$9.99', 20), ...extra,
        },
      },
    });

    it('handles no results', async () => {
      expect((await run('game', { game: 'x' }, [['storesearch', { ok: false }]])).embed.description).toContain('No Steam results');
      expect((await run('game', { game: 'x' }, [['storesearch', { json: { items: [] } }]])).embed.description).toContain('No Steam results');
    });

    it('builds the store card with multi-currency prices', async () => {
      const { embed } = await run('game', { game: 'x' }, [['storesearch', { json: { items: [item] } }], ['cc=us', { json: details() }], ['cc=de', { json: details(price('9,99€')) }], ['cc=gb', { throws: true }]]);
      const fields = Object.fromEntries((embed.fields ?? []).map(f => [f.name, f.value]));
      expect(fields['Price (20% off)']).toBe('$9.99, €9,99, £N/A');
      expect(fields.Tags).toBe('RPG');
      expect(fields.Release).toBe('<t:1700000000:D>');
      expect(fields.Platforms).toContain('Windows');
      expect(embed.thumbnail?.url).toBe('https://tiny');
    });

    it('falls back to search result data when details are missing', async () => {
      const { embed } = await run('game', { game: 'x' }, [['storesearch', { json: { items: [item] } }], ['appdetails', { json: {} }]]);
      const fields = Object.fromEntries((embed.fields ?? []).map(f => [f.name, f.value]));
      expect(fields.Tags).toBe('a, b');
      expect(fields.Release).toBe('Soon');
      expect(fields.Developer).toBe('Unknown');
      const bare = await run('game', { game: 'x' }, [['storesearch', { json: { items: [{ id: 7, name: 'G' }] } }], ['appdetails', { json: { 7: { data: { release_date: { date: 'Later', coming_soon: true } } } } }]]);
      expect((bare.embed.fields ?? []).find(f => f.name === 'Tags')?.value).toBe('N/A');
      expect((bare.embed.fields ?? []).find(f => f.name === 'Release')?.value).toBe('Later');
    });
  });

  describe('book', () => {
    const volume = {
      volumeInfo: {
        title: 'Title', authors: ['A', 'B'], publisher: 'P', publishedDate: '2000', description: 'desc', infoLink: 'https://gb/1', imageLinks: { thumbnail: 'https://thumb' },
      },
    };

    it('builds a book card', async () => {
      const { embed } = await run('book', { book: 'q' }, [['googleapis', { json: { items: [volume] } }]]);
      expect(embed.title).toBe('Book: Title');
      expect((embed.fields ?? []).find(f => f.name === 'Author')?.value).toBe('A, B');
      expect((embed.fields ?? []).find(f => f.name === 'Platforms')?.value).toContain('Kobo');
      const sparse = await run('book', { book: 'q' }, [['googleapis', { json: { items: [{ volumeInfo: {} }] } }]]);
      expect(sparse.embed.title).toBe('Book: q');
      expect(sparse.embed.description).toBe('No description available.');
    });

    it('reports failures', async () => {
      expect((await run('book', { book: 'q' }, [['googleapis', { ok: false }]])).embed.description).toContain('unavailable');
      expect((await run('book', { book: 'q' }, [['googleapis', { json: { items: [] } }]])).embed.description).toContain('No results');
      expect((await run('book', { book: 'q' }, [['googleapis', { throws: true }]])).embed.description).toContain('unavailable');
    });
  });

  describe('song', () => {
    const odesli = { pageUrl: 'https://song.link/x', entitiesByUniqueId: { k: { title: 'T', artistName: 'Art', thumbnailUrl: 'https://art' } }, linksByPlatform: { spotify: { url: 'https://sp' }, tidal: { url: 'https://td' } } };

    it('searches iTunes then Odesli', async () => {
      const { embed } = await run('song', { song: 'q' }, [['itunes', { json: { results: [{ trackViewUrl: 'https://apple/1' }] } }], ['song.link', { json: odesli }]]);
      expect(embed.title).toBe('Song: T');
      expect(embed.url).toBe('https://song.link/x');
      expect((embed.fields ?? []).find(f => f.name === 'Platforms')?.value).toBe('[Spotify](https://sp)');
      const noTrackUrl = await run('song', { song: 'q' }, [['itunes', { json: { results: [{ trackName: 'N' }] } }], ['song.link', { json: {} }]]);
      expect((noTrackUrl.embed.fields ?? []).find(f => f.name === 'Platforms')?.value).toContain('Apple Music');
    });

    it('accepts links directly and degrades gracefully', async () => {
      const link = await run('song', { song: 'https://music.example/track' }, [['song.link', { json: odesli }]]);
      expect(link.embed.title).toBe('Song: T');
      const odesliDown = await run('song', { song: 'https://music.example/track' }, [['song.link', { throws: true }]]);
      expect((odesliDown.embed.fields ?? []).find(f => f.name === 'Platforms')?.value).toContain('Apple Music');
      expect((await run('song', { song: 'q' }, [['itunes', { ok: false }]])).embed.description).toContain('unavailable');
      expect((await run('song', { song: 'q' }, [['itunes', { json: { results: [] } }]])).embed.description).toContain('no results');
    });
  });

  describe('wikipedia', () => {
    it('summarises a page or reports a miss', async () => {
      const ok = await run('wikipedia', { query: 'q' }, [['wikipedia', {
        json: {
          title: 'T', extract: 'text', content_urls: { desktop: { page: 'https://wiki/T' } }, thumbnail: { source: 'https://img' },
        },
      }]]);
      expect(ok.embed.title).toBe('Wikipedia: T');
      expect(ok.embed.thumbnail?.url).toBe('https://img');
      const sparse = await run('wikipedia', { query: 'q' }, [['wikipedia', { json: { extract: 'e' } }]]);
      expect(sparse.embed.title).toBe('Wikipedia: q');
      // A page with no extract produces an empty description, which the embed builder rejects.
      await expect(run('wikipedia', { query: 'q' }, [['wikipedia', { json: {} }]])).rejects.toThrow();
      expect((await run('wikipedia', { query: 'q' }, [['wikipedia', { ok: false }]])).embed.description).toContain('No wikipedia results');
    });
  });

  describe('weather', () => {
    it('geocodes then fetches conditions', async () => {
      const weather = {
        current_condition: [{
          weatherDesc: [{ value: 'Sunny' }], temp_C: '20', temp_F: '68', FeelsLikeC: '19', FeelsLikeF: '66', windspeedKmph: '5', winddir16Point: 'N', humidity: '40', precipMM: '0',
        }],
      };
      const { embed } = await run('weather', { city: 'Paris' }, [['nominatim', { json: [{ lat: '1', lon: '2', display_name: 'Paris, FR' }] }], ['wttr.in', { json: weather }]]);
      expect(embed.title).toBe('Weather: Paris, FR');
      expect((embed.fields ?? []).find(f => f.name === 'Temperature')?.value).toBe('20°C / 68°F');
      const empty = await run('weather', { city: 'Paris' }, [['nominatim', { json: [{ lat: '1', lon: '2', display_name: 'P' }] }], ['wttr.in', { json: {} }]]);
      expect((empty.embed.fields ?? []).find(f => f.name === 'Condition')?.value).toBe('N/A');
    });

    it('handles unknown places and outages', async () => {
      expect((await run('weather', { city: 'x' }, [['nominatim', { json: [] }]])).embed.description).toContain('Could not find');
      expect((await run('weather', { city: 'x' }, [['nominatim', { throws: true }]])).embed.description).toContain('unavailable');
    });
  });
});
