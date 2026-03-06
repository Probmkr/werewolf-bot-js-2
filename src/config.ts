import type { GameSettings } from './game/models/Game.js';

export const DEFAULT_GAME_SETTINGS: GameSettings = {
  roles: ['werewolf', 'villager', 'seer', 'medium', 'hunter', 'madman'],
  anonymousVote: false,
};