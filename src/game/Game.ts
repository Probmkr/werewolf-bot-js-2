
import { Game as GameData, GameSettings } from './models/Game.js';
import { Player } from './models/Player.js';
import { Role } from './roles/Role.js';
import { DEFAULT_GAME_SETTINGS } from '../config.js';
import { createRole } from './roles/index.js';

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
            ...DEFAULT_GAME_SETTINGS,
            roles: [...DEFAULT_GAME_SETTINGS.roles], // 配列は参照渡しになるためコピーを作成
        };
    }

    addPlayer(player: Player): void {
        if (this.phase !== 'lobby') {
            throw new Error('ゲームはすでに開始されています。');
        }
        if (this.players.some(p => p.id === player.id)) {
            throw new Error('すでに参加しています。');
        }
        this.players.push(player);
    }

    removePlayer(playerId: string): void {
        if (this.phase !== 'lobby') {
            throw new Error('ゲーム開始後は退出できません。');
        }
        this.players = this.players.filter(p => p.id !== playerId);
    }

    start(): void {
        if (this.phase !== 'lobby') {
            throw new Error('ロビーフェーズではありません。');
        }
        // 設定された役職数とプレイヤー数が一致するか確認
        if (this.players.length !== this.settings.roles.length) {
            throw new Error(`人数が合いません。参加者: ${this.players.length}人, 設定された役職: ${this.settings.roles.length}枠`);
        }

        this.assignRoles();
        this.phase = 'night'; // 夜フェーズへ
        this.dayNumber = 1;
    }

    private assignRoles(): void {
        const shuffledRoles = [...this.settings.roles];
        for (let i = shuffledRoles.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledRoles[i], shuffledRoles[j]] = [shuffledRoles[j], shuffledRoles[i]];
        }
        this.players.forEach((player, index) => {
            const roleId = shuffledRoles[index];
            player.role = createRole(roleId);
        });
    }
}
