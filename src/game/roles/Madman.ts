import type { Role, Team, NightActionType } from './Role.js';

export class Madman implements Role {
  readonly id = 'madman';
  readonly name = '狂人';
  readonly team: Team = 'madman';
  readonly nightActionType: NightActionType = 'none';

  canActAt(_dayNumber: number): boolean {
    return false;
  }
}