import { getOrCreateGuild, getOrCreatePersona, getOrCreateUser } from '../../utils/dbRecords';
import { dbMock } from '../../../vitest/utils/mockDb';

describe('dbRecords', () => {
  it('getOrCreateUser upserts by discord id', async () => {
    await getOrCreateUser('1');
    expect(dbMock.users.upsert).toHaveBeenCalledWith({
      where: { discord_id: '1' }, create: { discord_id: '1' }, update: {},
    });
  });

  it('getOrCreateGuild upserts by guild id', async () => {
    await getOrCreateGuild('g');
    expect(dbMock.discord_guilds.upsert).toHaveBeenCalledWith({ where: { id: 'g' }, create: { id: 'g' }, update: {} });
  });

  it('getOrCreatePersona upserts by user id', async () => {
    await getOrCreatePersona('u');
    expect(dbMock.personas.upsert).toHaveBeenCalledWith({
      where: { user_id: 'u' }, create: { user_id: 'u' }, update: {},
    });
  });
});
