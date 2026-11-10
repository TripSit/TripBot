/* eslint-disable max-len, sonarjs/no-duplicate-string */
import axios from 'axios';
import { ActivityType } from 'discord.js';
import { dAdmin } from '../../commands/guild/d.admin';
import { lastReply, slashStub } from '../../../vitest/utils/commandStubs';
import { flushPromises } from '../../../vitest/utils/discordStubs';

const mocks = vi.hoisted(() => ({
  deploy: vi.fn(), user: vi.fn(), xp: vi.fn(), get: vi.fn(), post: vi.fn(), patch: vi.fn(),
}));

vi.mock('axios', () => ({ default: { get: mocks.get, post: mocks.post, patch: mocks.patch } }));
vi.mock('../../utils/context', () => ({ default: vi.fn(async () => 'ctx') }));
vi.mock('../../utils/commandDeploy', () => ({ default: mocks.deploy }));
vi.mock('../../../global/utils/dbRecords', () => ({ getOrCreateUser: mocks.user }));
vi.mock('../../../global/utils/experience', () => ({ findXPfromLevel: mocks.xp }));

const botlog = () => ({ send: vi.fn() });
const guildWith = (chan: unknown) => ({ id: 'g', channels: { cache: { get: vi.fn(() => chan) } } });
const content = (s: ReturnType<typeof slashStub>) => lastReply(s).content as string;

describe('admin', () => {
  it('requires a channel and guild', async () => {
    expect(await dAdmin.execute(slashStub({ channel: null }) as never)).toBe(false);
    expect(await dAdmin.execute(slashStub({ guild: null }) as never)).toBe(false);
  });

  it('rebuild triggers a Drone build and tolerates failures', async () => {
    const log1 = botlog();
    mocks.post.mockResolvedValueOnce({ data: {} });
    const stub = slashStub({ subcommand: 'rebuild', guild: guildWith(log1) });
    expect(await dAdmin.execute(stub as never)).toBe(true);
    await flushPromises();
    expect(log1.send).toHaveBeenCalled();
    expect(mocks.post).toHaveBeenCalledWith(expect.stringContaining('drone'), {}, expect.anything());
    mocks.post.mockRejectedValueOnce(new Error('403'));
    await dAdmin.execute(slashStub({ subcommand: 'rebuild', guild: guildWith(null) }) as never);
    await flushPromises();
  });

  it('deploy reports the command counts', async () => {
    mocks.deploy.mockResolvedValue({ globalCommands: [1, 2], guildCommands: [3] });
    const stub = slashStub({ subcommand: 'deploy', guild: guildWith(botlog()) });
    await dAdmin.execute(stub as never);
    expect(content(stub)).toContain('I deployed 3 commands');
  });

  it.each([
    ['playing', ActivityType.Playing], ['streaming', ActivityType.Streaming], ['listening', ActivityType.Listening],
    ['watching', ActivityType.Watching], ['competing', ActivityType.Competing], ['none', ActivityType.Playing], ['zzz', ActivityType.Playing],
  ])('setstatus %s', async (prefix, type) => {
    const setActivity = vi.fn();
    const stub = slashStub({ subcommand: 'setstatus', options: { prefix, status: 'hi' }, client: { user: { setActivity } } });
    await dAdmin.execute(stub as never);
    expect(setActivity).toHaveBeenCalledWith('hi', { type });
  });

  describe.each([['setavatar', 'avatar'], ['setbanner', 'banner']])('%s', (sub, noun) => {
    it('uploads the image', async () => {
      mocks.get.mockResolvedValue({ data: Buffer.from('img') });
      mocks.patch.mockResolvedValueOnce({});
      const stub = slashStub({ subcommand: sub, options: { url: 'https://img' }, client: { token: 'tok' } });
      await dAdmin.execute(stub as never);
      await flushPromises();
      expect(mocks.patch).toHaveBeenCalledWith('https://discord.com/api/v10/users/@me', expect.objectContaining({ [noun]: expect.stringContaining('data:image/jpeg;base64,') }), expect.anything());
      expect(stub.editReply).toHaveBeenCalledWith(expect.stringContaining('set successfully'));
    });
    it('reports upload errors', async () => {
      mocks.get.mockResolvedValue({ data: Buffer.from('img') });
      mocks.patch.mockRejectedValueOnce(new Error('nope'));
      const stub = slashStub({ subcommand: sub, options: { url: 'https://img' }, client: { token: 'tok' } });
      await dAdmin.execute(stub as never);
      await flushPromises();
      expect(stub.editReply).toHaveBeenCalledWith(expect.stringContaining('Error setting'));
    });
  });

  describe('overwriteuserdata', () => {
    const opts = {
      user: { id: 'target' }, category: 'GENERAL', type: 'TEXT', level: 5,
    };
    beforeEach(() => {
      mocks.user.mockResolvedValue({ id: 'db1' });
      mocks.xp.mockResolvedValue(1234);
    });

    it('validates input', async () => {
      const noUser = slashStub({ subcommand: 'overwriteuserdata', options: {} });
      await dAdmin.execute(noUser as never);
      expect(content(noUser)).toContain('User not found');
      const missing = slashStub({ subcommand: 'overwriteuserdata', options: { user: { id: 't' }, category: 'GENERAL' } });
      await dAdmin.execute(missing as never);
      expect(content(missing)).toContain('Missing category');
      db.user_experience.findFirst = vi.fn().mockResolvedValue(null) as never;
      const none = slashStub({ subcommand: 'overwriteuserdata', options: opts });
      await dAdmin.execute(none as never);
      expect(content(none)).toContain('No experience data');
    });

    it('updates level and points, surviving db errors', async () => {
      db.user_experience.findFirst = vi.fn().mockResolvedValue({ id: 'x' }) as never;
      db.user_experience.updateMany = vi.fn().mockResolvedValue({ count: 1 }) as never;
      const ok = slashStub({ subcommand: 'overwriteuserdata', options: opts });
      await dAdmin.execute(ok as never);
      expect(db.user_experience.updateMany).toHaveBeenCalledWith(expect.objectContaining({ data: { level: 5, level_points: 1234, total_points: 1234 } }));
      expect(content(ok)).toContain('to level 5 with 1234 points');
      db.user_experience.updateMany = vi.fn().mockRejectedValue(new Error('db')) as never;
      const bad = slashStub({ subcommand: 'overwriteuserdata', options: opts });
      expect(await dAdmin.execute(bad as never)).toBe(true);
    });
  });

  it('restart announces and signals the process (kill is stubbed)', async () => {
    const kill = vi.spyOn(process, 'kill').mockImplementation(() => true);
    const chan = botlog();
    const stub = slashStub({ subcommand: 'restart', guild: guildWith(chan) });
    await dAdmin.execute(stub as never);
    expect(kill).toHaveBeenCalledWith(process.pid, 'SIGTERM');
    expect(chan.send).toHaveBeenCalled();
    await dAdmin.execute(slashStub({ subcommand: 'restart', guild: guildWith(null) }) as never);
    kill.mockRestore();
  });

  it('unknown subcommands', async () => {
    const stub = slashStub({ subcommand: 'zzz' });
    expect(await dAdmin.execute(stub as never)).toBe(true);
    expect(content(stub)).toBe('Command not found');
    expect(axios).toBeDefined();
  });
});
