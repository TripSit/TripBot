import { DiscordAPIError, RESTJSONErrorCodes } from 'discord.js';
import { restoreRolesForDeletedTicket } from '../../utils/tripsitme';
import { dbMock } from '../../../vitest/utils/mockDb';

const role = (id: string, name = `role-${id}`, cmp = -1) => ({ id, name, comparePositionTo: () => cmp });
const ticket = { id: 't1', user_id: 'uid', thread_id: 'th' };

function setup(opts: { memberFetch?: 'ok' | 'unknown' | 'error' } = {}) {
  const target = {
    id: 'discord1', displayName: 'Target', guild: { id: 'g1' }, roles: { add: vi.fn(), remove: vi.fn() },
  };
  const roles = new Map([['nh', role('nh', 'needshelp')], ['r1', role('r1')]]);
  const guild = {
    id: 'g1',
    name: 'Guild',
    client: { user: { id: 'bot' } },
    members: {
      fetch: vi.fn(async (id: string) => {
        if (id === 'bot') return { roles: { highest: { comparePositionTo: () => 0 } } };
        if (opts.memberFetch === 'unknown') {
          throw new DiscordAPIError(
            { message: 'Unknown Member', code: RESTJSONErrorCodes.UnknownMember },
            RESTJSONErrorCodes.UnknownMember,
            404,
            'GET',
            '',
            {},
          );
        }
        if (opts.memberFetch === 'error') throw new Error('boom');
        return target;
      }),
    },
    roles: { fetch: vi.fn(async (id: string) => roles.get(id) ?? null) },
  };
  return { guild: guild as never, target };
}

beforeEach(() => {
  dbMock.discord_guilds.upsert.mockResolvedValue({ id: 'g1', role_needshelp: 'nh' } as never);
});

describe('restoreRolesForDeletedTicket', () => {
  it('removes needshelp, restores saved roles, and clears the snapshot', async () => {
    dbMock.users.upsert.mockResolvedValue({ id: 'uid', discord_id: 'discord1', roles: 'r1,nh' } as never);
    const { guild, target } = setup();
    await restoreRolesForDeletedTicket(guild, ticket as never);
    expect(target.roles.remove).toHaveBeenCalledWith(expect.objectContaining({ id: 'nh' }));
    expect(target.roles.add).toHaveBeenCalledTimes(1);
    expect(target.roles.add).toHaveBeenCalledWith(expect.objectContaining({ id: 'r1' }));
    expect(dbMock.users.update).toHaveBeenCalledWith({ where: { id: 'uid' }, data: { roles: null } });
  });

  it('skips the snapshot update when none was saved', async () => {
    dbMock.users.upsert.mockResolvedValue({ id: 'uid', discord_id: 'discord1', roles: null } as never);
    const { guild, target } = setup();
    await restoreRolesForDeletedTicket(guild, ticket as never);
    expect(target.roles.remove).toHaveBeenCalled();
    expect(dbMock.users.update).not.toHaveBeenCalled();
  });

  it('does nothing for users without a Discord id', async () => {
    dbMock.users.upsert.mockResolvedValue({ id: 'uid', discord_id: null, roles: 'r1' } as never);
    const { guild, target } = setup();
    await restoreRolesForDeletedTicket(guild, ticket as never);
    expect(target.roles.remove).not.toHaveBeenCalled();
  });

  it('drops the snapshot when the member left the guild', async () => {
    dbMock.users.upsert.mockResolvedValue({ id: 'uid', discord_id: 'discord1', roles: 'r1' } as never);
    const { guild, target } = setup({ memberFetch: 'unknown' });
    await restoreRolesForDeletedTicket(guild, ticket as never);
    expect(target.roles.add).not.toHaveBeenCalled();
    expect(dbMock.users.update).toHaveBeenCalledWith({ where: { id: 'uid' }, data: { roles: null } });
  });

  it('leaves the snapshot alone when the member left and none was saved', async () => {
    dbMock.users.upsert.mockResolvedValue({ id: 'uid', discord_id: 'discord1', roles: null } as never);
    await restoreRolesForDeletedTicket(setup({ memberFetch: 'unknown' }).guild, ticket as never);
    expect(dbMock.users.update).not.toHaveBeenCalled();
  });

  it('keeps the snapshot when the member lookup fails for another reason', async () => {
    dbMock.users.upsert.mockResolvedValue({ id: 'uid', discord_id: 'discord1', roles: 'r1' } as never);
    const { guild, target } = setup({ memberFetch: 'error' });
    await restoreRolesForDeletedTicket(guild, ticket as never);
    expect(target.roles.add).not.toHaveBeenCalled();
    expect(dbMock.users.update).not.toHaveBeenCalled();
  });
});
