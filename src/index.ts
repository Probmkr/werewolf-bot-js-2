import { Client, Events, GatewayIntentBits } from 'discord.js';

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
        await interaction.reply({ content: 'このチャンネルでゲームは開催されていません。', ephemeral: true });
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
      await interaction.reply({ content: `エラー: ${errorMessage}`, ephemeral: true });
    }
    return;
  }

  if (!interaction.isChatInputCommand()) return;

  const command = commandMap.get(interaction.commandName);
  if (!command) {
    await interaction.reply({ content: 'Unknown command.', ephemeral: true });
    return;
  }

  try {
    await command.execute(interaction);
  } catch (err) {
    console.error(err);
    const content = 'An error occurred while executing this command.';
    if (interaction.deferred || interaction.replied) {
      await interaction.followUp({ content, ephemeral: true });
    } else {
      await interaction.reply({ content, ephemeral: true });
    }
  }
});

await client.login(env.DISCORD_TOKEN);
