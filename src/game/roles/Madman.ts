import type { Role, Team } from './Role.js';

export class Madman implements Role {
  readonly id = 'madman';
  readonly name = '狂人';
  readonly team: Team = 'madman';
  readonly nightActionType = null;

  canActAt(_dayNumber: number): boolean {
    return false;
  }
}