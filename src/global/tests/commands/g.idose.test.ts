/* eslint-disable sonarjs/no-duplicate-string */
import { idose } from '../../commands/g.idose';
import { dbMock } from '../../../vitest/utils/mockDb';

type Upsert = Awaited<ReturnType<typeof dbMock.users.upsert>>;
type Doses = Awaited<ReturnType<typeof dbMock.user_drug_doses.findMany>>;
type Names = Awaited<ReturnType<typeof dbMock.drug_names.findMany>>;

const user = () => dbMock.users.upsert.mockResolvedValueOnce({ id: 'u' } as unknown as Upsert);
const dose = (id: string, at: string, extra: object = {}) => ({
  id, drug_id: `d-${id}`, route: 'ORAL', dose: 10, units: 'MG', created_at: new Date(at), ...extra,
});
const call = (command: 'get' | 'set' | 'delete', over: Partial<{
  record: number | null; substance: string | null; volume: number | null; units: string | null;
  roa: string | null; date: Date | null;
}> = {}) => idose(
  command,
  over.record ?? null,
  '1',
  'substance' in over ? over.substance! : 'LSD',
  'volume' in over ? over.volume! : 100,
  ('units' in over ? over.units : 'MICRO_G') as never,
  ('roa' in over ? over.roa : 'ORAL') as never,
  'date' in over ? over.date! : new Date('2024-01-01'),
);

describe('idose get', () => {
  it('reports no records', async () => {
    user();
    dbMock.user_drug_doses.findMany.mockResolvedValueOnce([]);
    expect((await call('get'))[0].value).toMatch(/no dose records/);
  });

  it('lists doses oldest first with drug names', async () => {
    user();
    dbMock.user_drug_doses.findMany.mockResolvedValueOnce([
      dose('b', '2024-02-01'), dose('a', '2024-01-01', { route: 'SUBLINGUAL' }), dose('c', '2024-01-01'),
    ] as unknown as Doses);
    dbMock.drug_names.findFirstOrThrow.mockResolvedValue({ name: 'LSD' } as never);
    const result = await call('get');
    expect(result).toHaveLength(3);
    expect(result[0].name).toMatch(/^\(0\)/);
    expect(result[0].value).toBe('10 MG of LSD Sublingual');
  });
});

describe('idose set', () => {
  it('requires every field and a date', async () => {
    expect((await call('set', { substance: null }))[0].value).toMatch(/must provide a substance/);
    expect((await call('set', { volume: null }))[0].value).toMatch(/must provide a substance/);
    expect((await call('set', { units: null }))[0].value).toMatch(/must provide a substance/);
    expect((await call('set', { roa: null }))[0].value).toMatch(/must provide a substance/);
    expect((await call('set', { date: null }))[0].value).toBe('You must provide a date!');
  });

  it('rejects unknown drugs', async () => {
    dbMock.drug_names.findMany.mockResolvedValueOnce([]);
    expect((await call('set'))[0].value).toBe('That drug does not exist!');
  });

  it('stores the dose, mapping µG to MICRO_G', async () => {
    dbMock.drug_names.findMany.mockResolvedValueOnce([{ drug_id: 'drug1' }] as unknown as Names);
    user();
    const result = await call('set', { units: 'µG' });
    expect(result[0].name).toBe('Success');
    expect(dbMock.user_drug_doses.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        user_id: 'u', drug_id: 'drug1', dose: 100, units: 'MICRO_G',
      }),
    });
  });

  it('passes other units through', async () => {
    dbMock.drug_names.findMany.mockResolvedValueOnce([{ drug_id: 'drug1' }] as unknown as Names);
    user();
    await call('set', { units: 'MG' });
    expect(dbMock.user_drug_doses.create).toHaveBeenCalledWith({ data: expect.objectContaining({ units: 'MG' }) });
  });
});

describe('idose delete', () => {
  it('requires a record number', async () => {
    expect((await call('delete'))[0].value).toMatch(/record number/);
  });

  it('reports no records and missing records', async () => {
    user();
    dbMock.user_drug_doses.findMany.mockResolvedValueOnce([]);
    expect((await call('delete', { record: 0 }))[0].value).toMatch(/no dose records/);
    user();
    dbMock.user_drug_doses.findMany.mockResolvedValueOnce([dose('a', '2024-01-01')] as unknown as Doses);
    expect((await call('delete', { record: 5 }))[0].value).toBe('That record does not exist!');
  });

  it('reports a missing drug name', async () => {
    user();
    dbMock.user_drug_doses.findMany.mockResolvedValueOnce([dose('a', '2024-01-01')] as unknown as Doses);
    dbMock.drug_names.findMany.mockResolvedValueOnce([]);
    expect((await call('delete', { record: 0 }))[0].value).toBe('That drug does not exist!');
  });

  it('deletes the chosen record in chronological order', async () => {
    user();
    dbMock.user_drug_doses.findMany.mockResolvedValueOnce([
      dose('late', '2024-02-01'), dose('early', '2024-01-01'),
    ] as unknown as Doses);
    dbMock.drug_names.findMany.mockResolvedValueOnce([{ name: 'LSD' }] as unknown as Names);
    const result = await call('delete', { record: 0 });
    expect(dbMock.user_drug_doses.delete).toHaveBeenCalledWith({ where: { id: 'early' } });
    expect(result[0].value).toContain('LSD Oral');
  });
});

describe('idose dispatch', () => {
  it('returns an empty response for unknown commands', async () => {
    expect(await call('bogus' as never)).toEqual({});
  });
});
