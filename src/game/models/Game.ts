
import { Player } from './Player.js';

export type GamePhase =
    | 'lobby'
    | 'roleAssign'
    | 'night'
    | 'morning'
    | 'discussion'
    | 'vote'
    | 'execution'
    | 'end';

export interface GameSettings {
    roles: string[];
    anonymousVote: boolean;
    debugMode: boolean;
    nightActionTimeoutMs: number;
    discussionTimeoutMs: number;
    voteTimeoutMs: number;
}

export interface NightActions {
  attack?: string;   // 人狼が選んだ襲撃対象の player ID
  inspect?: string;  // 占い師が選んだ占い対象の player ID
  guard?: string;    // 狩人が選んだ護衛対象の player ID
}

export interface Game {
    id: string;
    guildId: string;
    channelId: string;
    hostId: string;
    players: Player[];
    phase: GamePhase;
    dayNumber: number;
    settings: GameSettings;
    nightActions: NightActions;
    voteResults: any; // Define properly later
    logs: string[];
}
