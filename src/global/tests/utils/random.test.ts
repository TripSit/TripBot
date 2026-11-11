import { randomItem } from '../../utils/random';

describe('randomItem', () => {
  it('picks by Math.random index', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    expect(randomItem(['a', 'b', 'c', 'd'])).toBe('c');
    vi.restoreAllMocks();
  });
});
