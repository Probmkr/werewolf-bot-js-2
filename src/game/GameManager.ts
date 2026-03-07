import { Client } from 'discord.js';
import { Game } from './Game.js';

class GameManager {
  private games: Map<string, Game> = new Map();

  createGame(channelId: string, guildId: string, hostId: string): Game {
    if (this.games.has(channelId)) {
      throw new Error('このチャンネルには既に進行中のゲームがあります。');
    }
    const game = new Game(guildId, channelId, hostId);
    this.games.set(channelId, game);
    return game;
  }

  getGame(channelId: string): Game | undefined {
    return this.games.get(channelId);
  }

  endGame(channelId: string): void {
    this.games.delete(channelId);
  }

  async startGame(channelId: string, client: Client): Promise<void> {
    const game = this.getGame(channelId);
    if (!game) throw new Error('ゲームが見つかりません。');

    game.start();

    const werewolves = game.players.filter(p => p.role?.team === 'wolf');

    const notifications = game.players.map(async (player) => {
      try {
        const user = await client.users.fetch(player.id);
        if (!player.role) return;

        let dmContent = `あなたの役職は **${player.role.name}** です。\n陣営: ${player.role.team}`;

        // 人狼には仲間一覧を通知
        if (player.role.team === 'wolf' && werewolves.length > 1) {
          const allies = werewolves
            .filter(w => w.id !== player.id)
            .map(w => w.name)
            .join('、');
          dmContent += `\n\n仲間の人狼: **${allies}**`;
        }

        await user.send(dmContent);
      } catch (error) {
        console.error(`Failed to send DM to ${player.name}:`, error);
      }
    });

    await Promise.all(notifications);
  }
}

export const gameManager = new GameManager();
