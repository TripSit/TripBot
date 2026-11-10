/* eslint-disable max-len, sonarjs/no-duplicate-string */
import { EventEmitter } from 'events';
import { dRockPaperScissors } from '../../commands/global/d.rockpaperscissors';
import { slashStub } from '../../../vitest/utils/commandStubs';

type Collector = EventEmitter & { stop: ReturnType<typeof vi.fn> };
const makeCollector = (): Collector => {
  const c = new EventEmitter() as Collector;
  c.stop = vi.fn(() => { c.emit('end'); });
  return c;
};

const flush = async (ms = 0) => { await vi.advanceTimersByTimeAsync(ms); };
const press = (customId: string, userId: string) => ({
  customId, user: { id: userId, username: userId }, deferUpdate: vi.fn(), reply: vi.fn(),
});
const embedOf = (call: unknown[]) => ((call[0] as { embeds?: Array<{ data: { title: string; description: string } }> }).embeds ?? [])[0]?.data;

const user = (id: string, bot = false) => ({ id, username: id, bot });

describe('rock paper scissors', () => {
  beforeEach(() => { vi.useFakeTimers({ toFake: ['setTimeout', 'setInterval', 'clearInterval', 'Date'] }); });
  afterEach(() => { vi.useRealTimers(); });

  describe('1v1', () => {
    const start = async () => {
      const collector = makeCollector();
      const channel = { createMessageComponentCollector: vi.fn(() => collector) };
      const stub = slashStub({ channel, options: { opponent: user('u2') } });
      await dRockPaperScissors.execute(stub as never);
      const id = (stub.reply.mock.calls[0][0] as { components: Array<{ components: Array<{ data: { custom_id: string } }> }> }).components[0].components[0].data.custom_id;
      const gameId = id.split('_')[1];
      const choose = async (who: string, choice: string) => { collector.emit('collect', press(`rps_${gameId}_${choice}`, who)); await flush(); };
      return {
        stub, collector, choose, gameId,
      };
    };

    it('rejects yourself and bots', async () => {
      const self = slashStub({ options: { opponent: user('u1') } });
      await dRockPaperScissors.execute(self as never);
      expect(self.reply).toHaveBeenCalledWith(expect.objectContaining({ content: expect.stringContaining('yourself') }));
      const bot = slashStub({ options: { opponent: user('b', true) } });
      await dRockPaperScissors.execute(bot as never);
      expect(bot.reply).toHaveBeenCalledWith(expect.objectContaining({ content: expect.stringContaining('bot') }));
    });

    it('needs a channel collector', async () => {
      const stub = slashStub({ channel: null, options: { opponent: user('u2') } });
      await dRockPaperScissors.execute(stub as never);
      expect(stub.editReply).toHaveBeenCalledWith(expect.objectContaining({ content: expect.stringContaining('added to the server') }));
    });

    it('plays a best-of-three to completion', async () => {
      const {
        stub, collector, choose, gameId,
      } = await start();
      collector.emit('collect', press('rps_other_rock', 'u1'));
      await flush();
      expect(stub.editReply).not.toHaveBeenCalled();

      await choose('u1', 'rock'); // waiting on opponent
      expect(embedOf(stub.editReply.mock.calls.at(-1) as never).description).toContain('Ready');
      await choose('u1', 'paper'); // changing a choice is not "new"
      await choose('u2', 'rock'); // paper vs rock -> p1 wins
      expect(embedOf(stub.editReply.mock.calls.at(-1) as never).title).toBe('⚔️ Round Results!');
      await flush(3000);
      expect(embedOf(stub.editReply.mock.calls.at(-1) as never).title).toBe('⚔️ Round 2');

      await choose('u1', 'rock');
      await choose('u2', 'rock'); // tie
      expect(embedOf(stub.editReply.mock.calls.at(-2) as never)?.title ?? '').toBeTruthy();
      await flush(3000);

      await choose('u1', 'rock');
      await choose('u2', 'paper'); // p2 wins
      await flush(3000);
      await choose('u1', 'scissors');
      await choose('u2', 'paper'); // p1 wins: 2-1
      await flush(2000);
      expect(embedOf(stub.editReply.mock.calls.at(-1) as never).title).toBe('🏆 Match Complete!');
      expect(collector.stop).toHaveBeenCalled();
      expect(gameId).toBeTruthy();
    });

    it('ignores clicks after the game ends and times out inactive games', async () => {
      const { stub, collector } = await start();
      collector.emit('end');
      await flush();
      expect(embedOf(stub.editReply.mock.calls.at(-1) as never).title).toBe('⏰ Game Timeout');
      stub.editReply.mockRejectedValueOnce(new Error('gone'));
      const again = await start();
      again.stub.editReply.mockRejectedValueOnce(new Error('gone'));
      again.collector.emit('end');
      await flush();
    });

    it('stops when the status update fails', async () => {
      const { stub, collector, choose } = await start();
      stub.editReply.mockRejectedValueOnce(new Error('deleted'));
      await choose('u1', 'rock');
      expect(collector.stop).toHaveBeenCalled();
    });

    it('survives failing follow-up edits', async () => {
      const { stub, choose } = await start();
      await choose('u1', 'rock');
      await choose('u2', 'paper');
      stub.editReply.mockRejectedValue(new Error('gone'));
      await flush(3000);
      await choose('u1', 'rock');
    });
  });

  describe('multiplayer', () => {
    const setup = async () => {
      const queue = makeCollector();
      const rounds: Collector[] = [];
      const channel = {
        createMessageComponentCollector: vi.fn(() => {
          if (!rounds.length && !(channel as { used?: boolean }).used) { (channel as { used?: boolean }).used = true; return queue; }
          const next = makeCollector();
          rounds.push(next);
          return next;
        }),
      };
      const stub = slashStub({ channel });
      await dRockPaperScissors.execute(stub as never);
      const joinId = (stub.reply.mock.calls[0][0] as { components: Array<{ components: Array<{ data: { custom_id: string } }> }> }).components[0].components[0].data.custom_id;
      const gameId = joinId.split('_')[1];
      const join = async (who: string) => { const p = press(joinId, who); queue.emit('collect', p); await flush(); return p; };
      return {
        stub, queue, rounds, join, gameId, channel,
      };
    };

    it('needs a guild when no opponent is given', async () => {
      const stub = slashStub({ guild: null });
      expect(await dRockPaperScissors.execute(stub as never)).toBe(false);
    });

    it('needs a channel collector', async () => {
      const stub = slashStub({ channel: null });
      await dRockPaperScissors.execute(stub as never);
      expect(stub.editReply).toHaveBeenCalledWith(expect.objectContaining({ content: expect.stringContaining('queue collector') }));
    });

    it('tracks joins, duplicates and a full queue, and fails with too few players', async () => {
      const { stub, queue, join } = await setup();
      await join('p1');
      const dup = await join('p1');
      expect(dup.reply).toHaveBeenCalledWith(expect.objectContaining({ content: expect.stringContaining('already') }));
      for (let i = 2; i <= 10; i += 1) await join(`p${i}`); // eslint-disable-line no-await-in-loop
      const full = await join('late');
      expect(full.reply).toHaveBeenCalledWith(expect.objectContaining({ content: expect.stringContaining('full') }));
      await flush(5000);
      expect(embedOf(stub.editReply.mock.calls.at(-1) as never).description).toContain('Time left to join');
      stub.editReply.mockRejectedValueOnce(new Error('gone'));
      await flush(5000);
      expect(queue.stop).toHaveBeenCalled();
    });

    it('reports not enough players', async () => {
      const { stub, queue, join } = await setup();
      await join('p1');
      queue.emit('end');
      await flush();
      expect(embedOf(stub.editReply.mock.calls.at(-1) as never).title).toBe('❌ Not Enough Players');
      const second = await setup();
      second.stub.editReply.mockRejectedValue(new Error('gone'));
      second.queue.emit('end');
      await flush();
    });

    const startGame = async (players: string[]) => {
      const ctx = await setup();
      for (const p of players) await ctx.join(p); // eslint-disable-line no-await-in-loop, no-restricted-syntax
      ctx.queue.emit('end');
      await flush();
      return ctx;
    };
    const choose = async (round: Collector, gameId: string, who: string, choice: string) => {
      round.emit('collect', press(`rps_${gameId}_${choice}`, who));
      await flush();
    };

    it('eliminates the losing choice each round until someone wins', async () => {
      const { stub, rounds, gameId } = await startGame(['a', 'b', 'c']);
      expect(rounds).toHaveLength(1);
      await choose(rounds[0], gameId, 'a', 'rock');
      expect(embedOf(stub.editReply.mock.calls.at(-1) as never).description).toContain('Ready');
      await choose(rounds[0], gameId, 'a', 'paper'); // duplicate choice ignored
      await choose(rounds[0], gameId, 'outsider', 'rock'); // not a player
      await choose(rounds[0], gameId, 'b', 'rock');
      await choose(rounds[0], gameId, 'c', 'scissors'); // rock+scissors -> scissors eliminated
      expect(embedOf(stub.editReply.mock.calls.at(-1) as never).description).toContain('Advancing to next round');
      await flush(3000);
      expect(rounds).toHaveLength(2);
      await choose(rounds[1], gameId, 'a', 'rock');
      await choose(rounds[1], gameId, 'b', 'paper'); // 2 players: paper wins
      expect(embedOf(stub.editReply.mock.calls.at(-1) as never).description).toContain('WINNER');
    });

    it('handles the other three-way outcomes and all-same rounds', async () => {
      const mixed = await startGame(['a', 'b', 'c']);
      await choose(mixed.rounds[0], mixed.gameId, 'a', 'rock');
      await choose(mixed.rounds[0], mixed.gameId, 'b', 'paper');
      await choose(mixed.rounds[0], mixed.gameId, 'c', 'scissors'); // all three: rock eliminated
      expect(embedOf(mixed.stub.editReply.mock.calls.at(-1) as never).description).toContain('Eliminated');
      const same = await startGame(['a', 'b', 'c']);
      for (const who of ['a', 'b', 'c']) await choose(same.rounds[0], same.gameId, who, 'paper'); // eslint-disable-line no-await-in-loop, no-restricted-syntax
      expect(embedOf(same.stub.editReply.mock.calls.at(-1) as never).description).toContain('Paper');
      const pr = await startGame(['a', 'b', 'c']);
      await choose(pr.rounds[0], pr.gameId, 'a', 'paper');
      await choose(pr.rounds[0], pr.gameId, 'b', 'paper');
      await choose(pr.rounds[0], pr.gameId, 'c', 'rock'); // paper+rock -> rock eliminated
      const sp = await startGame(['a', 'b', 'c']);
      await choose(sp.rounds[0], sp.gameId, 'a', 'scissors');
      await choose(sp.rounds[0], sp.gameId, 'b', 'scissors');
      await choose(sp.rounds[0], sp.gameId, 'c', 'paper'); // scissors+paper -> paper eliminated
      expect(embedOf(sp.stub.editReply.mock.calls.at(-1) as never).description).toContain('Eliminated');
    });

    it('eliminates players who do not choose, ending the game when one remains', async () => {
      const { stub, rounds, gameId } = await startGame(['a', 'b']);
      await choose(rounds[0], gameId, 'a', 'rock');
      rounds[0].emit('end'); // b never picked
      await flush();
      expect(embedOf(stub.editReply.mock.calls.at(-1) as never).title).toBe('🏆 Game Over!');
      const none = await startGame(['a', 'b']);
      none.rounds[0].emit('end');
      await flush();
      expect(embedOf(none.stub.editReply.mock.calls.at(-1) as never).description).toContain('No winner');
    });

    it('tolerates deleted messages mid-game', async () => {
      const { stub, rounds, gameId } = await startGame(['a', 'b', 'c']);
      stub.editReply.mockRejectedValueOnce(new Error('gone'));
      await choose(rounds[0], gameId, 'a', 'rock');
      expect(rounds[0].stop).toHaveBeenCalled();
      const second = await startGame(['a', 'b']);
      await choose(second.rounds[0], second.gameId, 'a', 'rock');
      second.stub.editReply.mockRejectedValue(new Error('gone'));
      await choose(second.rounds[0], second.gameId, 'b', 'rock');
      await flush(3000);
    });
  });
});
