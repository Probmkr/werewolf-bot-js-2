import { Role } from './Role.js';
import { Villager } from './Villager.js';
import { Werewolf } from './Werewolf.js';
import { Seer } from './Seer.js';
import { Medium } from './Medium.js';
import { Hunter } from './Hunter.js';
import { Madman } from './Madman.js';

export * from './Role.js';
export * from './Villager.js';
export * from './Werewolf.js';
export * from './Seer.js';
export * from './Medium.js';
export * from './Hunter.js';
export * from './Madman.js';

export function createRole(roleId: string): Role {
  switch (roleId) {
    case 'villager': return new Villager();
    case 'werewolf': return new Werewolf();
    case 'seer': return new Seer();
    case 'medium': return new Medium();
    case 'hunter': return new Hunter();
    case 'madman': return new Madman();
    default: throw new Error(`Unknown role ID: ${roleId}`);
  }
}