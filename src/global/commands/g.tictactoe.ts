import { MoveResult, TicTacToeGame } from '../../discord/@types/ticTacToeDef';

export function checkWinner(board: string[]): string | null {
  const winPatterns = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6], // Diagonals
  ];

  const winningPattern = winPatterns.find(pattern => {
    const [a, b, c] = pattern;
    return board[a] !== '⬜' && board[a] === board[b] && board[b] === board[c];
  });

  if (winningPattern) {
    const [a] = winningPattern;
    return board[a] === '❌' ? 'X' : 'O';
  }

  return null;
}

export function executeMove(
  game: TicTacToeGame,
  position: number,
  playerId: string,
): MoveResult {
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
  const updatedGame = {
    ...game,
    board: [...game.board], // Deep copy the board array
  };
  updatedGame.board[position] = updatedGame.currentPlayer === 'X' ? '❌' : '⭕';

  // Check for win or tie
  const winner = checkWinner(updatedGame.board);
  if (winner) {
    updatedGame.isGameOver = true;
    updatedGame.winner = winner;
  } else if (updatedGame.board.every((cell: string) => cell !== '⬜')) {
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

export function createInitialGame(player1Id: string, player2Id: string): TicTacToeGame {
  return {
    gameId: `${player1Id}-${player2Id}-${Date.now()}`,
    board: Array(9).fill('⬜'),
    currentPlayer: 'X',
    player1: player1Id,
    player2: player2Id,
    isGameOver: false,
    winner: null,
  };
}
