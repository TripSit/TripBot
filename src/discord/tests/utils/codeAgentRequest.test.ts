import { canUseCodeAgent, handleCodeAgentRequest, isCodeAgentRequest } from '../../utils/codeAgentRequest';

const mocks = vi.hoisted(() => ({ run: vi.fn(), configured: vi.fn() }));

vi.mock('../../../global/commands/g.codeAgent', async () => {
  const actual = await vi.importActual<typeof import('../../../global/commands/g.codeAgent')>('../../../global/commands/g.codeAgent');
  return { ...actual, runCodeAgent: mocks.run, isCodeAgentConfigured: mocks.configured };
});

const e = env as unknown as Record<string, string>;

function message(over: Record<string, unknown> = {}) {
  const status = { edit: vi.fn() };
  return {
    author: { id: 'dev', bot: false },
    guild: { id: e.DISCORD_GUILD_ID },
    channelId: 'c1',
    channel: { parentId: e.CATEGORY_DEVELOPMENT },
    member: { roles: { cache: { has: (r: string) => r === e.ROLE_DEVELOPER } } },
    cleanContent: '@TripBot there is an issue with /ping, fix it',
    reply: vi.fn(async () => status),
    status,
    ...over,
  };
}

describe('canUseCodeAgent', () => {
  it('allows the owner anywhere', () => {
    expect(canUseCodeAgent(message({ author: { id: e.DISCORD_OWNER_ID, bot: false }, member: null, channel: {} }) as never)).toBe(true);
  });

  it('allows developers in the development category, including its threads', () => {
    expect(canUseCodeAgent(message() as never)).toBe(true);
    expect(canUseCodeAgent(message({ channel: { parentId: 'thread-parent', parent: { parentId: e.CATEGORY_DEVELOPMENT } } }) as never)).toBe(true);
  });

  it('rejects everyone else', () => {
    expect(canUseCodeAgent(message({ channel: { parentId: 'elsewhere' } }) as never)).toBe(false);
    expect(canUseCodeAgent(message({ member: { roles: { cache: { has: () => false } } } }) as never)).toBe(false);
    expect(canUseCodeAgent(message({ guild: { id: 'other-guild' } }) as never)).toBe(false);
    expect(canUseCodeAgent(message({ guild: null }) as never)).toBe(false);
    expect(canUseCodeAgent(message({ author: { id: e.DISCORD_OWNER_ID, bot: true } }) as never)).toBe(false);
  });
});

describe('handleCodeAgentRequest', () => {
  beforeEach(() => {
    mocks.run.mockReset();
    mocks.configured.mockReturnValue(true);
  });

  it('ignores unauthorized users without replying', async () => {
    const m = message({ member: { roles: { cache: { has: () => false } } } });
    expect(await handleCodeAgentRequest(m as never)).toBe(false);
    expect(m.reply).not.toHaveBeenCalled();
    expect(mocks.run).not.toHaveBeenCalled();
  });

  it('ignores messages that are not fix requests', async () => {
    const m = message({ cleanContent: '@TripBot hi' });
    expect(await handleCodeAgentRequest(m as never)).toBe(false);
    expect(mocks.run).not.toHaveBeenCalled();
  });

  it('explains when the agent is not configured', async () => {
    mocks.configured.mockReturnValue(false);
    const m = message();
    expect(await handleCodeAgentRequest(m as never)).toBe(true);
    expect(JSON.stringify(m.reply.mock.calls[0])).toContain('not configured');
    expect(mocks.run).not.toHaveBeenCalled();
  });

  it.each([
    [{
      status: 'pr', url: 'https://github.com/x/pull/1', branch: 'b', title: 't',
    }, 'Opened a PR: https://github.com/x/pull/1'],
    [{ status: 'report', summary: 'Found nothing' }, 'Found nothing'],
    [{ status: 'error', message: 'boom' }, 'boom'],
  ])('reports %j back in the channel', async (result, expected) => {
    mocks.run.mockResolvedValue(result);
    const m = message();
    expect(await handleCodeAgentRequest(m as never)).toBe(true);
    expect(mocks.run).toHaveBeenCalledWith(expect.stringContaining('fix it'));
    expect(m.status.edit.mock.calls[0][0].content).toContain(expected);
    expect(m.status.edit.mock.calls[0][0].allowedMentions).toEqual({ parse: [] });
  });
});

describe('isCodeAgentRequest', () => {
  it('needs both an authorized developer and a fix request', () => {
    expect(isCodeAgentRequest(message() as never)).toBe(true);
    expect(isCodeAgentRequest(message({ cleanContent: '@TripBot hi' }) as never)).toBe(false);
    expect(isCodeAgentRequest(message({ member: { roles: { cache: { has: () => false } } } }) as never)).toBe(false);
  });
});
