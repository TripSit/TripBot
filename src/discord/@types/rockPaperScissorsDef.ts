export type GameResult = 'player1' | 'player2' | 'tie';

export interface MultiplayerResult {
  eliminated: string[];
  remaining: string[];
  results: RoundResult[];
  winner: null | string;
}

export interface RoundResult {
  choice: string;
  count: number;
  players: string[];
}

export interface RPSGame {
  choices: Map<string, string>;
  eliminatedPlayers: string[];
  gameId: string;
  gameType: '1v1' | 'multiplayer';
  isActive: boolean;
  players: string[];
  round: number;
  scores?: { player1: number; player2: number }; // Add this line
}

export const rpsChoices = {
  paper: { beats: 'rock', emoji: '📄', name: 'Paper' },
  rock: { beats: 'scissors', emoji: '🪨', name: 'Rock' },
  scissors: { beats: 'paper', emoji: '✂️', name: 'Scissors' },
};
