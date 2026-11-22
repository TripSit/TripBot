import { awaitModal, MODAL_TIMEOUT_MS } from '../../utils/awaitModal';

type Waiter = Parameters<typeof awaitModal>[0];
const filter = () => true;

describe('awaitModal', () => {
  it('asks for a finite wait, so a dismissed modal does not leave a collector listening forever', async () => {
    const submit = { customId: 'x' };
    const awaitModalSubmit = vi.fn(async () => submit);
    const result = await awaitModal({ awaitModalSubmit } as unknown as Waiter, filter);
    expect(result).toBe(submit);
    expect(awaitModalSubmit).toHaveBeenCalledWith({ filter, time: MODAL_TIMEOUT_MS });
    expect(MODAL_TIMEOUT_MS).toBeGreaterThan(0);
  });

  it('never settles, and never rejects, when the modal times out', async () => {
    const awaitModalSubmit = vi.fn(async () => { throw new Error('Collector received no interactions before ending with reason: time'); });
    const unhandled = vi.fn();
    process.on('unhandledRejection', unhandled);
    try {
      let settled = false;
      awaitModal({ awaitModalSubmit } as unknown as Waiter, filter).then(() => { settled = true; }, () => { settled = true; });
      await new Promise(resolve => { setImmediate(resolve); });
      await new Promise(resolve => { setImmediate(resolve); });
      expect(settled).toBe(false);
      expect(unhandled).not.toHaveBeenCalled();
    } finally {
      process.off('unhandledRejection', unhandled);
    }
  });
});
