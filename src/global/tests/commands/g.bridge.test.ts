import {
  bridgeConfirm, bridgeCreate, bridgePause, bridgeRemove, bridgeResume,
} from '../../commands/g.bridge';
import { dbMock } from '../../../vitest/utils/mockDb';

type Bridge = Awaited<ReturnType<typeof dbMock.bridges.findFirst>>;
const existing = (status = 'ACTIVE') => ({ internal_channel: 'in', external_channel: 'out', status }) as Bridge;
const NO_BRIDGE = 'Error: Bridge does not exist!';
const key = { internal_channel_external_channel: { internal_channel: 'in', external_channel: 'out' } };

describe('bridgeCreate', () => {
  it('refuses to replace a pending bridge without override', async () => {
    dbMock.bridges.findFirst.mockResolvedValueOnce(existing('PENDING'));
    expect(await bridgeCreate('in', 'out', false)).toMatch(/already pending/);
    expect(dbMock.bridges.upsert).not.toHaveBeenCalled();
  });

  it.each([
    ['override set', existing('PENDING'), true],
    ['nothing existing', null, false],
  ])('creates a pending bridge when %s', async (_n, found, override) => {
    dbMock.bridges.findFirst.mockResolvedValueOnce(found);
    expect(await bridgeCreate('in', 'out', override)).toBe('Initialized bridge!');
    expect(dbMock.bridges.upsert).toHaveBeenCalledWith(expect.objectContaining({
      create: { internal_channel: 'in', external_channel: 'out', status: 'PENDING' },
    }));
  });
});

describe('bridgeConfirm', () => {
  it('errors when the bridge is unknown', async () => {
    dbMock.bridges.findFirst.mockResolvedValueOnce(null);
    expect(await bridgeConfirm('out')).toBe(NO_BRIDGE);
  });

  it('activates and returns the internal channel', async () => {
    dbMock.bridges.findFirst.mockResolvedValueOnce(existing('PENDING'));
    expect(await bridgeConfirm('out')).toBe('in');
    expect(dbMock.bridges.update).toHaveBeenCalledWith({ where: key, data: { status: 'ACTIVE' } });
  });
});

describe.each([
  ['bridgePause', bridgePause, 'Paused bridge', 'update', { status: 'PAUSED' }],
  ['bridgeResume', bridgeResume, 'Activated bridge', 'update', { status: 'ACTIVE' }],
  ['bridgeRemove', bridgeRemove, 'Removed bridge', 'delete', undefined],
] as const)('%s', (_name, fn, message, method, data) => {
  it('errors when neither side matches', async () => {
    dbMock.bridges.findFirst.mockResolvedValue(null);
    expect(await fn('x')).toBe(NO_BRIDGE);
  });

  it('finds the bridge by external channel', async () => {
    dbMock.bridges.findFirst.mockResolvedValueOnce(existing());
    expect(await fn('out')).toBe(message);
    expect(dbMock.bridges.findFirst).toHaveBeenCalledTimes(1);
    expect(dbMock.bridges[method]).toHaveBeenCalledWith(data ? { where: key, data } : { where: key });
  });

  it('falls back to the internal channel', async () => {
    dbMock.bridges.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce(existing());
    expect(await fn('in')).toBe(message);
    expect(dbMock.bridges.findFirst).toHaveBeenCalledTimes(2);
  });
});
