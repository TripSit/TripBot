export interface TicTacToeGame {
  board: string[];
  currentPlayer: string;
  player1: string;
  player2: string;
  isGameOver: boolean;
  winner: string | null;
}

export type MoveResult = {
  success: boolean;
  errorMessage?: string;
  gameUpdated: TicTacToeGame;
};
