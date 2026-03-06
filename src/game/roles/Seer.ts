import { Role, Team, NightActionType } from './Role.js';

export class Seer implements Role {
    public readonly id = 'seer';
    public readonly name = '占い師';
    public readonly team: Team = 'village';
    public readonly nightActionType: NightActionType = 'inspect';

    public canActAt(nightNumber: number): boolean {
        return true;
    }
}