/* eslint-disable max-len */
import { dHR } from '../../commands/global/d.hr';
import { slashStub } from '../../../vitest/utils/commandStubs';

const mocks = vi.hoisted(() => ({
  breathe: vi.fn(),
  combochart: vi.fn(),
  crisis: vi.fn(),
  grounding: vi.fn(),
  guides: vi.fn(),
  narcan: vi.fn(),
  reagents: vi.fn(),
  recovery: vi.fn(),
  testkits: vi.fn(),
  warmline: vi.fn(),
  asset: vi.fn(),
}));

vi.mock('../../../global/commands/g.breathe', () => ({ breathe: mocks.breathe }));
vi.mock('../../../global/commands/g.combochart', () => ({ combochart: mocks.combochart }));
vi.mock('../../../global/commands/g.crisis', () => ({ crisis: mocks.crisis }));
vi.mock('../../../global/commands/g.grounding', () => ({ grounding: mocks.grounding }));
vi.mock('../../../global/commands/g.guides', () => ({ wikiGuides: mocks.guides }));
vi.mock('../../../global/commands/g.narcan', () => ({ default: mocks.narcan }));
vi.mock('../../../global/commands/g.reagents', () => ({ reagents: mocks.reagents }));
vi.mock('../../../global/commands/g.recovery', () => ({ recovery: mocks.recovery }));
vi.mock('../../../global/commands/g.testkits', () => ({ default: mocks.testkits }));
vi.mock('../../../global/commands/g.warmline', () => ({ warmline: mocks.warmline }));
vi.mock('../../utils/getAsset', () => ({ default: mocks.asset }));

const entries = [
  {
    name: 'A', country: 'US', website: 'https://a', webchat: 'https://w', phone: '1', text: '2', description: 'd',
  },
  { name: 'B' },
  { name: 'C', country: 'UK' },
  { name: 'D', country: 'CA', description: 'x' },
];

describe('hr', () => {
  beforeEach(() => {
    mocks.breathe.mockResolvedValue('breathe');
    mocks.combochart.mockResolvedValue('combo');
    mocks.grounding.mockResolvedValue('ground');
    mocks.recovery.mockResolvedValue('recover');
    mocks.reagents.mockResolvedValue('reagent');
    mocks.crisis.mockResolvedValue(entries);
    mocks.warmline.mockResolvedValue(entries);
    mocks.guides.mockResolvedValue(['Foo_Bar', 'Baz']);
    mocks.testkits.mockResolvedValue(entries);
    mocks.narcan.mockResolvedValue(entries);
    mocks.asset.mockResolvedValue(Buffer.from('x'));
  });

  it.each([
    ['combochart', 'combo'], ['breathe', 'breathe'], ['grounding', 'ground'], ['recovery', 'recover'], ['reagents', 'reagent'],
  ])('%s sends text content', async (subcommand, content) => {
    const stub = slashStub({ subcommand, options: { exercise: '1', ephemeral: true } });
    expect(await dHR.execute(stub as never)).toBe(true);
    expect(stub.editReply).toHaveBeenCalledWith({ content });
  });

  it.each(['crisis', 'guides', 'drug_checking', 'warmline', 'testkits', 'supplies', 'mushroom_info'])('%s sends an embed', async subcommand => {
    const stub = slashStub({ subcommand });
    expect(await dHR.execute(stub as never)).toBe(true);
    const arg = stub.editReply.mock.calls[0][0] as { embeds: unknown[] };
    expect(arg.embeds).toHaveLength(1);
  });

  it.each([
    'combochart', 'breathe', 'grounding', 'recovery', 'reagents', 'crisis', 'guides', 'drug_checking', 'warmline', 'testkits', 'supplies',
    'mushroom_info',
  ])('%s falls back to an ephemeral follow-up when edit fails', async subcommand => {
    const stub = slashStub({ subcommand });
    stub.editReply.mockRejectedValueOnce(new Error('too long'));
    expect(await dHR.execute(stub as never)).toBe(false);
    expect(stub.deleteReply).toHaveBeenCalled();
    expect(stub.followUp).toHaveBeenCalled();
  });

  it('rejects unknown subcommands', async () => {
    const stub = slashStub({ subcommand: 'zzz' });
    expect(await dHR.execute(stub as never)).toBe(false);
    expect(stub.editReply).toHaveBeenCalledWith('Unknown subcommand.');
  });
});
