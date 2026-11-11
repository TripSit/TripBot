/* eslint-disable @typescript-eslint/no-explicit-any */
import { dbMock } from '../../../vitest/utils/mockDb';
import { slashStub } from '../../../vitest/utils/commandStubs';
import { dBridge } from '../../commands/global/d.bridge';
import { dPrivacy } from '../../commands/global/d.privacy';
import { dRss } from '../../commands/guild/d.rss';
import { dSheesh } from '../../commands/guild/d.sheesh';
import { dTripsitStats } from '../../commands/guild/d.tripsitstats';
import { birthday } from '../../../global/commands/g.birthday';
import { dramacounter } from '../../../global/commands/g.dramacounter';
import { botmod } from '../../../global/commands/g.botmod';

// The last `else if` of each dispatcher has no `else`: a subcommand/command it doesn't know must fall through
// without doing anything, rather than being treated as the last known one.
describe('dispatchers ignore unknown subcommands', () => {
  it.each([
    ['bridge', dBridge], ['privacy', dPrivacy], ['rss', dRss], ['sheesh', dSheesh], ['tripsitstats', dTripsitStats],
  ])('%s', async (_name, command) => {
    const stub = slashStub({ subcommand: 'bogus', guild: { id: env.DISCORD_GUILD_ID, name: 'Home' } });
    await (command as any).execute(stub).catch(() => undefined);
    expect(stub.options.getSubcommand).toHaveBeenCalled();
  });

  it('global birthday / dramacounter do nothing for unknown commands', async () => {
    await birthday('bogus' as never, 'u1', null as never).catch(() => undefined);
    await dramacounter('bogus' as never, 'g1', new Date(), 'x').catch(() => undefined);
    expect(db.users.update).not.toHaveBeenCalled();
    expect(db.discord_guilds.update).not.toHaveBeenCalled();
  });
});

describe('botmod', () => {
  it('leaves the ban flag alone for unknown user actions', async () => {
    dbMock.users.upsert.mockResolvedValue({ id: 'uid', discord_bot_ban: true } as never);
    dbMock.users.update.mockResolvedValue({ id: 'uid' } as never);
    const interaction = { client: { users: { fetch: vi.fn(async (id: string) => ({ id, tag: `${id}#1`, send: vi.fn() })) } } };
    await botmod(interaction as never, 'user', { displayName: 'Mod' } as never, 'BOTNOTE' as never, 't1', null, null).catch(() => undefined);
    expect(db.users.update).not.toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ discord_bot_ban: false }) }));
  });
});
