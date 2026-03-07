
import { randomUUID } from 'node:crypto';
import { Game as GameData, GameSettings, NightActions } from './models/Game.js';
import { Player } from './models/Player.js';
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
  public nightActions: NightActions = {};
  public nightActionTimeout?: ReturnType<typeof setTimeout>;

  constructor(guildId: string, channelId: string, hostId: string, settings?: GameSettings) {
    this.id = randomUUID();
    this.guildId = guildId;
    this.channelId = channelId;
    this.hostId = hostId;
    this.settings = settings || {
      ...DEFAULT_GAME_SETTINGS,
      roles: [...DEFAULT_GAME_SETTINGS.roles],
    };
  }

  get maxPlayers(): number {
    return this.settings.roles.length;
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

    // 設定された役職に含まれるチーム数 <= 参加者数 であることを確認
    const teamCount = new Set(this.settings.roles.map(id => createRole(id).team)).size;
    if (this.players.length < teamCount) {
      throw new Error(`参加者数(${this.players.length}人)が必要なチーム数(${teamCount})より少ないため開始できません。`);
    }

    this.assignRoles();
    this.phase = 'night';
    this.dayNumber = 1;
  }

  private assignRoles(): void {
    const n = this.players.length;

    // チーム別にグループ化
    const byTeam = new Map<string, string[]>();
    for (const roleId of this.settings.roles) {
      const team = createRole(roleId).team;
      if (!byTeam.has(team)) byTeam.set(team, []);
      byTeam.get(team)!.push(roleId);
    }

    // 各チームからランダムに1枚を必須枠として確保し、残りをプールへ
    const guaranteed: string[] = [];
    const pool: string[] = [];
    for (const roles of byTeam.values()) {
      const shuffled = this.shuffle(roles);
      guaranteed.push(shuffled[0]);
      pool.push(...shuffled.slice(1));
    }

    // 残りスロットをプールから補充し、全体を再シャッフルして割り当て
    const optional = this.shuffle(pool).slice(0, n - guaranteed.length);
    const finalRoles = this.shuffle([...guaranteed, ...optional]);

    this.players.forEach((player, index) => {
      player.role = createRole(finalRoles[index]);
    });
  }

  /** 夜フェーズ中に行動者が対象を選択して送信する */
  submitNightAction(actorId: string, actionType: 'attack' | 'inspect' | 'guard', targetId: string): void {
    if (this.phase !== 'night') throw new Error('夜フェーズではありません。');

    const actor = this.players.find(p => p.id === actorId);
    if (!actor?.isAlive) throw new Error('あなたは行動できません。');
    if (!actor.role) throw new Error('役職が割り当てられていません。');
    if (actor.role.nightActionType !== actionType) throw new Error('この行動はあなたの役職では使用できません。');
    if (!actor.role.canActAt(this.dayNumber)) throw new Error('今夜は行動できません。');

    const target = this.players.find(p => p.id === targetId);
    if (!target?.isAlive) throw new Error('対象のプレイヤーは存在しないか、すでに死亡しています。');
    if (targetId === actorId) throw new Error('自分自身を対象にすることはできません。');

    this.nightActions[actionType] = targetId;
  }

  /** 今夜行動が必要なすべてのアクションが揃っているか確認する */
  hasAllNightActions(): boolean {
    const alive = this.players.filter(p => p.isAlive);
    const needsAttack = alive.some(p => p.role?.nightActionType === 'attack');
    const needsInspect = alive.some(p => p.role?.nightActionType === 'inspect' && p.role.canActAt(this.dayNumber));
    const needsGuard = alive.some(p => p.role?.nightActionType === 'guard' && p.role.canActAt(this.dayNumber));

    if (needsAttack && !this.nightActions.attack) return false;
    if (needsInspect && !this.nightActions.inspect) return false;
    if (needsGuard && !this.nightActions.guard) return false;
    return true;
  }

  private shuffle<T>(arr: T[]): T[] {
    const result = [...arr];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
}
