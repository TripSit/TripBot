/* eslint-disable no-restricted-syntax */
import { guildMemberUpdate } from '../../events/guildMemberUpdate';
import { dbMock } from '../../../vitest/utils/mockDb';
import { collectionOf, flushPromises } from '../../../vitest/utils/discordStubs';
import {
  LEVEL_COLOR_ROLES, DONOR_COLOR_ROLES, MINDSET_ROLES, TTS_MINDSET_ROLES,
} from '../../utils/roleGroups';

const e = env as unknown as Record<string, string>;

const send = vi.fn();
const getOpenTicket = vi.hoisted(() => vi.fn());
vi.mock('../../../global/utils/tickets', () => ({ getOpenTicket }));

const audit = { send: vi.fn() };

function member(roleIds: string[], guildId = e.DISCORD_GUILD_ID) {
  const roles = {
    cache: collectionOf(roleIds.map(id => [id, { id }] as [string, { id: string }])),
    add: vi.fn(),
    remove: vi.fn(),
  };
  const guild = { id: guildId, roles: { fetch: vi.fn(async (id: string) => ({ id, name: `role-${id}` })) } };
  return {
    id: 'm1', displayName: 'Ally', toString: (): string => '<@m1>', user: { id: 'm1' }, roles, guild,
  };
}

/** Runs the event for a role change and lets the fire-and-forget role handlers finish. */
async function change(oldIds: string[], newIds: string[], opts: { oldMember?: ReturnType<typeof member>; guildId?: string } = {}) {
  const oldMember = opts.oldMember ?? member(oldIds, opts.guildId);
  const newMember = member(newIds, opts.guildId);
  await guildMemberUpdate.execute(oldMember as never, newMember as never);
  await flushPromises();
  return { oldMember, newMember };
}

const firstTtsPair = () => {
  const [key, id] = Object.entries(MINDSET_ROLES)[0];
  return { id, tts: TTS_MINDSET_ROLES[key.replace('ROLE_', 'ROLE_TTS_') as keyof typeof TTS_MINDSET_ROLES] };
};

beforeEach(() => {
  (global as unknown as { discordClient: unknown }).discordClient = {
    channels: { fetch: vi.fn(async (id: string) => (id === e.CHANNEL_AUDITLOG ? audit : { send })) },
  };
  dbMock.discord_guilds.upsert.mockResolvedValue({ channel_tripsit: null } as never);
});

