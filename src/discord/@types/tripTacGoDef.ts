export interface TripTacGoGame {
  board: string[];
  capturedPieces: { O: number; X: number };
  currentPlayer: string;
  gameId: string;
  isGameOver: boolean;
  player1: string;
  player2: string;
  winner: null | string;
}

export interface TripTacGoMoveResult {
  errorMessage?: string;
  gameUpdated: TripTacGoGame;
  success: boolean;
}
