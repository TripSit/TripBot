import { getPersonaInfo, setPersonaInfo } from '../../commands/g.rpg';
import { dbMock } from '../../../vitest/utils/mockDb';

type Row<T> = Awaited<T>;

describe('g.rpg', () => {
  it('getPersonaInfo upserts the user then the persona', async () => {
    dbMock.users.upsert.mockResolvedValueOnce({ id: 'u1' } as Row<ReturnType<typeof dbMock.users.upsert>>);
    dbMock.personas.upsert.mockResolvedValueOnce({ id: 'p1' } as Row<ReturnType<typeof dbMock.personas.upsert>>);

    const persona = await getPersonaInfo('123');
    expect(persona).toEqual({ id: 'p1' });
    expect(dbMock.personas.upsert).toHaveBeenCalledWith(expect.objectContaining({ where: { user_id: 'u1' } }));
  });

  it('setPersonaInfo upserts by persona id', async () => {
    const data = { id: 'p1', tokens: 5 } as unknown as Parameters<typeof setPersonaInfo>[0];
    dbMock.personas.upsert.mockResolvedValueOnce(data as Row<ReturnType<typeof dbMock.personas.upsert>>);
    await setPersonaInfo(data);
    expect(dbMock.personas.upsert).toHaveBeenCalledWith({ where: { id: 'p1' }, create: data, update: data });
  });
});