describe('guildMemberUpdate', () => {
  it('ignores updates that do not change roles', async () => {
    await change(['a'], ['a']);
    expect(audit.send).not.toHaveBeenCalled();
  });

  it('logs added and removed roles', async () => {
    await change(['old'], ['new']);
    expect(audit.send).toHaveBeenCalledWith('Ally added role-new');
    expect(audit.send).toHaveBeenCalledWith('Ally removed role-old');
  });

  it('does not log role additions in other guilds, but still logs nothing for removals', async () => {
    await change([], ['new'], { guildId: 'other' });
    await change(['old'], [], { guildId: 'other' });
    expect(audit.send).not.toHaveBeenCalled();
  });

  describe('colour roles', () => {
    const levelRole = Object.values(LEVEL_COLOR_ROLES)[0];
    const donorRole = Object.values(DONOR_COLOR_ROLES)[0];

    it('strips level colours from members below VIP 30', async () => {
      const { newMember } = await change([], [levelRole]);
      expect(newMember.roles.remove).toHaveBeenCalledWith(expect.objectContaining({ id: levelRole }));
    });

    it('lets VIP 30+ members and team members keep them', async () => {
      const vip = await change([e.ROLE_VIP_30], [e.ROLE_VIP_30, levelRole]);
      expect(vip.newMember.roles.remove).not.toHaveBeenCalled();
      const team = await change([e.ROLE_TEAMTRIPSIT], [e.ROLE_TEAMTRIPSIT, levelRole]);
      expect(team.newMember.roles.remove).not.toHaveBeenCalled();
    });

    it('strips donor colours from non-donors only', async () => {
      const nobody = await change([], [donorRole]);
      expect(nobody.newMember.roles.remove).toHaveBeenCalledWith(expect.objectContaining({ id: donorRole }));
      for (const donor of [e.ROLE_BOOSTER, e.ROLE_PREMIUM, e.ROLE_TEAMTRIPSIT]) {
        // eslint-disable-next-line no-await-in-loop
        const r = await change([donor], [donor, donorRole]);
        expect(r.newMember.roles.remove).not.toHaveBeenCalled();
      }
    });

    it('removes the donor colour when the last donor role is lost', async () => {
      const { newMember } = await change([e.ROLE_BOOSTER, donorRole], [donorRole]);
      expect(newMember.roles.remove).toHaveBeenCalledWith(expect.objectContaining({ id: donorRole }));
    });

    it('keeps the donor colour while another donor role remains, or when there is none', async () => {
      const still = await change([e.ROLE_BOOSTER, e.ROLE_PREMIUM, donorRole], [e.ROLE_PREMIUM, donorRole]);
      expect(still.newMember.roles.remove).not.toHaveBeenCalled();
      const none = await change([e.ROLE_BOOSTER], []);
      expect(none.newMember.roles.remove).not.toHaveBeenCalled();
    });
  });

  describe('team mindsets', () => {
    it('mirrors mindset roles onto their TTS equivalents for team members', async () => {
      const { id, tts } = firstTtsPair();
      const added = await change([e.ROLE_TEAMTRIPSIT], [e.ROLE_TEAMTRIPSIT, id]);
      expect(added.newMember.roles.add).toHaveBeenCalledWith(expect.objectContaining({ id: tts }));
      const removed = await change([e.ROLE_TEAMTRIPSIT, id], [e.ROLE_TEAMTRIPSIT]);
      expect(removed.newMember.roles.remove).toHaveBeenCalledWith(expect.objectContaining({ id: tts }));
    });

    it('does nothing for non-team members', async () => {
      const { id } = firstTtsPair();
      const added = await change([], [id]);
      expect(added.newMember.roles.add).not.toHaveBeenCalled();
      const removed = await change([id], []);
      expect(removed.newMember.roles.remove).not.toHaveBeenCalled();
    });
  });

  describe('supporter announcements', () => {
    const lounge = () => send.mock.calls.map(c => c[0] as string).join('\n');

    it('thanks boosters', async () => {
      await change([], [e.ROLE_BOOSTER]);
      expect(lounge()).toContain('just boosted the server!');
    });

    it('promotes first-time Patreon supporters to premium', async () => {
      const { newMember } = await change([], [e.ROLE_PATRON]);
      expect(newMember.roles.add).toHaveBeenCalledWith(expect.objectContaining({ id: e.ROLE_PREMIUM }));
      expect(lounge()).toContain('(first time donator) by signing up via [Patreon]');
    });

    it('thanks returning Patreon supporters without re-adding premium', async () => {
      const { newMember } = await change([e.ROLE_PREMIUM], [e.ROLE_PREMIUM, e.ROLE_PATRON]);
      expect(newMember.roles.add).not.toHaveBeenCalled();
      expect(lounge()).toContain('contributed further');
    });

    it('handles Ko-Fi donation triggers for new and returning donors', async () => {
      const first = await change([], [e.ROLE_DONATIONTRIGGER]);
      expect(first.newMember.roles.remove).toHaveBeenCalledWith(expect.objectContaining({ id: e.ROLE_DONATIONTRIGGER }));
      expect(first.newMember.roles.add).toHaveBeenCalledWith(expect.objectContaining({ id: e.ROLE_PREMIUM }));
      expect(lounge()).toContain('(first time donator) by donating via');
      send.mockClear();
      const again = await change([e.ROLE_PREMIUM], [e.ROLE_PREMIUM, e.ROLE_DONATIONTRIGGER]);
      expect(again.newMember.roles.add).not.toHaveBeenCalled();
      expect(lounge()).toContain('further contribution');
    });
  });

  describe('helper and tripsitter removal', () => {
    const thread = (over: Record<string, unknown> = {}) => ({
      id: 't1', parentId: 'ct', archived: false, name: 'thread', members: { remove: vi.fn() }, ...over,
    });

    function setup(threads: ReturnType<typeof thread>[], ticketThread: string | null = null) {
      dbMock.discord_guilds.upsert.mockResolvedValue({ channel_tripsit: 'ct', role_helper: 'helper', role_tripsitter: 'tripsitter' } as never);
      dbMock.users.upsert.mockResolvedValue({ id: 'uid' } as never);
      getOpenTicket.mockResolvedValue(ticketThread ? { thread_id: ticketThread } : null);
      (global as unknown as { discordClient: unknown }).discordClient = {
        channels: {
          fetch: vi.fn(async (id: string) => (id === 'ct'
            ? { threads: { fetch: vi.fn(async () => ({ threads: collectionOf(threads.map(t => [t.id, t] as [string, typeof t])) })) } }
            : audit)),
        },
      };
    }

    it('removes ex-helpers from active tripsit threads except their own open ticket', async () => {
      const own = thread({ id: 'own' });
      const other = thread({ id: 'other' });
      const archived = thread({ id: 'old', archived: true });
      const elsewhere = thread({ id: 'else', parentId: 'different' });
      setup([own, other, archived, elsewhere], 'own');
      await change(['helper'], []);
      expect(other.members.remove).toHaveBeenCalledWith('m1');
      expect(own.members.remove).not.toHaveBeenCalled();
      expect(archived.members.remove).not.toHaveBeenCalled();
      expect(elsewhere.members.remove).not.toHaveBeenCalled();
    });

    it('also handles the tripsitter role, even in other guilds', async () => {
      const t = thread();
      setup([t]);
      await change(['tripsitter'], [], { guildId: 'other' });
      expect(t.members.remove).toHaveBeenCalled();
      expect(audit.send).not.toHaveBeenCalled();
    });

    it('does nothing for guilds without a tripsit channel or for other roles', async () => {
      dbMock.discord_guilds.upsert.mockResolvedValue({ channel_tripsit: null, role_helper: 'helper' } as never);
      await change(['helper'], []);
      const t = thread();
      setup([t]);
      await change(['unrelated'], []);
      expect(t.members.remove).not.toHaveBeenCalled();
    });
  });
});
