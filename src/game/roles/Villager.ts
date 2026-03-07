import type { Role, Team, NightActionType } from './Role.js';

export class Villager implements Role {
  readonly id = 'villager';
  readonly name = '村人';
  readonly team: Team = 'village';
  readonly nightActionType: NightActionType = 'none';

  canActAt(_dayNumber: number): boolean {
    return false;
  }
}