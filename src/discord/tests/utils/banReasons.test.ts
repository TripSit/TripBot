import {
  applyBanReason, BAN_REASON_SELECT_ID, BAN_REASONS, findBanReason, selectedBanReason,
} from '../../utils/banReasons';

const modalWith = (getStringSelectValues: (id: string) => string[]) => ({ fields: { getStringSelectValues } }) as never;

describe('banReasons', () => {
  it('has unique values and an option that fits a Discord select', () => {
    expect(new Set(BAN_REASONS.map(reason => reason.value)).size).toBe(BAN_REASONS.length);
    BAN_REASONS.forEach(reason => {
      expect(reason.label.length).toBeLessThanOrEqual(100);
      expect(reason.message.length).toBeLessThanOrEqual(1000);
    });
    expect(BAN_REASONS.length).toBeLessThanOrEqual(25);
  });

  it('finds a reason by value', () => {
    expect(findBanReason('evasion')?.label).toBe('Ban evasion');
    expect(findBanReason('nope')).toBeUndefined();
    expect(findBanReason(undefined)).toBeUndefined();
  });

  it('reads the picked reason from the modal', () => {
    const getValues = vi.fn(() => ['sourcing']);
    expect(selectedBanReason(modalWith(getValues))?.value).toBe('sourcing');
    expect(getValues).toHaveBeenCalledWith(BAN_REASON_SELECT_ID);
    expect(selectedBanReason(modalWith(() => []))).toBeUndefined();
  });

  it('behaves as before when the modal has no picker', () => {
    const throwing = modalWith(() => { throw new Error('no such component'); });
    expect(selectedBanReason(throwing)).toBeUndefined();
    expect(applyBanReason(undefined, 'note', 'msg')).toEqual({ internalNote: 'note', description: 'msg' });
  });

  it('tags the note and fills only a blank message', () => {
    const reason = findBanReason('evasion');
    const filled = applyBanReason(reason, 'alt of X', '  ');
    expect(filled.internalNote).toBe('[Ban evasion] alt of X');
    expect(filled.description).toBe(reason?.message);
    expect(applyBanReason(reason, 'alt of X', 'my own words').description).toBe('my own words');
    expect(applyBanReason(reason, 'x'.repeat(1000), '').internalNote).toHaveLength(1000);
  });
});
