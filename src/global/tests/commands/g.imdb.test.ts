const mocks = vi.hoisted(() => ({ search: vi.fn(), get: vi.fn() }));

vi.mock('imdb-api', () => ({
  Client: class {
    search = mocks.search;

    get = mocks.get;
  },
}));

describe('imdb', () => {
  async function load() {
    return (await import('../../commands/g.imdb')).default;
  }

  it('returns the first search result\'s details', async () => {
    mocks.search.mockResolvedValueOnce({ results: [{ name: 'Alien' }] });
    mocks.get.mockResolvedValueOnce({ title: 'Alien' });
    expect(await (await load())('alien')).toEqual({ title: 'Alien' });
    expect(mocks.get).toHaveBeenCalledWith({ name: 'Alien' });
  });

  it('returns an empty object when lookups fail', async () => {
    const imdb = await load();
    mocks.search.mockResolvedValueOnce({ results: [{ name: 'X' }] });
    mocks.get.mockRejectedValueOnce(new Error('Movie not found!'));
    expect(await imdb('x')).toEqual({});
    mocks.search.mockResolvedValueOnce({ results: [{ name: 'X' }] });
    mocks.get.mockRejectedValueOnce(new Error('timeout'));
    expect(await imdb('x')).toEqual({});
    mocks.search.mockRejectedValueOnce(new Error('Movie not found!'));
    expect(await imdb('x')).toEqual({});
    mocks.search.mockRejectedValueOnce(new Error('network'));
    expect(await imdb('x')).toEqual({});
  });
});
