import axios from 'axios';
import { fact } from '../../commands/g.fact';
import { joke } from '../../commands/g.joke';
import { wikiGuides } from '../../commands/g.guides';

vi.mock('axios');
const get = vi.mocked(axios.get);

describe('fact', () => {
  const original = env.RAPID_TOKEN;
  afterEach(() => {
    (env as { RAPID_TOKEN: string }).RAPID_TOKEN = original;
  });

  it('returns a placeholder without a token', async () => {
    (env as { RAPID_TOKEN: string }).RAPID_TOKEN = '<Optional>';
    expect(await fact()).toBe('No fact available.');
    expect(get).not.toHaveBeenCalled();
  });

  it('returns the first fact from the API', async () => {
    (env as { RAPID_TOKEN: string }).RAPID_TOKEN = 'token';
    get.mockResolvedValueOnce({ data: [{ fact: 'Honey never spoils' }] });
    expect(await fact()).toBe('Honey never spoils');
  });
});

describe('joke', () => {
  it('returns the API payload', async () => {
    const payload = { type: 'single', joke: 'pun' };
    get.mockResolvedValueOnce({ data: payload });
    expect(await joke()).toEqual(payload);
    expect(get).toHaveBeenCalledWith(expect.stringContaining('jokeapi'), expect.anything());
  });
});

describe('wikiGuides', () => {
  it('converts titles to underscore form', async () => {
    get.mockResolvedValueOnce({
      data: { query: { categorymembers: [{ title: 'Safer Use Guide' }, { title: 'Dosing' }] } },
    });
    expect(await wikiGuides()).toEqual(['Safer_Use_Guide', 'Dosing']);
  });
});
