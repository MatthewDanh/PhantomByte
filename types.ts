export type GameState = 'start' | 'playing' | 'loading' | 'error' | 'minigame';
export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export interface DebugChallenge {
  description: string;
  buggyCode: string;
  correctCode: string;
}

export interface CodexEntry {
  title: string;
  content: string;
}

export interface Location {
  city: string;
  country: string;
}

export interface Scene {
  story: string;
  challengeType: 'word' | 'firewall' | 'debug';
  challengeWord: string;
  firewallChallenge?: string[];
  debugChallenge?: DebugChallenge;
  positiveOutcome: string;
  codexEntries?: CodexEntry[];
  location?: Location;
}

export interface TypingStats {
  wpm: number;
  accuracy: number;
}

export interface PlayerStats {
  rank: string;
  rankIndex: number;
  xp: number;
}

export interface StoryHistoryItem {
  text: string;
  source: 'mc' | 'player';
}

export interface BootMessage {
  text: string;
  status: 'pending' | 'ok' | 'fail';
}