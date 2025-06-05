export interface RPSGame {
  players: string[];
  choices: Map<string, string>;
  isActive: boolean;
  gameType: '1v1' | 'multiplayer';
  round: number;
  eliminatedPlayers: string[];
  scores?: { player1: number; player2: number }; // Add this line
}

export type GameResult = 'player1' | 'player2' | 'tie';

export type RoundResult = {
  choice: string;
  count: number;
  players: string[];
};

export type MultiplayerResult = {
  winner: string | null;
  eliminated: string[];
  remaining: string[];
  results: RoundResult[];
};

export const rpsChoices = {
  rock: { emoji: '🪨', name: 'Rock', beats: 'scissors' },
  paper: { emoji: '📄', name: 'Paper', beats: 'rock' },
  scissors: { emoji: '✂️', name: 'Scissors', beats: 'paper' },
};
