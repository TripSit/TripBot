import { modActionCounts, modHistoryButton, modHistoryRows } from '../../utils/modHistory';
import { dbMock } from '../../../vitest/utils/mockDb';
import { collectionOf } from '../../../vitest/utils/discordStubs';

const asMock = (fn: unknown) => fn as ReturnType<typeof vi.fn>;

const mocks = vi.hoisted(() => ({ trustScore: vi.fn() }));
vi.mock('../../utils/trustScore', () => ({ tripSitTrustScore: mocks.trustScore, default: mocks.trustScore }));

type Embed = { data: { description?: string; fields?: Array<{ name: string; value: string }>; footer?: { text: string } } };

describe('modActionCounts', () => {
  it('turns grouped rows into a lookup', async () => {
    asMock(dbMock.user_actions.groupBy).mockResolvedValue([{ type: 'NOTE', _count: { _all: 2 } }, { type: 'FULL_BAN', _count: { _all: 1 } }] as never);
    expect(await modActionCounts('uid')).toEqual({ NOTE: 2, FULL_BAN: 1 });
  });
});

describe('modHistoryRows', () => {
  const options = (counts: object) => (modHistoryRows('d1', counts)[0].toJSON() as unknown as { components: Array<{ custom_id: string; options: Array<{ value: string; label: string }> }> }).components[0];

  it('always offers the profile, plus a category per non-zero count', () => {
    const menu = options({ NOTE: 2, WARNING: 0, TIMEOUT: 1 });
    expect(menu.custom_id).toBe('modHistory~select~d1');
    expect(menu.options.map(o => o.value)).toEqual(['PROFILE', 'NOTE', 'TIMEOUT']);
    expect(menu.options[1].label).toBe('View Notes (2)');
  });

  it('offers only the profile when there is no history', () => {
    expect(options({}).options).toHaveLength(1);
  });
});

