import { refundRpgItem } from '../../commands/g.rpgRefund';
import { dbMock } from '../../../vitest/utils/mockDb';

beforeEach(() => {
  // The interactive transaction runs against the same mocked client
  dbMock.$transaction.mockImplementation(async callback => {
    if (typeof callback !== 'function') throw new Error('Expected an interactive transaction');
    return callback(dbMock);
  });
  dbMock.personas.update.mockResolvedValue({} as never);
  dbMock.rpg_inventory.deleteMany.mockResolvedValue({ count: 0 });
});

describe('refundRpgItem', () => {
  it('refunds every owner the item price and removes the item from all inventories', async () => {
    dbMock.rpg_inventory.findMany.mockResolvedValue([
      { persona_id: 'p1', cost: 500 }, { persona_id: 'p2', cost: 500 }, { persona_id: 'p3', cost: 250 },
    ] as never);
    expect(await refundRpgItem('OldFont')).toEqual({ owners: 3, tokens: 1250 });
    expect(dbMock.rpg_inventory.findMany).toHaveBeenCalledWith({ where: { value: 'OldFont' } });
    expect(dbMock.personas.update).toHaveBeenCalledWith({ where: { id: 'p1' }, data: { tokens: { increment: 500 } } });
    expect(dbMock.personas.update).toHaveBeenCalledWith({ where: { id: 'p3' }, data: { tokens: { increment: 250 } } });
    expect(dbMock.rpg_inventory.deleteMany).toHaveBeenCalledWith({ where: { value: 'OldFont' } });
  });

  it('does nothing when nobody owns it', async () => {
    dbMock.rpg_inventory.findMany.mockResolvedValue([] as never);
    expect(await refundRpgItem('Nothing')).toEqual({ owners: 0, tokens: 0 });
    expect(dbMock.personas.update).not.toHaveBeenCalled();
  });

  it('keeps the items when a credit fails', async () => {
    dbMock.rpg_inventory.findMany.mockResolvedValue([{ persona_id: 'p1', cost: 5 }] as never);
    dbMock.personas.update.mockRejectedValue(new Error('db down'));
    await expect(refundRpgItem('OldFont')).rejects.toThrow('db down');
    expect(dbMock.rpg_inventory.deleteMany).not.toHaveBeenCalled();
  });
});
