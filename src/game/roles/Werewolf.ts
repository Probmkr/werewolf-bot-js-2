import type { Role, Team, NightActionType } from './Role.js';

export class Werewolf implements Role {
  readonly id = 'werewolf';
  readonly name = '人狼';
  readonly team: Team = 'wolf';
  readonly nightActionType: NightActionType = 'attack';

  canActAt(_dayNumber: number): boolean {
    // 毎晩襲撃可能（初日襲撃ありルールを想定）
    return true;
  }
}