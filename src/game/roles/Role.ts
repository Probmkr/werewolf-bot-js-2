
export type Team = 'wolf' | 'village' | 'madman';
export type NightActionType = 'attack' | 'inspect' | 'guard' | 'none';

export interface Role {
    id: string;
    name: string;
    team: Team;
    nightActionType: NightActionType;
    canActAt(nightNumber: number): boolean;
    // performNightAction(context: any): Promise<void>; // This will be implemented later
}
