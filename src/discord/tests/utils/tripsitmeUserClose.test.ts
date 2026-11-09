import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
} from 'vitest';
import type {
  ButtonInteraction,
  GuildMember,
  TextChannel,
  Role,
  ThreadChannel,
} from 'discord.js';
import { tripsitmeUserClose } from '../../utils/tripsitme';
import * as dbRecords from '../../../global/utils/dbRecords';
import { dbMock } from '../../../vitest/utils/mockDb';

vi.mock('../../../global/utils/dbRecords');
vi.mock('../../utils/commandCooldown', () => ({
  default: vi.fn().mockResolvedValue({ success: true }),
}));
vi.mock('../../utils/context', () => ({
  default: vi.fn().mockResolvedValue('test-context'),
}));

const META_CHANNEL_ID = 'meta-789';
const DB_USER_ID = 'db-user-id';

describe('tripsitmeUserClose', () => {
  const HELPER_ID = 'helper-123';
  const TARGET_ID = 'target-456';
  const THREAD_ID = 'thread-101';

  let mockMetaSend: ReturnType<typeof vi.fn>;
  let mockThreadSend: ReturnType<typeof vi.fn>;
  let mockEditReply: ReturnType<typeof vi.fn>;
  let mockDeferReply: ReturnType<typeof vi.fn>;
  let mockActor: Partial<GuildMember>;
  let mockTarget: Partial<GuildMember>;
  let mockMetaChannel: Partial<TextChannel>;
  let mockThreadChannel: Partial<ThreadChannel>;

  beforeEach(() => {
    vi.clearAllMocks();

    global.emojiGet = vi.fn().mockImplementation((name: string) => ({
      id: `emoji-${name}`,
      name,
      identifier: name,
      url: `https://emoji/${name}.png`,
    })) as never;

    mockMetaSend = vi.fn().mockResolvedValue({});
    mockThreadSend = vi.fn().mockResolvedValue({
      react: vi.fn().mockResolvedValue({}),
      createReactionCollector: vi.fn().mockReturnValue({ on: vi.fn() }),
      delete: vi.fn().mockResolvedValue({}),
    });
    mockEditReply = vi.fn().mockResolvedValue({});
    mockDeferReply = vi.fn().mockResolvedValue({});

    mockActor = {
      id: HELPER_ID,
      displayName: 'HelperUser',
      fetch: vi.fn().mockResolvedValue(undefined),
    };

    mockTarget = {
      id: TARGET_ID,
      displayName: 'TripsitTarget',
      guild: { id: 'guild-1' } as never,
      roles: {
        remove: vi.fn().mockResolvedValue({}),
        add: vi.fn().mockResolvedValue({}),
      } as never,
    };

    mockMetaChannel = {
      id: META_CHANNEL_ID,
      send: mockMetaSend,
      setName: vi.fn().mockResolvedValue({}),
    } as never;

    mockThreadChannel = {
      id: THREAD_ID,
      name: 'help-thread',
      archived: false,
      setArchived: vi.fn().mockResolvedValue({}),
      setName: vi.fn().mockResolvedValue({}),
      send: mockThreadSend,
    } as never;

    vi.mocked(dbRecords.getOrCreateUser).mockResolvedValue({
      id: DB_USER_ID,
      roles: '',
    } as never);

    vi.mocked(dbRecords.getOrCreateGuild).mockResolvedValue({
      id: 'db-guild-id',
      channel_tripsitmeta: META_CHANNEL_ID,
      role_needshelp: null,
    } as never);
  });

  function createInteraction(customId: string, actorId: string, actorName = 'HelperUser'): ButtonInteraction {
    return {
      customId,
      id: 'interaction-1',
      guild: {
        id: 'guild-1',
        name: 'TripSit Guild',
        members: {
          fetch: vi.fn().mockImplementation((id: string) => {
            if (id === TARGET_ID) return Promise.resolve(mockTarget);
            if (id === HELPER_ID) return Promise.resolve(mockActor);
            return Promise.resolve({
              id,
              displayName: id,
              roles: { highest: { comparePositionTo: () => -1 } },
            });
          }),
        },
        channels: {
          fetch: vi.fn().mockImplementation((id: string) => {
            if (id === META_CHANNEL_ID) return Promise.resolve(mockMetaChannel);
            if (id === THREAD_ID) return Promise.resolve(mockThreadChannel);
            return Promise.resolve(null);
          }),
        },
        roles: {
          fetch: vi.fn().mockResolvedValue({
            id: 'role-1',
            name: 'SomeRole',
            comparePositionTo: () => -1,
          } as Partial<Role>),
        },
      },
      member: {
        ...mockActor,
        id: actorId,
        displayName: actorName,
      },
      user: { id: actorId, tag: `${actorName}#0001` },
      channel: { id: 'channel-1' },
      deferReply: mockDeferReply,
      editReply: mockEditReply,
      client: {
        user: { id: 'bot-1' },
      },
    } as unknown as ButtonInteraction;
  }

  it('posts helper and target names to tripsit-meta on /tripsitmode off override', async () => {
    dbMock.user_tickets.findFirst.mockResolvedValue({
      id: 'ticket-1',
      user_id: DB_USER_ID,
      status: 'OPEN',
      thread_id: THREAD_ID,
      meta_thread_id: META_CHANNEL_ID,
      archived_at: null,
      deleted_at: null,
    } as never);

    dbMock.user_tickets.update.mockResolvedValue({} as never);

    const interaction = createInteraction(`tripsitmodeOffOverride~${TARGET_ID}`, HELPER_ID, 'HelperUser');
    await tripsitmeUserClose(interaction);

    expect(mockMetaSend).toHaveBeenCalledTimes(1);
    expect(mockMetaSend).toHaveBeenCalledWith({
      content: 'HelperUser has turned off tripsit mode for TripsitTarget!',
    });
  });

  it('posts target name to tripsit-meta when user closes their own session', async () => {
    dbMock.user_tickets.findFirst.mockResolvedValue({
      id: 'ticket-1',
      user_id: DB_USER_ID,
      status: 'OPEN',
      thread_id: THREAD_ID,
      meta_thread_id: META_CHANNEL_ID,
      archived_at: null,
      deleted_at: null,
    } as never);

    dbMock.user_tickets.update.mockResolvedValue({} as never);

    const interaction = createInteraction(`tripsitmeUserClose~${TARGET_ID}`, TARGET_ID, 'TripsitTarget');
    await tripsitmeUserClose(interaction);

    expect(mockMetaSend).toHaveBeenCalledTimes(1);
    expect(mockMetaSend).toHaveBeenCalledWith({
      content: 'TripsitTarget has indicated that they no longer need help!',
    });
  });

  it('reports target name in reject message when target has no open session on override', async () => {
    dbMock.user_tickets.findFirst.mockResolvedValue(null);

    const interaction = createInteraction(`tripsitmodeOffOverride~${TARGET_ID}`, HELPER_ID, 'HelperUser');
    await tripsitmeUserClose(interaction);

    expect(mockEditReply).toHaveBeenCalledTimes(1);
    const callArgs = mockEditReply.mock.calls[0][0];
    expect(callArgs.embeds).toBeDefined();
    expect(callArgs.embeds[0].data.description)
      .toContain('Hey HelperUser, TripsitTarget does not have an open session!');
    expect(mockMetaSend).not.toHaveBeenCalled();
  });

  it('reports actor name in reject message when user has no open session without override', async () => {
    dbMock.user_tickets.findFirst.mockResolvedValue(null);

    const interaction = createInteraction(`tripsitmeUserClose~${TARGET_ID}`, TARGET_ID, 'TripsitTarget');
    await tripsitmeUserClose(interaction);

    expect(mockEditReply).toHaveBeenCalledTimes(1);
    const callArgs = mockEditReply.mock.calls[0][0];
    expect(callArgs.embeds).toBeDefined();
    expect(callArgs.embeds[0].data.description)
      .toContain('Hey TripsitTarget, you do not have an open session!');
    expect(mockMetaSend).not.toHaveBeenCalled();
  });

  it('blocks non-creators from clicking close button without override', async () => {
    const interaction = createInteraction(`tripsitmeUserClose~${TARGET_ID}`, HELPER_ID, 'RandomUser');
    await tripsitmeUserClose(interaction);

    expect(mockEditReply).toHaveBeenCalledWith({
      content: 'Only the user receiving help can click this button!',
    });
    expect(mockMetaSend).not.toHaveBeenCalled();
  });
});
