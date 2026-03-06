import type { Role } from '../roles/Role.js';

export interface Player {
  id: string; // Discord User ID
  name: string; // 表示名
  role?: Role;
  isAlive: boolean;
}