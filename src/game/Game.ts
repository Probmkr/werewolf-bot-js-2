
import { Game as GameData, GameSettings } from './models/Game.js';
import { Player } from './models/Player.js';
import { Role } from './roles/Role.js';

export class Game {
    public readonly id: string;
    public readonly guildId: string;
    public readonly channelId: string;
    public hostId: string;
    public players: Player[] = [];
    public phase: GameData['phase'] = 'lobby';
    public dayNumber = 0;
    public settings: GameSettings;

    constructor(id: string, guildId: string, channelId: string, hostId: string, settings?: GameSettings) {
        this.id = id;
        this.guildId = guildId;
        this.channelId = channelId;
        this.hostId = hostId;
        this.settings = settings || {
            roles: ['werewolf', 'villager', 'seer', 'medium', 'hunter', 'madman'],
            anonymousVote: false,
        };
    }
}
