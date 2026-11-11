import { dbMock } from '../../../vitest/utils/mockDb';
import { syncDrugNames } from '../../utils/updateDb';

const mocks = vi.hoisted(() => ({ user: vi.fn() }));
vi.mock('../../utils/dbRecords', () => ({ getOrCreateUser: mocks.user }));

type Substance = Parameters<typeof syncDrugNames>[0][number];
const drug = (over: Record<string, unknown>) => ({ name: 'X', ...over }) as unknown as Substance;

describe('syncDrugNames', () => {
  beforeEach(() => {
    mocks.user.mockResolvedValue({ id: 'bot' });
    dbMock.drug_names.findMany.mockResolvedValue([{ name: ' Known ' }] as never);
  });

  it('does nothing when every drug is already known (case and whitespace insensitive)', async () => {
    await syncDrugNames([drug({ name: 'known' })]);
    expect(dbMock.drugs.create).not.toHaveBeenCalled();
    expect(mocks.user).not.toHaveBeenCalled();
  });

  it('adds missing drugs with new aliases only', async () => {
    await syncDrugNames([
      drug({
        name: ' Newdrug ', summary: ' sum ', url: ' https://wiki ', experiencesUrl: ' https://erowid ', aliases: ['Known', ' Nick ', 'nick', ''],
      }),
    ]);
    expect(dbMock.drugs.create).toHaveBeenCalledTimes(1);
    const { data } = dbMock.drugs.create.mock.calls[0][0] as { data: Record<string, any> }; // eslint-disable-line @typescript-eslint/no-explicit-any
    expect(data.summary).toBe('sum');
    expect(data.psychonaut_wiki_url).toBe('https://wiki');
    expect(data.errowid_experiences_url).toBe('https://erowid');
    expect(data.last_updated_by).toBe('bot');
    expect(data.drug_names.create).toEqual([
      { name: 'Newdrug', type: 'COMMON', is_default: true },
      { name: 'Nick', type: 'COMMON', is_default: false },
      { name: '', type: 'COMMON', is_default: false },
    ]);
  });

  it('handles drugs without optional fields and aliases that duplicate another new drug', async () => {
    await syncDrugNames([drug({ name: 'A' }), drug({ name: 'B2', aliases: ['A'] }), drug({ name: 'C', summary: '   ' })]);
    expect(dbMock.drugs.create).toHaveBeenCalledTimes(3);
    const second = (dbMock.drugs.create.mock.calls[1][0] as { data: { drug_names: { create: unknown[] } } }).data.drug_names.create;
    expect(second).toHaveLength(1);
    const first = (dbMock.drugs.create.mock.calls[0][0] as { data: Record<string, unknown> }).data;
    expect(first.summary).toBeNull();
    expect(first.psychonaut_wiki_url).toBeNull();
  });
});
