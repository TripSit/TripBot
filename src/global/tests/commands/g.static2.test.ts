import { crisis } from '../../commands/g.crisis';
import { topic } from '../../commands/g.topic';

describe('crisis', () => {
  it('lists resources with a name and country', async () => {
    const list = await crisis();
    expect(list.length).toBeGreaterThan(5);
    expect(list.every(r => r.name && r.country)).toBe(true);
    expect(list.map(r => r.name)).toContain('Poison Control');
  });
});

describe('topic', () => {
  it('returns a question for the first and last index', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    expect(await topic()).toBe('What food do you crave most often?');
    vi.spyOn(Math, 'random').mockReturnValue(0.9999);
    expect(await topic()).toMatch(/astronaut/);
    vi.restoreAllMocks();
  });
});
