import type { Message, TextChannel, User } from 'discord.js';
import {
  dbAddWatchRequest, dbDeleteWatchRequest, deleteWatchRequest, executeWatch, nightsWatch,
} from '../../commands/g.watchuser';
import { dbMock } from '../../../vitest/utils/mockDb';

type Found = Awaited<ReturnType<typeof dbMock.users.findUnique>>;
const userWith = (requests: object[]) => ({ id: 'uid', discord_id: 'target', watch_requests: requests }) as unknown as Found;
const req = (caller: string, method = 'dm', channel: string | null = null) => ({
  id: `r-${caller}`, caller_id: caller, notification_method: method, channel_id: channel, watched_user_id: 'target',
});

describe('dbAddWatchRequest', () => {
  it('creates the latest request for an existing user', async () => {
    dbMock.users.findUnique.mockResolvedValueOnce(userWith([]));
    await dbAddWatchRequest('target', [req('a'), req('b', 'channel', 'c1')]);
    expect(dbMock.watch_request.create).toHaveBeenCalledWith({
      data: {
        notification_method: 'channel', channel_id: 'c1', caller_id: 'b', watched_user_id: 'target', usersId: 'uid',
      },
    });
  });

  it('throws for unknown users', async () => {
    dbMock.users.findUnique.mockResolvedValueOnce(null);
    await expect(dbAddWatchRequest('x', [req('a')])).rejects.toThrow('not found');
  });
});

describe('dbDeleteWatchRequest', () => {
  it('deletes the caller\'s request', async () => {
    dbMock.users.findUnique.mockResolvedValueOnce(userWith([req('a')]));
    await dbDeleteWatchRequest('target', 'a');
    expect(dbMock.watch_request.delete).toHaveBeenCalledWith({ where: { id: 'r-a' } });
  });

  it.each([
    ['unknown user', null],
    ['no matching caller', userWith([req('other')])],
  ])('does nothing for %s', async (_n, found) => {
    dbMock.users.findUnique.mockResolvedValueOnce(found);
    await dbDeleteWatchRequest('target', 'a');
    expect(dbMock.watch_request.delete).not.toHaveBeenCalled();
  });
});

describe('deleteWatchRequest', () => {
  it('returns false for unknown users and missing callers', async () => {
    dbMock.users.findUnique.mockResolvedValueOnce(null);
    expect(await deleteWatchRequest('target', 'a')).toBe(false);
    dbMock.users.findUnique.mockResolvedValueOnce(userWith([req('other')]));
    expect(await deleteWatchRequest('target', 'a')).toBe(false);
  });

  it('deletes a matching request', async () => {
    dbMock.users.findUnique.mockImplementation((async () => userWith([req('a')])) as never);
    expect(await deleteWatchRequest('target', 'a')).toBe(true);
    expect(dbMock.watch_request.delete).toHaveBeenCalled();
  });
});

describe('executeWatch', () => {
  const target = { id: 'target' } as User;

  it('rejects unknown users and duplicates', async () => {
    dbMock.users.findUnique.mockResolvedValueOnce(null);
    expect(await executeWatch(target, 'dm', 'a')).toBe(false);
    dbMock.users.findUnique.mockResolvedValueOnce(userWith([req('a')]));
    expect(await executeWatch(target, 'dm', 'a')).toBe(false);
  });

  it('adds a new watch, recording the alert channel', async () => {
    dbMock.users.findUnique.mockResolvedValue(userWith([]));
    expect(await executeWatch(target, 'channel', 'a', { id: 'chan' } as TextChannel)).toBe(true);
    expect(dbMock.watch_request.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ channel_id: 'chan', caller_id: 'a' }),
    });
    expect(await executeWatch(target, 'dm', 'b')).toBe(true);
  });
});

describe('nightsWatch', () => {
  const flush = () => new Promise(resolve => { setImmediate(resolve); });

  function message(sendImpl: () => Promise<unknown> = async () => undefined) {
    const caller = { id: 'a', send: vi.fn(sendImpl) };
    const channelSend = vi.fn(sendImpl);
    const msg = {
      author: { id: 'target' },
      guild: {},
      channel: 'chan',
      client: {
        users: { fetch: vi.fn(async (id: string) => (id === 'a' ? caller : { id })) },
        guilds: { fetch: vi.fn(async () => ({ channels: { fetch: vi.fn(async () => ({ send: channelSend })) } })) },
      },
    } as unknown as Message;
    return { msg, caller, channelSend };
  }

  it('ignores unknown users, DMs without a guild, and empty watch lists', async () => {
    const { msg } = message();
    dbMock.users.findUnique.mockResolvedValueOnce(null);
    await nightsWatch(msg);
    dbMock.users.findUnique.mockResolvedValueOnce(userWith([]));
    await nightsWatch(msg);
    dbMock.users.findUnique.mockResolvedValueOnce(userWith([req('a')]));
    await nightsWatch({ ...msg, guild: null } as unknown as Message);
    expect(msg.client.users.fetch).not.toHaveBeenCalled();
  });

  it('notifies a DM watcher then clears the request', async () => {
    const { msg, caller } = message();
    dbMock.users.findUnique.mockImplementation((async () => userWith([req('a')])) as never);
    await nightsWatch(msg);
    await flush();
    expect(caller.send).toHaveBeenCalled();
    expect(dbMock.watch_request.delete).toHaveBeenCalledWith({ where: { id: 'r-a' } });
  });

  it('still clears the request when the DM fails', async () => {
    const { msg, caller } = message(async () => { throw new Error('closed DMs'); });
    dbMock.users.findUnique.mockImplementation((async () => userWith([req('a')])) as never);
    await nightsWatch(msg);
    await flush();
    expect(caller.send).toHaveBeenCalled();
    expect(dbMock.watch_request.delete).toHaveBeenCalled();
  });

  it('posts channel notifications, tolerating send failures', async () => {
    const ok = message();
    dbMock.users.findUnique.mockImplementation((async () => userWith([req('a', 'channel', 'c1')])) as never);
    await nightsWatch(ok.msg);
    await flush();
    expect(ok.channelSend).toHaveBeenCalled();

    const bad = message(async () => { throw new Error('no perms'); });
    await nightsWatch(bad.msg);
    await flush();
    expect(bad.channelSend).toHaveBeenCalled();
  });

  it('skips channel requests without a channel id', async () => {
    const { msg, channelSend } = message();
    dbMock.users.findUnique.mockResolvedValue(userWith([req('a', 'channel', null)]));
    await nightsWatch(msg);
    await flush();
    expect(channelSend).not.toHaveBeenCalled();
  });
});
