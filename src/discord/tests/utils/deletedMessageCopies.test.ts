import { removeDeletedMessageCopies } from '../../utils/deletedMessageCopies';
import { dbMock } from '../../../vitest/utils/mockDb';

const mocks = vi.hoisted(() => ({ deleteBestOf: vi.fn(), deleteChannelMessages: vi.fn() }));
vi.mock('../../utils/privacyDeletion', () => ({
  deleteBestOfMessages: mocks.deleteBestOf,
  deleteChannelMessages: mocks.deleteChannelMessages,
}));

const URL = 'https://discord.com/channels/g/c/m1';
const message = { id: 'm1' } as never;

beforeEach(() => {
  mocks.deleteBestOf.mockReset().mockResolvedValue(undefined);
  mocks.deleteChannelMessages.mockReset().mockResolvedValue(undefined);
  dbMock.best_of.findUnique.mockResolvedValue(null);
  dbMock.quotes.findMany.mockResolvedValue([]);
});

describe('removeDeletedMessageCopies', () => {
  it('does nothing for a message TripBot never copied', async () => {
    await removeDeletedMessageCopies(message);
    expect(mocks.deleteBestOf).not.toHaveBeenCalled();
    expect(mocks.deleteChannelMessages).not.toHaveBeenCalled();
    expect(dbMock.quotes.findMany).toHaveBeenCalledWith({
      where: { url: { endsWith: '/m1' } }, select: { id: true, url: true },
    });
  });

  it('deletes the Best Of copy before its record', async () => {
    dbMock.best_of.findUnique.mockResolvedValue({ message_id: 'm1' } as never);
    await removeDeletedMessageCopies(message);
    expect(mocks.deleteBestOf).toHaveBeenCalledWith(['m1']);
    expect(dbMock.best_of.delete).toHaveBeenCalledWith({ where: { message_id: 'm1' } });
    expect(mocks.deleteBestOf.mock.invocationCallOrder[0])
      .toBeLessThan(dbMock.best_of.delete.mock.invocationCallOrder[0]);
  });

  it('deletes saved quotes and their quote-log posts', async () => {
    dbMock.quotes.findMany.mockResolvedValue([{ id: 'q1', url: URL }] as never);
    await removeDeletedMessageCopies(message);
    expect(mocks.deleteChannelMessages).toHaveBeenCalledWith(env.CHANNEL_QUOTE_LOG, expect.any(Function));
    const matches = mocks.deleteChannelMessages.mock.calls[0][1] as (m: unknown) => boolean;
    expect(matches({ embeds: [{ description: `> quote\n- ${URL}` }] })).toBe(true);
    expect(matches({ embeds: [{ description: 'another quote' }] })).toBe(false);
    expect(matches({})).toBe(false);
    expect(dbMock.quotes.deleteMany).toHaveBeenCalledWith({ where: { id: { in: ['q1'] } } });
  });

  it('keeps records whose Discord copies could not be removed, and still handles the other kind', async () => {
    vi.spyOn(global.log, 'error').mockReturnValue(undefined as never);
    dbMock.best_of.findUnique.mockResolvedValue({ message_id: 'm1' } as never);
    dbMock.quotes.findMany.mockResolvedValue([{ id: 'q1', url: URL }] as never);
    mocks.deleteBestOf.mockRejectedValue(new Error('Best Of channel is not available'));
    mocks.deleteChannelMessages.mockRejectedValue(new Error('Missing Access'));
    await removeDeletedMessageCopies(message);
    expect(dbMock.best_of.delete).not.toHaveBeenCalled();
    expect(dbMock.quotes.deleteMany).not.toHaveBeenCalled();
    expect(mocks.deleteChannelMessages).toHaveBeenCalled();
    expect(global.log.error).toHaveBeenCalledTimes(2);
  });
});
