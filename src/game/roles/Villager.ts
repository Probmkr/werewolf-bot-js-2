import type { Role, Team } from './Role.js';

export class Villager implements Role {
  readonly id = 'villager';
  readonly name = '村人';
  readonly team: Team = 'village';
  readonly nightActionType = null;

  canActAt(_dayNumber: number): boolean {
    return false;
  }
}