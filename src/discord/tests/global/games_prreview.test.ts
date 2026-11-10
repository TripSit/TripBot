/* eslint-disable sonarjs/no-duplicate-string, no-restricted-syntax, no-await-in-loop, @typescript-eslint/no-loop-func, no-promise-executor-return, max-len */
import { EventEmitter } from 'events';
import { dTicTacToe } from '../../commands/global/d.tictactoe';
import { dTripTacGo } from '../../commands/global/d.triptacgo';
import { notifyPrOpened, prReviewButton } from '../../commands/global/d.prReview';
import { slashStub, resolvingModal, pendingModal } from '../../../vitest/utils/commandStubs';

const mocks = vi.hoisted(() => ({
  ttt: vi.fn(), ttgInit: vi.fn(), ttgMove: vi.fn(), tttInit: vi.fn(), mergePr: vi.fn(), reject: vi.fn(),
}));

vi.mock('../../../global/commands/g.tictactoe', () => ({ createInitialGame: mocks.tttInit, executeMove: mocks.ttt }));
vi.mock('../../../global/commands/g.triptacgo', () => ({ createInitialGame: mocks.ttgInit, executeMove: mocks.ttgMove }));
vi.mock('../../../global/commands/g.prReview', () => ({ mergePr: mocks.mergePr, postPrRejectionComment: mocks.reject }));

const newGame = (size: number, extra = {}) => ({
  gameId: 'G1',
  board: Array(size).fill('⬜'),
  player1: 'u1',
  player2: 'u2',
  currentPlayer: 'X',
  isGameOver: false,
  winner: null,
  capturedPieces: { X: 0, O: 0 },
  ...extra,
});

type Collector = EventEmitter & { stop: ReturnType<typeof vi.fn> };
const makeCollector = (): Collector => Object.assign(new EventEmitter(), { stop: vi.fn() });

describe.each([
  ['tictactoe', dTicTacToe, mocks.tttInit, mocks.ttt, 9],
  ['triptacgo', dTripTacGo, mocks.ttgInit, mocks.ttgMove, 16],
])('%s', (_name, cmd, init, move, size) => {
  const opponent = { id: 'u2', username: 'bob', bot: false };
  const setup = (opp = opponent) => {
    const collector = makeCollector();
    const channel = { createMessageComponentCollector: vi.fn(() => collector) };
    const stub = slashStub({ options: { opponent: opp }, channel });
    return { stub, collector, channel };
  };
  beforeEach(() => { init.mockReset(); move.mockReset(); init.mockReturnValue(newGame(size)); });

  it('rejects self, bots', async () => {
    const self = setup({ ...opponent, id: 'u1' });
    expect(await cmd.execute(self.stub as never)).toBe(false);
    const bot = setup({ ...opponent, bot: true });
    expect(await cmd.execute(bot.stub as never)).toBe(false);
    expect(bot.stub.reply).toHaveBeenCalledWith(expect.objectContaining({ content: expect.stringContaining('bot') }));
  });

  it('fails without a channel collector', async () => {
    const stub = slashStub({ options: { opponent }, channel: null });
    expect(await cmd.execute(stub as never)).toBe(false);
    expect(stub.editReply).toHaveBeenCalled();
  });

  it('plays moves through to a win, ignoring foreign buttons', async () => {
    const { stub, collector } = setup();
    expect(await cmd.execute(stub as never)).toBe(true);
    expect(stub.reply).toHaveBeenCalledTimes(1);

    const button = (id: string) => ({
      customId: id, user: { id: 'u2', username: 'bob' }, update: vi.fn(), reply: vi.fn(),
    });
    move.mockReturnValue({ success: true, gameUpdated: newGame(size, { currentPlayer: 'O' }) });
    const foreign = button('x_OTHER_1');
    await collector.emit('collect', foreign);
    await vi.waitFor(() => expect(move).toHaveBeenCalled());
    expect(foreign.update).not.toHaveBeenCalled();

    const ok = button('x_G1_1');
    collector.emit('collect', ok);
    await vi.waitFor(() => expect(ok.update).toHaveBeenCalled());

    for (const winner of ['X', 'O', 'tie']) {
      move.mockReturnValue({ success: true, gameUpdated: newGame(size, { isGameOver: true, winner }) });
      const b = button('x_G1_2');
      collector.emit('collect', b);
      await vi.waitFor(() => expect(b.update).toHaveBeenCalled());
      expect(collector.stop).toHaveBeenCalled();
      // game state is replaced; rebuild for next loop turn
      move.mockReturnValue({ success: true, gameUpdated: newGame(size) });
    }
  });

  it('reports an illegal move (tictactoe) and handles timeouts', async () => {
    const { stub, collector } = setup();
    await cmd.execute(stub as never);
    move.mockReturnValue({ success: false, errorMessage: 'nope', gameUpdated: newGame(size) });
    const b = {
      customId: 'x_G1_1', user: { id: 'u2', username: 'bob' }, update: vi.fn(), reply: vi.fn(),
    };
    collector.emit('collect', b);
    await vi.waitFor(() => expect(move).toHaveBeenCalled());
    await new Promise(r => { setTimeout(r, 5); });
    collector.emit('end');
    await vi.waitFor(() => expect(stub.editReply).toHaveBeenCalledWith(expect.objectContaining({ components: [] })));
  });
});

