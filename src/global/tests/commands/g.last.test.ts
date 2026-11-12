/* eslint-disable sonarjs/no-duplicate-string */
import {
  ChannelType, Collection, Guild, User,
} from 'discord.js';
import { last } from '../../commands/g.last';

const target = { id: 't', username: 'tester' } as User;

function message(authorId: string, content: string, at: string, channelId = 'c1') {
  return {
    author: { id: authorId }, content, channelId, createdAt: new Date(at),
  };
}

function textChannel(id: string, messages: ReturnType<typeof message>[], parentId = 'cat', fail = false) {
  const col = new Collection(messages.map((m, i) => [`${id}-${i}`, m]));
  return {
    id,
    parentId,
    type: ChannelType.GuildText,
    messages: { fetch: fail ? vi.fn().mockRejectedValue(new Error('no access')) : vi.fn().mockResolvedValue(col) },
  };
}

const guildOf = (channels: unknown[]) => ({
  channels: { fetch: vi.fn().mockResolvedValue(new Collection(channels.map((c, i) => [`k${i}`, c]))) },
}) as unknown as Guild;

describe('last', () => {
  it('reports when the user has no messages', async () => {
    const result = await last(target, guildOf([textChannel('c1', [message('other', 'hi', '2024-01-01')])]));
    expect(result).toEqual({
      lastMessage: 'No messages found', messageList: 'No messages found', messageCount: 0, totalMessages: 0,
    });
  });

  it('returns the newest message first and counts everything', async () => {
    const result = await last(target, guildOf([
      textChannel('c1', [message('t', 'old', '2024-01-01'), message('other', 'x', '2024-01-02')]),
      textChannel('c2', [message('t', 'newest', '2024-03-01', 'c2')]),
    ]));
    expect(result.totalMessages).toBe(2);
    expect(result.messageCount).toBe(2);
    expect(result.lastMessage).toContain("tester's");
    expect(result.lastMessage).toContain('newest');
    expect(result.messageList.indexOf('newest')).toBeLessThan(result.messageList.indexOf('old'));
  });

  it('skips staff and development categories, non-text channels and failures', async () => {
    const skipped = textChannel('s1', [message('t', 'hidden', '2024-01-01')], env.CATEGORY_TEAMTRIPSIT);
    const dev = textChannel('s2', [message('t', 'dev', '2024-01-01')], env.CATEGORY_DEVELOPMENT);
    const voice = { ...textChannel('v', [message('t', 'voice', '2024-01-01')]), type: ChannelType.GuildVoice };
    const broken = textChannel('b', [], 'cat', true);
    const result = await last(target, guildOf([null, skipped, dev, voice, broken]));
    expect(result.totalMessages).toBe(0);
  });

  it('truncates the list to fit a Discord message', async () => {
    const many = Array.from({ length: 100 }, (_, i) => message('t', 'x'.repeat(100), `2024-01-${String((i % 28) + 1).padStart(2, '0')}`));
    const result = await last(target, guildOf([textChannel('c1', many)]));
    expect(result.totalMessages).toBe(100);
    expect(result.messageCount).toBeLessThan(100);
    expect(result.messageList.length).toBeLessThan(1950);
  });
});
