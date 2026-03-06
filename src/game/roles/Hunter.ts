import type { Role, Team, NightActionType } from './Role.js';

export class Hunter implements Role {
  readonly id = 'hunter';
  readonly name = '狩人';
  readonly team: Team = 'village';
  readonly nightActionType: NightActionType = 'guard';

  canActAt(_dayNumber: number): boolean {
    // 毎晩護衛可能（初日護衛ありルールを想定）
    return true;
  }
}