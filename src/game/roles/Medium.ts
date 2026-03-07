import type { Role, Team } from './Role.js';

export class Medium implements Role {
  readonly id = 'medium';
  readonly name = '霊能者';
  readonly team: Team = 'village';
  readonly nightActionType = null;

  canActAt(_dayNumber: number): boolean {
    return false;
  }
}