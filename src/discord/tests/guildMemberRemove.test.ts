import {
  GuildMember,
  TextChannel,
  Guild,
  User,
} from 'discord.js';
import { guildMemberRemove } from '../events/guildMemberRemove';

const mockUpsertUsers = jest.fn();
const mockUpsertGuilds = jest.fn();
const mockChannelsFetch = jest.fn();
const mockLogInfo = jest.fn();
const mockLogDebug = jest.fn();

// Mock objs 
global.db = {
  users: {
    upsert: mockUpsertUsers,
  },
  discord_guilds: {
    upsert: mockUpsertGuilds,
  },
} as any;

global.discordClient = {
  channels: {
    fetch: mockChannelsFetch,
  },
} as any;

global.log = {
  info: mockLogInfo,
  debug: mockLogDebug,
} as any;

global.env = {
  DISCORD_GUILD_ID: '123456789',
  TS_ICON_URL: 'http://test.com/icon.png',
  DISCLAIMER: 'Test Disclaimer',
  FLAME_ICON_URL: 'http://test.com/flame.png',
} as any;

describe('guildMemberRemove', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUpsertUsers.mockResolvedValue({
      mod_thread_id: null,
      joined_at: new Date(),
    });
    mockUpsertGuilds.mockResolvedValue({ channel_mod_log: '987654321' });
  });

  it('should run if joinTimeStamp is present', async () => {
    const mockChannel = {
      send: jest.fn(),
    } as unknown as TextChannel;
    mockChannelsFetch.mockResolvedValue(mockChannel);

    const joinedTimestamp = Date.now() - 1000 * 60 * 60 * 24 * 5; // 5 days ago
    const mockMember = {
      guild: {
        id: '123456789',
        name: 'Test Guild',
        channels: {
          fetch: jest.fn(),
        },
      },
      id: '111111',
      displayName: 'TestUser',
      user: {
        tag: 'TestUser#1234',
      },
      joinedTimestamp,
      toString: () => '<@111111>',
    } as unknown as GuildMember;

    await guildMemberRemove.execute(mockMember);

    const calls = (mockChannel.send as jest.Mock).mock.calls;
    expect(calls.length).toBe(1);
    const embed = calls[0][0].embeds[0];
    expect(embed.data.description).toContain('has left the guild after 5 days');
  });

  it('should calculate duration from database when joinedTimestamp is missing', async () => {
    const mockChannel = {
      send: jest.fn(),
    } as unknown as TextChannel;
    mockChannelsFetch.mockResolvedValue(mockChannel);

    // User mock data 
    const dbJoinedAt = new Date(Date.now() - 1000 * 60 * 60 * 24 * 10);
    mockUpsertUsers.mockResolvedValue({
      mod_thread_id: null,
      joined_at: dbJoinedAt,
    });

    const mockMember = {
      guild: {
        id: '123456789',
        name: 'Test Guild',
        channels: {
          fetch: jest.fn(),
        },
      },
      id: '111111',
      displayName: 'TestUser',
      user: {
        tag: 'TestUser#1234',
      },
      joinedTimestamp: null,
      toString: () => '<@111111>',
    } as unknown as GuildMember;

    await guildMemberRemove.execute(mockMember);

    const calls = (mockChannel.send as jest.Mock).mock.calls;
    expect(calls.length).toBe(1);
    const embed = calls[0][0].embeds[0];
    expect(embed.data.description).toContain('has left the guild after 1 week, 3 days');
  });
});