describe('prReview', () => {
  const pr = {
    number: 5, title: 'T', body: '', url: 'https://x', author: 'a', testsPassed: 1, testsTotal: 2, checksPassed: false, checksSummary: 'lint',
  };

  it('notifies the dev channel', async () => {
    const send = vi.fn();
    const guild = { channels: { fetch: vi.fn(async () => ({ send, name: 'dev' })) }, roles: { fetch: vi.fn(async () => 'ROLE') } };
    (global as unknown as Record<string, unknown>).discordClient = { guilds: { fetch: vi.fn(async () => guild) } };
    await notifyPrOpened(pr);
    expect(send.mock.calls[0][0].content).toContain('failed');
    await notifyPrOpened({ ...pr, checksPassed: true, body: 'desc' });
    expect(send).toHaveBeenCalledTimes(2);
  });

  const click = (action: string, cp: boolean, hasRole = true, over: Record<string, unknown> = {}) => ({
    customId: `"ID":"PR","T":"${action}","N":"5","CP":"${cp}"`,
    id: 'i1',
    user: { tag: 'a#0', id: 'u1' },
    guild: { id: 'g' },
    member: { displayName: 'Dev', roles: { cache: { has: () => hasRole } } },
    message: { content: 'msg', embeds: [{ data: { title: 'x' } }], edit: vi.fn() },
    reply: vi.fn(),
    deferUpdate: vi.fn(),
    followUp: vi.fn(),
    editReply: vi.fn(),
    showModal: vi.fn(),
    awaitModalSubmit: vi.fn(pendingModal()),
    ...over,
  });

  beforeEach(() => { mocks.mergePr.mockReset(); mocks.reject.mockReset(); });

  it('ignores DMs and rejects non-devs', async () => {
    await prReviewButton(click('ACCEPT', true, true, { guild: null }) as never);
    const i = click('ACCEPT', true, false);
    await prReviewButton(i as never);
    expect(i.reply).toHaveBeenCalledWith(expect.objectContaining({ content: expect.stringContaining('permission') }));
  });

  it('merges on accept, reports failures', async () => {
    const ok = click('ACCEPT', true);
    await prReviewButton(ok as never);
    expect(mocks.mergePr).toHaveBeenCalledWith(5, 'Dev');
    expect(ok.editReply).toHaveBeenCalled();
    mocks.mergePr.mockRejectedValueOnce(new Error('conflict'));
    const bad = click('ACCEPT', true);
    await prReviewButton(bad as never);
    expect(bad.followUp).toHaveBeenCalledWith(expect.objectContaining({ content: expect.stringContaining('conflict') }));
    mocks.mergePr.mockRejectedValueOnce('str');
    const bad2 = click('ACCEPT', true, true, { message: { content: '', embeds: [], edit: vi.fn() } });
    await prReviewButton(bad2 as never);
    expect(bad2.followUp).toHaveBeenCalled();
  });

  const modal = (id: string, field: string, text: string, member = { displayName: 'M' }) => ({
    customId: id, member, deferReply: vi.fn(), editReply: vi.fn(), fields: { getTextInputValue: vi.fn(() => text) }, field,
  });

  it('accept with failing checks requires a justification modal', async () => {
    const i = click('ACCEPT', false);
    const m = modal('"ID":"PR","T":"ACCEPTOVERRIDE","N":"5","II":"i1"', 'reason', 'because');
    i.awaitModalSubmit.mockImplementationOnce(resolvingModal(m as never));
    await prReviewButton(i as never);
    expect(i.showModal).toHaveBeenCalled();
    await vi.waitFor(() => expect(m.editReply).toHaveBeenCalledWith({ content: expect.stringContaining('Merged') }));
    expect(i.message.edit).toHaveBeenCalled();

    // merge failure inside the modal
    mocks.mergePr.mockRejectedValueOnce(new Error('boom'));
    const i2 = click('ACCEPT', false);
    const m2 = modal('"ID":"PR","T":"ACCEPTOVERRIDE","N":"5","II":"i1"', 'reason', 'r');
    i2.awaitModalSubmit.mockImplementationOnce(resolvingModal(m2 as never));
    await prReviewButton(i2 as never);
    await vi.waitFor(() => expect(m2.editReply).toHaveBeenCalledWith({ content: expect.stringContaining('boom') }));

    // different interaction id and rejected await are both swallowed
    const i3 = click('ACCEPT', false);
    const m3 = modal('"ID":"PR","T":"ACCEPTOVERRIDE","N":"5","II":"other"', 'reason', 'r');
    i3.awaitModalSubmit.mockImplementationOnce(resolvingModal(m3 as never));
    await prReviewButton(i3 as never);
    const i4 = click('ACCEPT', false, true, { awaitModalSubmit: vi.fn().mockRejectedValue(new Error('timeout')) });
    await prReviewButton(i4 as never);
    await new Promise(r => { setTimeout(r, 5); });
    expect(m3.deferReply).not.toHaveBeenCalled();
  });

  it('reject posts the comment, handling failure', async () => {
    const i = click('REJECT', true);
    const m = modal('"ID":"PR","T":"REJECTMODAL","N":"5","II":"i1"', 'comment', 'no');
    i.awaitModalSubmit.mockImplementationOnce(resolvingModal(m as never));
    await prReviewButton(i as never);
    await vi.waitFor(() => expect(m.editReply).toHaveBeenCalledWith({ content: expect.stringContaining('Posted') }));
    expect(mocks.reject).toHaveBeenCalledWith(5, 'M', 'no');

    mocks.reject.mockRejectedValueOnce(new Error('x'));
    const i2 = click('REJECT', true);
    const m2 = modal('"ID":"PR","T":"REJECTMODAL","N":"5","II":"i1"', 'comment', 'no');
    i2.awaitModalSubmit.mockImplementationOnce(resolvingModal(m2 as never));
    await prReviewButton(i2 as never);
    await vi.waitFor(() => expect(m2.editReply).toHaveBeenCalledWith({ content: expect.stringContaining('Failed') }));

    const i3 = click('REJECT', true, true, { awaitModalSubmit: vi.fn().mockRejectedValue(new Error('t')) });
    await prReviewButton(i3 as never);
    const i4 = click('REJECT', true);
    const m4 = modal('"ID":"PR","T":"REJECTMODAL","N":"5","II":"zzz"', 'comment', 'no');
    i4.awaitModalSubmit.mockImplementationOnce(resolvingModal(m4 as never));
    await prReviewButton(i4 as never);
    await new Promise(r => { setTimeout(r, 5); });
    expect(m4.deferReply).not.toHaveBeenCalled();
  });
});
