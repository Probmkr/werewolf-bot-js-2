
import { randomUUID } from 'node:crypto';
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

  constructor(guildId: string, channelId: string, hostId: string, settings?: GameSettings) {
    this.id = randomUUID();
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
    if (this.players.length >= this.maxPlayers) {
      throw new Error(`参加者が上限に達しています。(最大 ${this.maxPlayers}人)`);
    }
    this.players.push(player);
  }

  removePlayer(playerId: string): void {
    if (this.phase !== 'lobby') {
      throw new Error('ゲーム開始後は退出できません。');
    }
    this.players = this.players.filter(p => p.id !== playerId);
  }

  get maxPlayers(): number {
    return this.settings.roles.length;
  }

  start(): void {
    if (this.phase !== 'lobby') {
      throw new Error('ロビーフェーズではありません。');
    }
    if (this.players.length < 3) {
      throw new Error(`参加者が少なすぎます。最低3人必要です。(現在 ${this.players.length}人)`);
    }
    if (this.players.length > this.maxPlayers) {
      throw new Error(`参加者が多すぎます。最大${this.maxPlayers}人まで。(現在 ${this.players.length}人)`);
    }

    this.assignRoles();
    this.phase = 'night';
    this.dayNumber = 1;
  }

  private assignRoles(): void {
    const shuffledRoles = [...this.settings.roles];
    for (let i = shuffledRoles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledRoles[i], shuffledRoles[j]] = [shuffledRoles[j], shuffledRoles[i]];
    }
    // 参加者数分だけ役職を先頭から使用する
    this.players.forEach((player, index) => {
      player.role = createRole(shuffledRoles[index]);
    });
  }
}
