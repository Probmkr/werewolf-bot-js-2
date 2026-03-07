import {
  ActionRowBuilder,
  Client,
  StringSelectMenuBuilder,
  TextChannel,
} from 'discord.js';
import { Game } from './Game.js';
import type { NightActionType } from './roles/Role.js';
import { DEFAULT_GAME_SETTINGS, NIGHT_ACTION_TIMEOUT_MS } from '../config.js';

class GameManager {
  private games: Map<string, Game> = new Map();

  createGame(channelId: string, guildId: string, hostId: string, debugMode = false): Game {
    if (this.games.has(channelId)) {
      throw new Error('このチャンネルには既に進行中のゲームがあります。');
    }
    const game = new Game(guildId, channelId, hostId, debugMode ? { ...DEFAULT_GAME_SETTINGS, roles: [...DEFAULT_GAME_SETTINGS.roles], debugMode: true } : undefined);
    this.games.set(channelId, game);
    return game;
  }

  /** デバッグモードが有効なときのみチャンネルにログを送信する */
  private async sendDebug(game: Game, client: Client, content: string): Promise<void> {
    if (!game.settings.debugMode) return;
    try {
      const channel = await client.channels.fetch(game.channelId);
      if (channel?.isTextBased()) {
        await (channel as TextChannel).send(`\`\`\`\n[DEBUG] ${content}\n\`\`\``);
      }
    } catch (error) {
      console.error('Failed to send debug message:', error);
    }
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

    // [DEBUG] 役職配布一覧
    const roleList = game.players.map(p => `${p.name} → ${p.role?.name ?? '?'} (${p.role?.team ?? '?'})`).join('\n');
    await this.sendDebug(game, client, `役職配布 (${game.dayNumber}日目開始):\n${roleList}`);

    await this.sendNightDMs(channelId, client);
  }

  /** 夜行動が必要なプレイヤーへ DM でセレクトメニューを送信する */
  async sendNightDMs(channelId: string, client: Client): Promise<void> {
    const game = this.getGame(channelId);
    if (!game) throw new Error('ゲームが見つかりません。');

    const alivePlayers = game.players.filter(p => p.isAlive);
    const aliveNonWolves = alivePlayers.filter(p => p.role?.team !== 'wolf');

    const sendPromises = alivePlayers
      .filter(p => p.role && p.role.nightActionType !== null && p.role.canActAt(game.dayNumber))
      .map(async (player) => {
        const actionType = player.role!.nightActionType as NightActionType;

        const targetPool = actionType === 'attack' ? aliveNonWolves : alivePlayers;
        const targets = targetPool
          .filter(p => p.id !== player.id)
          .map(p => ({ label: p.name, value: p.id }));

        if (targets.length === 0) return;

        const prompts: Record<NightActionType, string> = {
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

  /** 夜を解決する */
  async resolveNight(channelId: string, client: Client): Promise<void> {
    const game = this.getGame(channelId);
    if (!game || game.phase !== 'night') return;

    if (game.nightActionTimeout) {
      clearTimeout(game.nightActionTimeout);
      game.nightActionTimeout = undefined;
    }

    // [DEBUG] 夜行動の内容を表示
    {
      const { attack, inspect, guard } = game.nightActions;
      const attackName = attack ? (game.players.find(p => p.id === attack)?.name ?? attack) : 'なし';
      const inspectName = inspect ? (game.players.find(p => p.id === inspect)?.name ?? inspect) : 'なし';
      const guardName = guard ? (game.players.find(p => p.id === guard)?.name ?? guard) : 'なし';
      await this.sendDebug(game, client, `夜行動 (${game.dayNumber}日目夜):\n・襲撃: ${attackName}\n・護衛: ${guardName}\n・占い: ${inspectName}`);
    }

    // 1. 護衛 → 襲撃判定
    const guardedId = game.nightActions.guard;
    const attackId = game.nightActions.attack;
    const victim = (() => {
      if (!attackId || attackId === guardedId) return undefined;
      const target = game.players.find(p => p.id === attackId);
      if (!target?.isAlive) return undefined;
      target.isAlive = false;
      return target;
    })();

    // 2. 占い師への結果 DM
    const inspectId = game.nightActions.inspect;
    if (inspectId) {
      const inspected = game.players.find(p => p.id === inspectId);
      const seer = game.players.find(p => p.role?.nightActionType === 'inspect' && p.isAlive);
      if (inspected && seer) {
        try {
          const seerUser = await client.users.fetch(seer.id);
          const result = inspected.role?.team === 'wolf' ? '人狼' : '人狼ではない';
          await seerUser.send(`🔮 占い結果: **${inspected.name}** は **${result}** でした。`);
        } catch (error) {
          console.error(`Failed to send inspect result to seer:`, error);
        }
      }
    }

    // 3. 霊能者へのパッシブ通知（夜の犠牲者）
    if (victim) {
      const medium = game.players.find(p => p.role?.id === 'medium' && p.isAlive);
      if (medium) {
        try {
          const mediumUser = await client.users.fetch(medium.id);
          await mediumUser.send(`🔭 霊能結果: **${victim.name}** は **${victim.role?.name ?? '不明'}** でした。`);
        } catch (error) {
          console.error(`Failed to send medium notification:`, error);
        }
      }
    }

    // 4. 勝敗判定
    const winner = game.checkWinConditions();

    // 5. チャンネルへの結果告知 + フェーズ遷移
    try {
      const channel = await client.channels.fetch(channelId);
      if (channel?.isTextBased()) {
        const ch = channel as TextChannel;
        const morningMsg = victim
          ? `🌅 夜が明けました。\n💀 **${victim.name}** が犠牲になりました。`
          : '🌅 夜が明けました。\n✨ 今夜の犠牲者はいませんでした。';
        await ch.send(morningMsg);

        // [DEBUG] 朝のプレイヤー生存状況（生存者→死亡者の順）
        const alive = game.players.filter(p => p.isAlive).map(p => `✅ ${p.name} (${p.role?.name ?? '?'})`);
        const dead = game.players.filter(p => !p.isAlive).map(p => `💀 ${p.name} (${p.role?.name ?? '?'})`);
        await this.sendDebug(game, client, `プレイヤー状況 (${game.dayNumber}日目朝):\n${[...alive, ...dead].join('\n')}`);

        if (winner) {
          const winnerLabel = winner === 'wolf' ? '人狼' : '村人';
          await ch.send(`🎉 ゲーム終了！ **${winnerLabel}陣営** の勝利です！`);
          game.phase = 'end';
        } else {
          game.phase = 'morning';
        }
      }
    } catch (error) {
      console.error('Failed to send morning message:', error);
    }

    game.nightActions = {};
  }
}

export const gameManager = new GameManager();
