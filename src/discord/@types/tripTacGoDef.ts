export interface TripTacGoGame {
  board: string[];
  currentPlayer: string;
  player1: string;
  player2: string;
  isGameOver: boolean;
  winner: string | null;
  capturedPieces: { X: number; O: number };
}

export type TripTacGoMoveResult = {
  success: boolean;
  errorMessage?: string;
  gameUpdated: TripTacGoGame;
};
