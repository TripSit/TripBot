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

  it('searches the refreshed data instead of the bundled copy', async () => {
    vi.mocked(axios.get).mockResolvedValue({
      status: 200,
      statusText: 'OK',
      data: { ZZ: { Country: { Name: 'Zedland' }, Suicide: 'new' } },
    });
    const ems = await loadEms();
    const results = await ems('zedland');
    expect(results).toHaveLength(1);
    expect(results[0].Suicide).toBe('new');
    expect(await ems('canada')).toEqual([]);
  });

  it('keeps serving the bundled data when the upstream request fails, and retries no more than hourly', async () => {
    vi.mocked(axios.get).mockRejectedValue(new Error('upstream down'));
    const ems = await loadEms();
    const results = await ems('united');
    expect(results.length).toBeGreaterThan(0);
    await ems('united');
    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(fs.writeFileSync).not.toHaveBeenCalled();
  });

  it('keeps the previous data when the upstream payload is unusable', async () => {
    vi.mocked(axios.get).mockResolvedValue({ status: 200, statusText: 'OK', data: { bad: { nope: true } } });
    const ems = await loadEms();
    expect((await ems('united')).length).toBeGreaterThan(0);
    expect(fs.writeFileSync).not.toHaveBeenCalled();
    vi.mocked(axios.get).mockResolvedValue({ status: 200, statusText: 'OK', data: null });
    vi.useFakeTimers();
    vi.setSystemTime(Date.now() + 2 * 3600 * 1000);
    try {
      expect((await ems('united')).length).toBeGreaterThan(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it('retries a failed refresh after an hour and recovers', async () => {
    vi.mocked(axios.get).mockRejectedValueOnce(new Error('down'));
    const ems = await loadEms();
    await ems('canada');
    vi.useFakeTimers();
    vi.setSystemTime(Date.now() + 2 * 3600 * 1000);
    try {
      await ems('canada');
    } finally {
      vi.useRealTimers();
    }
    expect(axios.get).toHaveBeenCalledTimes(2);
    expect(fs.writeFileSync).toHaveBeenCalledTimes(1);
  });

  it('still answers when the refreshed data cannot be saved', async () => {
    vi.mocked(fs.writeFileSync).mockImplementation(() => { throw new Error('read-only'); });
    const ems = await loadEms();
    expect((await ems('canada'))).toHaveLength(1);
  });
});
