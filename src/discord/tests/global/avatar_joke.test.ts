import { dAvatar } from '../../commands/global/d.avatar';
import { dJoke } from '../../commands/global/d.joke';
import { lastReply, slashStub } from '../../../vitest/utils/commandStubs';

const mocks = vi.hoisted(() => ({ joke: vi.fn() }));
vi.mock('../../utils/context', () => ({ default: vi.fn(async () => 'ctx') }));
vi.mock('../../../global/commands/g.joke', () => ({ joke: mocks.joke }));

const embed = (s: ReturnType<typeof slashStub>) => (lastReply(s).embeds as Array<{ data: Record<string, unknown> }>)[0].data;

describe('avatar', () => {
  it('requires a guild', async () => {
    const stub = slashStub({ guild: null, options: { user: { id: 'x' } } });
    expect(await dAvatar.execute(stub as never)).toBe(false);
    expect(lastReply(stub).content).toContain('guild');
  });

  it('shows the member avatar', async () => {
    const member = { displayName: 'Bob', displayAvatarURL: () => 'https://av/a.png' };
    const guild = { id: 'g', members: { fetch: vi.fn(async () => member) } };
    const stub = slashStub({ guild, options: { user: { id: 'x' }, ephemeral: true } });
    expect(await dAvatar.execute(stub as never)).toBe(true);
    expect(embed(stub).title).toBe("Bob's Profile Picture");
    expect(stub.deferReply).toHaveBeenCalledWith({ flags: expect.anything() });
  });

  it('handles unknown members and other errors', async () => {
    const guild = { id: 'g', members: { fetch: vi.fn().mockRejectedValueOnce({ code: 10007 }).mockRejectedValueOnce({ code: 1 }) } };
    const stub = slashStub({ guild, options: { user: { id: 'x' } } });
    expect(await dAvatar.execute(stub as never)).toBe(false);
    expect(lastReply(stub).content).toContain('member of the current guild');
    expect(await dAvatar.execute(stub as never)).toBe(false);
  });
});

describe('joke', () => {
  it('formats single and two-part jokes', async () => {
    mocks.joke.mockResolvedValueOnce({ type: 'single', joke: 'J' });
    const a = slashStub();
    expect(await dJoke.execute(a as never)).toBe(true);
    expect(embed(a).title).toBe('J');
    mocks.joke.mockResolvedValueOnce({ type: 'twopart', setup: 'S', delivery: 'D' });
    const b = slashStub({ options: { ephemeral: true } });
    await dJoke.execute(b as never);
    expect(embed(b)).toMatchObject({ title: 'S', description: 'D' });
  });
});
