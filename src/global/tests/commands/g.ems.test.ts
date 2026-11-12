import axios from 'axios';
import fs from 'node:fs';

vi.mock('axios');

async function loadEms() {
  vi.resetModules();
  return (await import('../../commands/g.ems')).default;
}

describe('ems', () => {
  beforeEach(() => {
    vi.spyOn(fs, 'writeFileSync').mockImplementation(() => undefined);
    vi.mocked(axios.get).mockResolvedValue({
      status: 200,
      statusText: 'OK',
      data: {
        US: { Country: { Name: 'United States' }, Suicide: 'old' },
        CA: { Country: { Name: 'Canada' }, Suicide: 'old' },
      },
    });
  });
  afterEach(() => vi.restoreAllMocks());

  it('refreshes the cache once and never writes the real asset file', async () => {
    const ems = await loadEms();
    await ems('canada');
    await ems('canada');
    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(fs.writeFileSync).toHaveBeenCalledTimes(1);
  });

  it('returns nothing for a blank search', async () => {
    const ems = await loadEms();
    expect(await ems('   ')).toEqual([]);
  });

  it('matches countries by name prefix', async () => {
    const ems = await loadEms();
    const results = await ems('united');
    expect(results.length).toBeGreaterThan(0);
    expect(results.every(r => r.Country.Name.toLowerCase().includes('united'))).toBe(true);
  });
});
