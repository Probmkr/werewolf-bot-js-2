import {
  ActionRowBuilder,
  Client,
  StringSelectMenuBuilder,
  TextChannel,
} from 'discord.js';
import { Game } from './Game.js';
import { NIGHT_ACTION_TIMEOUT_MS } from '../config.js';

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

  getGameById(gameId: string): Game | undefined {
    for (const game of this.games.values()) {
      if (game.id === gameId) return game;
    }
    return undefined;
  }

  getGamesByGuild(guildId: string): Game[] {
    return [...this.games.values()].filter(g => g.guildId === guildId);
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
    await this.sendNightDMs(channelId, client);
  }

  /** 夜行動が必要なプレイヤーへ DM でセレクトメニューを送信する */
  async sendNightDMs(channelId: string, client: Client): Promise<void> {
    const game = this.getGame(channelId);
    if (!game) throw new Error('ゲームが見つかりません。');

    const alivePlayers = game.players.filter(p => p.isAlive);
    const aliveNonWolves = alivePlayers.filter(p => p.role?.team !== 'wolf');

    const sendPromises = alivePlayers
      .filter(p => p.role && p.role.nightActionType !== 'none' && p.role.canActAt(game.dayNumber))
      .map(async (player) => {
        const actionType = player.role!.nightActionType as 'attack' | 'inspect' | 'guard';

        const targetPool = actionType === 'attack' ? aliveNonWolves : alivePlayers;
        const targets = targetPool
          .filter(p => p.id !== player.id)
          .map(p => ({ label: p.name, value: p.id }));

        if (targets.length === 0) return;

        const prompts = {
          attack: '🐺 **夜です。** 今夜の襲撃対象を選んでください。',
          inspect: '🔮 **夜です。** 占いたい相手を選んでください。',
          guard: '🛡️ **夜です。** 護衛したい相手を選んでください。',
        };

        const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId(`werewolf:night:${actionType}`)
            .setPlaceholder('選択してください')
            .addOptions(targets),
        );

        try {
          const user = await client.users.fetch(player.id);
          await user.send({ content: prompts[actionType], components: [row] });
        } catch (error) {
          console.error(`Failed to send night DM to ${player.name}:`, error);
        }
      });

    await Promise.all(sendPromises);

    // 全員確定またはタイムアウトで夜を解決する
    game.nightActionTimeout = setTimeout(async () => {
      await this.resolveNight(channelId, client);
    }, NIGHT_ACTION_TIMEOUT_MS);
  }

  /** プレイヤー ID からゲームを取得する（DM インタラクションの紐付けに使用） */
  getGameByPlayerId(userId: string): Game | undefined {
    for (const game of this.games.values()) {
      if (game.phase === 'night' && game.players.some(p => p.id === userId && p.isAlive)) {
        return game;
      }
    }
    return undefined;
  }

  /** 夜を解決する（implement-night-resolve で実装予定のスタブ） */
  async resolveNight(channelId: string, client: Client): Promise<void> {
    const game = this.getGame(channelId);
    if (!game || game.phase !== 'night') return;

    if (game.nightActionTimeout) {
      clearTimeout(game.nightActionTimeout);
      game.nightActionTimeout = undefined;
    }

    console.log(`[Game ${game.id}] Night actions:`, game.nightActions);

    // TODO: implement-night-resolve で実際の解決ロジックを実装する
    try {
      const channel = await client.channels.fetch(channelId);
      if (channel?.isTextBased()) {
        await (channel as TextChannel).send('🌅 夜が明けました…');
      }
    } catch (error) {
      console.error('Failed to send morning message:', error);
    }

    game.nightActions = {};
    game.phase = 'morning';
  }
}

export const gameManager = new GameManager();
