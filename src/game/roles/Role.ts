export type Team = 'village' | 'wolf' | 'madman';
export type NightActionType = 'attack' | 'inspect' | 'guard';

export interface Role {
  readonly id: string;
  readonly name: string;
  readonly team: Team;
  readonly nightActionType: NightActionType | null;

  // その日の夜に行動（入力）が可能かどうか
  // dayNumber: 1日目夜=1, 2日目夜=2... (実装に合わせて調整)
  canActAt(dayNumber: number): boolean;
}