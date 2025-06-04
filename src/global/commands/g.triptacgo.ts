import { TripTacGoGame, TripTacGoMoveResult } from '../../discord/@types/tripTacGoDef';

export function checkCaptures(board: string[], position: number, playerSymbol: string): number[] {
  const captures: number[] = [];
  const opponentSymbol = playerSymbol === '❌' ? '⭕' : '❌';

  // Check all 8 directions from the newly placed piece
  const directions = [
    [-1, 0], [1, 0], // left, right
    [0, -1], [0, 1], // up, down
    [-1, -1], [1, 1], // diagonal up-left, down-right
    [-1, 1], [1, -1], // diagonal up-right, down-left
  ];

  const row = Math.floor(position / 4);
  const col = position % 4;

  directions.forEach(direction => {
    // Check exactly 2 positions away in this direction
    const pos1Row = row + direction[0];
    const pos1Col = col + direction[1];
    const pos2Row = row + (direction[0] * 2);
    const pos2Col = col + (direction[1] * 2);

    // Make sure both positions are within bounds
    if (pos1Row >= 0 && pos1Row < 4 && pos1Col >= 0 && pos1Col < 4
        && pos2Row >= 0 && pos2Row < 4 && pos2Col >= 0 && pos2Col < 4) {
      const pos1 = pos1Row * 4 + pos1Col;
      const pos2 = pos2Row * 4 + pos2Col;

      // Check if pattern is: Our piece - Opponent piece - Our piece
      if (board[pos1] === opponentSymbol && board[pos2] === playerSymbol) {
        captures.push(pos1);
      }
    }
  });

  return captures;
}

export function checkWinner(board: string[], captures: { X: number; O: number }): string | null {
  // Check capture win conditions (X needs 3, O needs 2)
  if (captures.X >= 3) return 'X';
  if (captures.O >= 2) return 'O';

  return null;
}

export function executeMove(
  game: TripTacGoGame,
  position: number,
  playerId: string,
): TripTacGoMoveResult {
  // Validate move
  if (game.isGameOver) {
    return {
      success: false,
      errorMessage: 'This game has already ended!',
      gameUpdated: game,
    };
  }

  const currentPlayerId = game.currentPlayer === 'X' ? game.player1 : game.player2;

  if (playerId !== currentPlayerId) {
    return {
      success: false,
      errorMessage: 'It\'s not your turn!',
      gameUpdated: game,
    };
  }

  if (game.board[position] !== '⬜') {
    return {
      success: false,
      errorMessage: 'That position is already taken!',
      gameUpdated: game,
    };
  }

  // Execute the move
  const updatedGame = { ...game };
  const symbol = updatedGame.currentPlayer === 'X' ? '❌' : '⭕';
  updatedGame.board[position] = symbol;

  // Check for captures
  const captures = checkCaptures(updatedGame.board, position, symbol);
  captures.forEach(capturePos => {
    updatedGame.board[capturePos] = '⬜';
    updatedGame.capturedPieces[updatedGame.currentPlayer as 'X' | 'O'] += 1;
  });

  // Check for win conditions
  const winner = checkWinner(updatedGame.board, updatedGame.capturedPieces);
  if (winner) {
    updatedGame.isGameOver = true;
    updatedGame.winner = winner;
  } else if (updatedGame.board.every(cell => cell !== '⬜')) {
    updatedGame.isGameOver = true;
    updatedGame.winner = 'tie';
  } else {
    // Switch players
    updatedGame.currentPlayer = updatedGame.currentPlayer === 'X' ? 'O' : 'X';
  }

  return {
    success: true,
    gameUpdated: updatedGame,
  };
}

export function createInitialGame(player1Id: string, player2Id: string): TripTacGoGame {
  return {
    board: Array(16).fill('⬜'),
    currentPlayer: 'X',
    player1: player1Id,
    player2: player2Id,
    isGameOver: false,
    winner: null,
    capturedPieces: { X: 0, O: 0 },
  };
}
