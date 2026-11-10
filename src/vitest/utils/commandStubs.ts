import { vi } from 'vitest';

export type StubOptions = {
  options?: Record<string, unknown>;
  subcommand?: string | null;
  group?: string | null;
  user?: Record<string, unknown>;
  member?: unknown;
  guild?: unknown;
  channel?: unknown;
  client?: unknown;
  extra?: Record<string, unknown>;
};

/** A hand-built ChatInputCommandInteraction: enough surface for d.* commands without a gateway connection. */
export function slashStub(opts: StubOptions = {}) {
  const values = opts.options ?? {};
  const read = (name: string, required?: boolean) => {
    const value = values[name];
    if (required && (value === undefined || value === null)) throw new Error(`Required option "${name}" not found`);
    return value === undefined ? null : value;
  };
  return {
    id: 'int1',
    commandName: 'stub',
    deferred: false,
    replied: false,
    user: {
      id: 'u1', username: 'alice', tag: 'alice#0', displayName: 'Alice', bot: false, toString: (): string => '<@u1>', send: vi.fn(), ...opts.user,
    },
    member: 'member' in opts ? opts.member : {
      id: 'u1', displayName: 'Ally', permissions: { has: vi.fn(() => true) }, roles: { cache: new Set<string>() },
    },
    guild: 'guild' in opts ? opts.guild : { id: 'g1', name: 'Guild' },
    channel: 'channel' in opts ? opts.channel : { id: 'c1', send: vi.fn() },
    client: opts.client ?? {
      user: { id: 'bot' }, channels: { fetch: vi.fn() }, guilds: { fetch: vi.fn() }, users: { fetch: vi.fn() },
    },
    options: {
      data: Object.entries(values).map(([name, value]) => ({ name, value })),
      getString: vi.fn(read),
      getBoolean: vi.fn(read),
      getInteger: vi.fn(read),
      getNumber: vi.fn(read),
      getUser: vi.fn(read),
      getMember: vi.fn(read),
      getChannel: vi.fn(read),
      getRole: vi.fn(read),
      getMentionable: vi.fn(read),
      getAttachment: vi.fn(read),
      get: vi.fn((name: string) => (values[name] === undefined ? null : { name, value: values[name] })),
      getSubcommand: vi.fn(() => opts.subcommand ?? null),
      getSubcommandGroup: vi.fn(() => opts.group ?? null),
    },
    deferReply: vi.fn(),
    editReply: vi.fn(),
    reply: vi.fn(),
    followUp: vi.fn(),
    deleteReply: vi.fn(),
    showModal: vi.fn(),
    awaitModalSubmit: vi.fn(),
    isChatInputCommand: () => true,
    ...opts.extra,
  };
}

export type SlashStub = ReturnType<typeof slashStub>;

/** The first argument of the last editReply, as a plain object, for assertions. */
export function lastReply(stub: { editReply: { mock: { calls: unknown[][] } } }): Record<string, unknown> {
  const arg = stub.editReply.mock.calls.at(-1)?.[0];
  return (typeof arg === 'string' ? { content: arg } : arg) as Record<string, unknown>;
}
