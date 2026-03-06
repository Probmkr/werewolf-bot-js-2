
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
    nightActions: any; // Define properly later
    voteResults: any; // Define properly later
    logs: string[];
}
