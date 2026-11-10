import {
  checkWinner, createInitialGame, executeMove,
} from '../../commands/g.tictactoe';
import * as ttg from '../../commands/g.triptacgo';

const E = '⬜';
const X = '❌';
const O = '⭕';

describe('tictactoe', () => {
  it('creates an empty board with X to move', () => {
    const game = createInitialGame('a', 'b');
    expect(game.board).toEqual(Array(9).fill(E));
    expect(game).toMatchObject({
      currentPlayer: 'X', player1: 'a', player2: 'b', isGameOver: false, winner: null,
    });
  });

  it('detects winners on rows, columns and diagonals', () => {
    expect(checkWinner([X, X, X, E, E, E, E, E, E])).toBe('X');
    expect(checkWinner([O, E, E, O, E, E, O, E, E])).toBe('O');
    expect(checkWinner([X, E, E, E, X, E, E, E, X])).toBe('X');
    expect(checkWinner([E, E, O, E, O, E, O, E, E])).toBe('O');
    expect(checkWinner(Array(9).fill(E))).toBeNull();
  });

  it('validates moves', () => {
    const game = createInitialGame('a', 'b');
    expect(executeMove({ ...game, isGameOver: true }, 0, 'a').errorMessage).toMatch(/already ended/);
    expect(executeMove(game, 0, 'b').errorMessage).toMatch(/not your turn/);
    const taken = { ...game, board: [X, ...Array(8).fill(E)] };
    expect(executeMove(taken, 0, 'a').errorMessage).toMatch(/already taken/);
  });

  it('plays a move and switches players without mutating the input', () => {
    const game = createInitialGame('a', 'b');
    const result = executeMove(game, 4, 'a');
    expect(result.success).toBe(true);
    expect(result.gameUpdated.board[4]).toBe(X);
    expect(result.gameUpdated.currentPlayer).toBe('O');
    expect(game.board[4]).toBe(E);
  });

  it('ends the game on a win', () => {
    const game = { ...createInitialGame('a', 'b'), board: [X, X, E, O, O, E, E, E, E] };
    const result = executeMove(game, 2, 'a');
    expect(result.gameUpdated).toMatchObject({ isGameOver: true, winner: 'X' });
  });

  it('ends the game in a tie', () => {
    const game = {
      ...createInitialGame('a', 'b'),
      currentPlayer: 'O',
      board: [X, O, X, X, O, O, O, X, E],
    } as ReturnType<typeof createInitialGame>;
    const result = executeMove(game, 8, 'b');
    expect(result.gameUpdated).toMatchObject({ isGameOver: true, winner: 'tie' });
  });
});

describe('triptacgo', () => {
  it('creates a 4x4 board', () => {
    const game = ttg.createInitialGame('a', 'b');
    expect(game.board).toHaveLength(16);
    expect(game.capturedPieces).toEqual({ X: 0, O: 0 });
  });

  it('captures an opponent piece sandwiched between two of ours', () => {
    const board = Array(16).fill(E);
    board[1] = O; // opponent between 0 and 2
    board[2] = X;
    expect(ttg.checkCaptures(board, 0, X)).toEqual([1]);
  });

  it('ignores patterns that run off the board', () => {
    const board = Array(16).fill(E);
    board[3] = X;
    expect(ttg.checkCaptures(board, 3, X)).toEqual([]);
  });

  it('declares winners by capture count', () => {
    const board = Array(16).fill(E);
    expect(ttg.checkWinner(board, { X: 3, O: 0 })).toBe('X');
    expect(ttg.checkWinner(board, { X: 0, O: 2 })).toBe('O');
    expect(ttg.checkWinner(board, { X: 2, O: 1 })).toBeNull();
  });

  it('validates moves', () => {
    const game = ttg.createInitialGame('a', 'b');
    expect(ttg.executeMove({ ...game, isGameOver: true }, 0, 'a').errorMessage).toMatch(/already ended/);
    expect(ttg.executeMove(game, 0, 'b').errorMessage).toMatch(/not your turn/);
    const taken = { ...game, board: [X, ...Array(15).fill(E)] };
    expect(ttg.executeMove(taken, 0, 'a').errorMessage).toMatch(/already taken/);
  });

  it('removes captured pieces, increments the count, and wins at three', () => {
    const board = Array(16).fill(E);
    board[1] = O;
    board[2] = X;
    const game = { ...ttg.createInitialGame('a', 'b'), board, capturedPieces: { X: 2, O: 0 } };
    const result = ttg.executeMove(game, 0, 'a');
    expect(result.gameUpdated.board[1]).toBe(E);
    expect(result.gameUpdated.capturedPieces.X).toBe(3);
    expect(result.gameUpdated).toMatchObject({ isGameOver: true, winner: 'X' });
  });

  it('switches players when nothing decisive happens', () => {
    const game = ttg.createInitialGame('a', 'b');
    const result = ttg.executeMove(game, 5, 'a');
    expect(result.gameUpdated.currentPlayer).toBe('O');
    expect(result.gameUpdated.isGameOver).toBe(false);
  });

  it('ends in a tie when the board fills without a winner', () => {
    const board = Array(16).fill(X);
    board[15] = E;
    const game = { ...ttg.createInitialGame('a', 'b'), board };
    const result = ttg.executeMove(game, 15, 'a');
    expect(result.gameUpdated).toMatchObject({ isGameOver: true, winner: 'tie' });
  });
});
