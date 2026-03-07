import { Client, Events, GatewayIntentBits, MessageFlags } from 'discord.js';

import { env } from './env.js';
import { commandMap } from './commands/index.js';
import { gameManager } from './game/GameManager.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Logged in as ${readyClient.user.tag}`);
});

client.on(Events.Error, (error) => {
  console.error('[Discord Client Error]', error);
});

client.on(Events.InteractionCreate, async (interaction) => {
  // ボタンインタラクション
  if (interaction.isButton()) {
    const [namespace, action] = interaction.customId.split(':');
    if (namespace !== 'werewolf') return;

    const channelId = interaction.channelId;
    const user = interaction.user;

    try {
      const game = gameManager.getGame(channelId);
      if (!game) {
        await interaction.reply({ content: 'このチャンネルでゲームは開催されていません。', flags: MessageFlags.Ephemeral });
        return;
      }
      if (action === 'join') {
        game.addPlayer({ id: user.id, name: user.globalName || user.username, isAlive: true });
        await interaction.reply(`${user.toString()} が参加しました！ (現在 ${game.players.length}人)`);
      } else if (action === 'leave') {
        game.removePlayer(user.id);
        await interaction.reply(`${user.toString()} が退出しました。 (現在 ${game.players.length}人)`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '不明なエラーが発生しました';
      await interaction.reply({ content: `エラー: ${errorMessage}`, flags: MessageFlags.Ephemeral });
    }
    return;
  }

  // セレクトメニューインタラクション
  if (interaction.isStringSelectMenu()) {
    const [namespace, category, actionType] = interaction.customId.split(':');
    if (namespace !== 'werewolf') return;

    const user = interaction.user;

    // 夜行動（DM 経由）
    if (category === 'night') {
      const game = gameManager.getGameByPlayerId(user.id);

      if (!game || game.phase !== 'night') {
        await interaction.reply({ content: 'このインタラクションは現在有効ではありません。', flags: MessageFlags.Ephemeral });
        return;
      }

      try {
        const targetId = interaction.values[0];
        game.submitNightAction(user.id, actionType as 'attack' | 'inspect' | 'guard', targetId);
        await interaction.reply({ content: '✅ 行動を受け付けました。', flags: MessageFlags.Ephemeral });

        if (game.hasAllNightActions()) {
          await gameManager.resolveNight(game.channelId, interaction.client);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '不明なエラーが発生しました';
        await interaction.reply({ content: `エラー: ${errorMessage}`, flags: MessageFlags.Ephemeral });
      }
      return;
    }

    // 投票（チャンネル経由）
    if (category === 'vote') {
      const game = gameManager.getGame(interaction.channelId);

      if (!game || game.phase !== 'vote') {
        await interaction.reply({ content: 'このインタラクションは現在有効ではありません。', flags: MessageFlags.Ephemeral });
        return;
      }

      try {
        const targetId = interaction.values[0];
        game.submitVote(user.id, targetId);
        const targetName = game.players.find(p => p.id === targetId)?.name ?? targetId;
        await interaction.reply({ content: `✅ **${targetName}** に投票しました。（締切前に再選択で変更できます）`, flags: MessageFlags.Ephemeral });

        if (game.hasAllVotes()) {
          await gameManager.resolveVote(game.channelId, interaction.client);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '不明なエラーが発生しました';
        await interaction.reply({ content: `エラー: ${errorMessage}`, flags: MessageFlags.Ephemeral });
      }
      return;
    }
  }

  if (!interaction.isChatInputCommand()) return;

  const command = commandMap.get(interaction.commandName);
  if (!command) {
    await interaction.reply({ content: 'Unknown command.', flags: MessageFlags.Ephemeral });
    return;
  }

  try {
    await command.execute(interaction);
  } catch (err) {
    console.error(err);
    const content = 'An error occurred while executing this command.';
    if (interaction.deferred || interaction.replied) {
      await interaction.followUp({ content, flags: MessageFlags.Ephemeral });
    } else {
      await interaction.reply({ content, flags: MessageFlags.Ephemeral });
    }
  }
});

await client.login(env.DISCORD_TOKEN);
