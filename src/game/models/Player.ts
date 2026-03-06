
export interface Player {
    id: string; // Discord User ID
    name: string;
    roleId: string;
    isAlive: boolean;
    isRevealed: boolean;
    voteTargetId?: string;
}
