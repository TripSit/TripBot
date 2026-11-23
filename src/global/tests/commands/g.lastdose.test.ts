import lastDose from '../../commands/g.lastdose';
import { dbMock } from '../../../vitest/utils/mockDb';

const dose = {
  id: 'saved-dose',
  user_id: 'own-user',
  drug_id: 'example-drug',
  dose: 0.5,
  units: 'MG' as const,
  route: 'ORAL' as const,
  created_at: new Date('2024-01-01T00:00:00Z'),
  drugs: { drug_names: [{ name: 'Example substance' }] },
};

beforeEach(() => {
  dbMock.users.findUnique.mockResolvedValue({ id: 'own-user' } as never);
});

it('does not create a profile or query doses for an unknown caller', async () => {
  dbMock.users.findUnique.mockResolvedValue(null);
  expect(await lastDose('caller')).toBeNull();
  expect(dbMock.user_drug_doses.findFirst).not.toHaveBeenCalled();
  expect(dbMock.users.upsert).not.toHaveBeenCalled();
});

it('returns no record when the caller has no saved doses', async () => {
  dbMock.user_drug_doses.findFirst.mockResolvedValue(null);
  expect(await lastDose('caller')).toBeNull();
});

it('selects only the caller’s latest saved dose with a deterministic tie break', async () => {
  dbMock.user_drug_doses.findFirst.mockResolvedValue(dose);
  expect(await lastDose('caller')).toEqual({
    amount: 0.5,
    units: 'MG',
    route: 'ORAL',
    takenAt: dose.created_at,
    substance: 'Example substance',
  });
  expect(dbMock.users.findUnique).toHaveBeenCalledWith({
    where: { discord_id: 'caller' }, select: { id: true },
  });
  expect(dbMock.user_drug_doses.findFirst).toHaveBeenCalledWith({
    where: { user_id: 'own-user' },
    orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
    select: {
      dose: true,
      units: true,
      route: true,
      created_at: true,
      drugs: {
        select: {
          drug_names: {
            where: { is_default: true },
            orderBy: { name: 'asc' },
            take: 1,
            select: { name: true },
          },
        },
      },
    },
  });
  expect(dbMock.user_drug_doses.findMany).not.toHaveBeenCalled();
  expect(dbMock.user_drug_doses.create).not.toHaveBeenCalled();
});

it('keeps the dose visible when its default substance name is missing', async () => {
  const unnamed = { ...dose, drugs: { drug_names: [] } };
  dbMock.user_drug_doses.findFirst.mockResolvedValue(unnamed);
  expect(await lastDose('caller')).toMatchObject({ substance: 'Unknown substance', amount: 0.5 });
});

it('propagates a database failure instead of reporting no saved records', async () => {
  dbMock.user_drug_doses.findFirst.mockRejectedValue(new Error('database unavailable'));
  await expect(lastDose('caller')).rejects.toThrow('database unavailable');
});
