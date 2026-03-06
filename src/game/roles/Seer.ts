import type { Role, Team, NightActionType } from './Role.js';

export class Seer implements Role {
  readonly id = 'seer';
  readonly name = '占い師';
  readonly team: Team = 'village';
  readonly nightActionType: NightActionType = 'inspect';

  canActAt(_dayNumber: number): boolean {
    // 毎晩占い可能（初日占いありルールを想定）
    return true;
  }
}