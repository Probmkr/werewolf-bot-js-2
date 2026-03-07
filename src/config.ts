import type { GameSettings } from './game/models/Game.js';

/** 夜行動の入力収集タイムアウト（ミリ秒） */
export const NIGHT_ACTION_TIMEOUT_MS = 3 * 60 * 1000; // 3分

export const DEFAULT_GAME_SETTINGS: GameSettings = {
  roles: ['werewolf', 'villager', 'seer', 'medium', 'hunter', 'madman'],
  anonymousVote: false,
  debugMode: false,
  nightActionTimeoutMs: NIGHT_ACTION_TIMEOUT_MS,
};