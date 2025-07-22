export interface MoveResult {
  errorMessage?: string;
  gameUpdated: TicTacToeGame;
  success: boolean;
}

export interface TicTacToeGame {
  board: string[];
  currentPlayer: string;
  gameId: string;
  isGameOver: boolean;
  player1: string;
  player2: string;
  winner: null | string;
}