describe('modHistoryButton', () => {
  const MOD_ROLE = 'mod-role';

  function menu(type: string, over: Record<string, unknown> = {}) {
    return {
      customId: 'modHistory~select~d1',
      values: [type],
      isStringSelectMenu: () => true,
      guild: { id: 'g1', members: { fetch: vi.fn() } },
      member: { roles: { cache: new Set([MOD_ROLE]) } },
      deferUpdate: vi.fn(),
      deferReply: vi.fn(),
      editReply: vi.fn(),
      ...over,
    };
  }
  function button(type: string, index: string, over: Record<string, unknown> = {}) {
    return menu(type, { customId: `modHistory~page~${type}~d1~${index}`, isStringSelectMenu: () => false, ...over });
  }
  const reply = (i: { editReply: ReturnType<typeof vi.fn> }) => i.editReply.mock.calls.at(-1)?.[0] as { embeds: Embed[]; components: unknown[] };
  const action = (n: number, over: Record<string, unknown> = {}) => ({
    id: `a${n}`,
    created_by: 'mod-uid',
    repealed_by: null,
    created_at: new Date('2024-01-01'),
    internal_note: `reason ${n}`,
    description: 'public note',
    expires_at: null,
    repealed_at: null,
    ...over,
  });

  beforeEach(() => {
    dbMock.discord_guilds.upsert.mockResolvedValue({ role_moderator: MOD_ROLE } as never);
  });

  it('ignores DMs and unknown categories', async () => {
    await modHistoryButton(menu('NOTE', { guild: null }) as never);
    const unknown = menu('NONSENSE');
    await modHistoryButton(unknown as never);
    expect(unknown.deferReply).not.toHaveBeenCalled();
  });

  it('defers ephemerally for dropdowns and in place for page buttons', async () => {
    dbMock.users.findFirst.mockResolvedValue(null);
    const select = menu('NOTE');
    await modHistoryButton(select as never);
    expect(select.deferReply).toHaveBeenCalledWith({ flags: 64 });
    const page = button('NOTE', '0');
    await modHistoryButton(page as never);
    expect(page.deferUpdate).toHaveBeenCalled();
  });

  it('only shows history to moderators', async () => {
    const i = menu('NOTE', { member: { roles: { cache: new Set() } } });
    await modHistoryButton(i as never);
    expect(reply(i).embeds[0].data.description).toBe('Only moderators can view mod history.');
    dbMock.discord_guilds.upsert.mockResolvedValue({ role_moderator: null } as never);
    const none = menu('NOTE');
    await modHistoryButton(none as never);
    expect(reply(none).embeds[0].data.description).toContain('Only moderators');
    const anonymous = menu('NOTE', { member: null });
    dbMock.discord_guilds.upsert.mockResolvedValue({ role_moderator: MOD_ROLE } as never);
    await modHistoryButton(anonymous as never);
    expect(reply(anonymous).embeds[0].data.description).toContain('Only moderators');
  });

  it('says so when there are no actions of that type', async () => {
    dbMock.users.findFirst.mockResolvedValue({ id: 'uid' } as never);
    dbMock.user_actions.findMany.mockResolvedValue([]);
    const i = menu('WARNING');
    await modHistoryButton(i as never);
    expect(reply(i).embeds[0].data.description).toBe('No warns found for <@d1>.');
    dbMock.users.findFirst.mockResolvedValue(null);
    const unknownUser = menu('WARNING');
    await modHistoryButton(unknownUser as never);
    expect(reply(unknownUser).embeds[0].data.description).toContain('No warns found');
  });

  it('shows a single action without navigation', async () => {
    dbMock.users.findFirst.mockResolvedValue({ id: 'uid' } as never);
    dbMock.user_actions.findMany.mockResolvedValue([action(1)] as never);
    dbMock.users.findUnique.mockResolvedValue({ discord_id: 'moddiscord' } as never);
    const i = menu('NOTE');
    await modHistoryButton(i as never);
    const { embeds, components } = reply(i);
    expect(components).toEqual([]);
    expect(embeds[0].data.description).toBe('**Note 1 of 1** for <@d1>');
    expect(embeds[0].data.fields?.find(f => f.name === 'Moderator')?.value).toBe('<@moddiscord>');
    expect(embeds[0].data.fields?.find(f => f.name === 'Reason')?.value).toBe('reason 1');
  });

  it('shows expiry, repeal details, and placeholders for missing text', async () => {
    dbMock.users.findFirst.mockResolvedValue({ id: 'uid' } as never);
    dbMock.user_actions.findMany.mockResolvedValue([action(1, {
      internal_note: '', description: null, expires_at: new Date('2025-01-01'), repealed_at: new Date('2024-06-01'), repealed_by: 'rep-uid',
    })] as never);
    dbMock.users.findUnique.mockResolvedValue(null);
    const i = menu('FULL_BAN');
    await modHistoryButton(i as never);
    const fields = reply(i).embeds[0].data.fields ?? [];
    expect(fields.find(f => f.name === 'Reason')?.value).toBe('No reason provided');
    expect(fields.find(f => f.name === 'Note sent to user')?.value).toBe('*No message sent to user*');
    expect(fields.find(f => f.name === 'Moderator')?.value).toBe('Unknown');
    expect(fields.find(f => f.name === 'Expires')).toBeDefined();
    expect(fields.find(f => f.name === 'Repealed')?.value).toContain('by Unknown');
  });

  it('pages through multiple actions with bounded indexes and navigation buttons', async () => {
    dbMock.users.findFirst.mockResolvedValue({ id: 'uid' } as never);
    dbMock.user_actions.findMany.mockResolvedValue([action(1), action(2), action(3)] as never);
    dbMock.users.findUnique.mockResolvedValue({ discord_id: 'm' } as never);
    const middle = button('NOTE', '1');
    await modHistoryButton(middle as never);
    expect(reply(middle).embeds[0].data.footer?.text).toBe('Page 2 / 3');
    const nav = JSON.stringify(reply(middle).components);
    expect(nav).toContain('first');
    expect(nav).toContain('last');
    const tooFar = button('NOTE', '99');
    await modHistoryButton(tooFar as never);
    expect(reply(tooFar).embeds[0].data.footer?.text).toBe('Page 3 / 3');
    const negative = button('NOTE', '-5');
    await modHistoryButton(negative as never);
    expect(reply(negative).embeds[0].data.footer?.text).toBe('Page 1 / 3');
    const garbage = button('NOTE', 'abc');
    await modHistoryButton(garbage as never);
    expect(reply(garbage).embeds[0].data.footer?.text).toBe('Page 1 / 3');
  });

  it('uses a compact navigation row for exactly two pages', async () => {
    dbMock.users.findFirst.mockResolvedValue({ id: 'uid' } as never);
    dbMock.user_actions.findMany.mockResolvedValue([action(1), action(2)] as never);
    dbMock.users.findUnique.mockResolvedValue(null);
    const i = button('NOTE', '0');
    await modHistoryButton(i as never);
    expect(JSON.stringify(reply(i).components)).not.toContain('first');
  });

  describe('profile', () => {
    const user = {
      username: 'alice', displayName: 'Alice', createdAt: new Date('2020-01-01'), displayAvatarURL: () => 'https://av',
    };
    const profileMember = (over: Record<string, unknown> = {}) => ({
      displayName: 'Ally',
      displayAvatarURL: () => 'https://mav',
      joinedAt: new Date('2023-01-01'),
      communicationDisabledUntilTimestamp: Date.now() + 3_600_000,
      roles: {
        cache: collectionOf({
          g1: { id: 'g1', position: 0 }, r1: { id: 'r1', position: 1 }, r2: { id: 'r2', position: 5 },
        }),
      },
      ...over,
    });

    function setup(opts: { user?: unknown; member?: unknown; userData?: unknown } = {}) {
      (global as unknown as { discordClient: unknown }).discordClient = {
        users: { fetch: vi.fn(async () => { if (opts.user === null) throw new Error('Unknown User'); return opts.user ?? user; }) },
      };
      dbMock.users.findFirst.mockResolvedValue((opts.userData === undefined
        ? {
          joined_at: new Date('2022-01-01'), last_seen_at: new Date('2024-05-01'), karma_received: 3, karma_given: 4,
        }
        : opts.userData) as never);
      mocks.trustScore.mockResolvedValue({ trustScore: 6, tsReasoning: 'x'.repeat(2000) });
      const i = menu('PROFILE');
      i.guild.members.fetch = vi.fn(async () => { if (opts.member === null) throw new Error('Unknown Member'); return opts.member ?? profileMember(); }) as never;
      return i;
    }

    it('builds a full profile for members', async () => {
      const i = setup();
      await modHistoryButton(i as never);
      const fields = reply(i).embeds[0].data.fields ?? [];
      const byName = Object.fromEntries(fields.map(f => [f.name, f.value]));
      expect(byName.Username).toBe('alice');
      expect(byName['Display name']).toBe('Ally');
      expect(byName.Karma).toBe('3 received / 4 given');
      expect(byName['Currently muted until']).toBeDefined();
      expect(byName['Roles (2)']).toBe('<@&r2> <@&r1>');
      expect(byName['TripSit TrustScore']).toContain('**6**');
      expect(byName['TripSit TrustScore'].length).toBeLessThan(1024);
    });

    it('handles non-members with no stored data', async () => {
      const i = setup({ member: null, userData: null });
      await modHistoryButton(i as never);
      const fields = reply(i).embeds[0].data.fields ?? [];
      expect(fields.find(f => f.name === 'Joined server')?.value).toBe('Not in the server');
      expect(fields.find(f => f.name === 'Known to TripBot since')).toBeUndefined();
      expect(fields.find(f => f.name === 'Roles (0)')).toBeUndefined();
    });

    it('handles members whose account lookup failed and who are not muted', async () => {
      const i = setup({ user: null, member: profileMember({ communicationDisabledUntilTimestamp: null, roles: { cache: collectionOf({}) } }) });
      await modHistoryButton(i as never);
      const fields = reply(i).embeds[0].data.fields ?? [];
      expect(fields.find(f => f.name === 'Username')?.value).toBe('Unknown');
      expect(fields.find(f => f.name === 'Account created')).toBeUndefined();
      expect(fields.find(f => f.name === 'Currently muted until')).toBeUndefined();
    });

    it('reports deleted accounts', async () => {
      const i = setup({ user: null, member: null });
      await modHistoryButton(i as never);
      expect(reply(i).embeds[0].data.description).toContain('likely deleted');
    });

    it('falls back to the user avatar and display name when not a member', async () => {
      const i = setup({ member: null });
      await modHistoryButton(i as never);
      expect((reply(i).embeds[0].data.fields ?? []).find(f => f.name === 'Display name')?.value).toBe('Alice');
    });
  });
});
