
import { Game } from './Game.js';
import { Collection } from 'discord.js';
import { randomUUID } from 'crypto';

export class GameManager {
    private games: Collection<string, Game> = new Collection(); // Maps channelId to Game

    createGame(guildId: string, channelId: string, hostId: string): Game {
        if (this.games.has(channelId)) {
            throw new Error('A game is already running in this channel.');
        }
        const gameId = randomUUID();
        const game = new Game(gameId, guildId, channelId, hostId);
        this.games.set(channelId, game);
        return game;
    }

    getGameByChannel(channelId: string): Game | undefined {
        return this.games.get(channelId);
    }

    endGame(channelId: string): boolean {
        return this.games.delete(channelId);
    }

    listGames(): Game[] {
        return Array.from(this.games.values());
    }
}
