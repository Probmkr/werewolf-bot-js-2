import type { GameSettings } from './game/models/Game.js';

/** 夜行動の入力収集タイムアウト（ミリ秒） */
export const NIGHT_ACTION_TIMEOUT_MS = 3 * 60 * 1000; // 3分

/** 昼議論フェーズのタイムアウト（ミリ秒） */
export const DISCUSSION_TIMEOUT_MS = 5 * 60 * 1000; // 5分

/** 投票フェーズのタイムアウト（ミリ秒） */
export const VOTE_TIMEOUT_MS = 3 * 60 * 1000; // 3分

export const DEFAULT_GAME_SETTINGS: GameSettings = {
  roles: ['werewolf', 'villager', 'seer', 'medium', 'hunter', 'madman'],
  anonymousVote: false,
  debugMode: false,
  nightActionTimeoutMs: NIGHT_ACTION_TIMEOUT_MS,
  discussionTimeoutMs: DISCUSSION_TIMEOUT_MS,
  voteTimeoutMs: VOTE_TIMEOUT_MS,
};