import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
  ChatInputCommandInteraction,
} from 'discord.js';
import { gameManager } from '../game/GameManager.js';

export const data = new SlashCommandBuilder()
  .setName('werewolf')
  .setDescription('人狼ゲームの管理コマンド')
  .addSubcommand(sub =>
    sub.setName('ping').setDescription('Botの生存確認を行います')
  )
  .addSubcommand(sub =>
    sub.setName('create').setDescription('新しいゲームを作成します')
  )
  .addSubcommand(sub =>
    sub.setName('join').setDescription('ゲームに参加します')
  )
  .addSubcommand(sub =>
    sub.setName('leave').setDescription('ゲームから退出します')
  )
  .addSubcommand(sub =>
    sub.setName('start').setDescription('ゲームを開始します')
  )
  .addSubcommand(sub =>
    sub.setName('status')
      .setDescription('ゲームの現在状況を表示します')
      .addStringOption(opt =>
        opt.setName('game_id')
          .setDescription('確認するゲームのID（省略時はこのチャンネルのゲーム）')
          .setRequired(false)
      )
  )
  .addSubcommand(sub =>
    sub.setName('end')
      .setDescription('ゲームを強制終了します（ホストまたは管理者のみ）')
      .addStringOption(opt =>
        opt.setName('game_id')
          .setDescription('終了するゲームのID（省略時はこのチャンネルのゲーム）')
          .setRequired(false)
      )
  )
  .addSubcommand(sub =>
    sub.setName('endall')
      .setDescription('このサーバーの全ゲームを強制終了します（管理者のみ）')
  );

const lobbyRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
  new ButtonBuilder()
    .setCustomId('werewolf:join')
    .setLabel('参加する')
    .setStyle(ButtonStyle.Primary),
  new ButtonBuilder()
    .setCustomId('werewolf:leave')
    .setLabel('退出する')
    .setStyle(ButtonStyle.Secondary),
);

const PHASE_LABELS: Record<string, string> = {
  lobby:      'ロビー',
  roleAssign: '役職配布中',
  night:      '夜',
  morning:    '朝',
  discussion: '昼（議論）',
  vote:       '投票',
  execution:  '処刑',
  end:        '終了',
};

export async function execute(interaction: ChatInputCommandInteraction) {
  const subcommand = interaction.options.getSubcommand();
  const channelId = interaction.channelId;
  const guildId = interaction.guildId;
  const user = interaction.user;

  if (!channelId || !guildId) {
    await interaction.reply({ content: 'このコマンドはサーバー内でのみ使用できます。', flags: MessageFlags.Ephemeral });
    return;
  }

  const isAdmin = interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild) ?? false;

  try {
    switch (subcommand) {
      case 'ping': {
        await interaction.reply('Pong!');
        break;
      }
      case 'create': {
        const game = gameManager.createGame(channelId, guildId, user.id);
        await interaction.reply({
          content: [
            `ゲームを作成しました！参加者はボタンまたは \`/werewolf join\` で参加してください。`,
            `ホスト: ${user.toString()}`,
            `ゲームID: \`${game.id}\``,
          ].join('\n'),
          components: [lobbyRow],
        });
        break;
      }
      case 'join': {
        const game = gameManager.getGame(channelId);
        if (!game) {
          await interaction.reply({ content: 'このチャンネルでゲームは開催されていません。', flags: MessageFlags.Ephemeral });
          return;
        }
        game.addPlayer({
          id: user.id,
          name: user.globalName || user.username,
          isAlive: true
        });
        await interaction.reply(`${user.toString()} が参加しました！ (現在 ${game.players.length}人)`);
        break;
      }
      case 'leave': {
        const game = gameManager.getGame(channelId);
        if (!game) {
          await interaction.reply({ content: 'このチャンネルでゲームは開催されていません。', flags: MessageFlags.Ephemeral });
          return;
        }
        game.removePlayer(user.id);
        await interaction.reply(`${user.toString()} が退出しました。 (現在 ${game.players.length}人)`);
        break;
      }
      case 'start': {
        const game = gameManager.getGame(channelId);
        if (!game) {
          await interaction.reply({ content: 'このチャンネルでゲームは開催されていません。', flags: MessageFlags.Ephemeral });
          return;
        }
        if (game.hostId !== user.id) {
          await interaction.reply({ content: 'ゲームを開始できるのはホストのみです。', flags: MessageFlags.Ephemeral });
          return;
        }

        // DM 送信に時間がかかるため先に応答を遅延させる
        await interaction.deferReply();
        await gameManager.startGame(channelId, interaction.client);
        await interaction.editReply('ゲームを開始しました！役職の配布が完了しました。夜フェーズを開始します。DMを確認してください。');
        break;
      }
      case 'status': {
        const gameId = interaction.options.getString('game_id');
        const game = gameId
          ? gameManager.getGameById(gameId)
          : gameManager.getGame(channelId);

        if (!game) {
          await interaction.reply({ content: 'ゲームが見つかりません。', flags: MessageFlags.Ephemeral });
          return;
        }

        const alivePlayers = game.players.filter(p => p.isAlive);
        const lines = [
          `**ゲームID:** \`${game.id}\``,
          `**フェーズ:** ${PHASE_LABELS[game.phase] ?? game.phase}`,
          `**日数:** ${game.dayNumber}日目`,
          `**参加者:** ${game.players.length}人 (生存: ${alivePlayers.length}人)`,
          `**ホスト:** <@${game.hostId}>`,
        ];
        if (game.phase === 'lobby') {
          const names = game.players.map(p => p.name).join('、');
          lines.push(`**参加者一覧:** ${names || 'なし'}`);
        } else {
          const names = alivePlayers.map(p => p.name).join('、');
          lines.push(`**生存者:** ${names || 'なし'}`);
        }

        await interaction.reply({ content: lines.join('\n'), flags: MessageFlags.Ephemeral });
        break;
      }
      case 'end': {
        const gameId = interaction.options.getString('game_id');
        const game = gameId
          ? gameManager.getGameById(gameId)
          : gameManager.getGame(channelId);

        if (!game) {
          await interaction.reply({ content: 'ゲームが見つかりません。', flags: MessageFlags.Ephemeral });
          return;
        }
        if (game.hostId !== user.id && !isAdmin) {
          await interaction.reply({ content: 'ゲームを終了できるのはホストまたは管理者のみです。', flags: MessageFlags.Ephemeral });
          return;
        }

        gameManager.endGame(game.channelId);
        await interaction.reply(`ゲーム \`${game.id}\` を強制終了しました。`);
        break;
      }
      case 'endall': {
        if (!isAdmin) {
          await interaction.reply({ content: 'このコマンドは管理者のみ使用できます。', flags: MessageFlags.Ephemeral });
          return;
        }

        const games = gameManager.getGamesByGuild(guildId);
        if (games.length === 0) {
          await interaction.reply({ content: 'このサーバーで進行中のゲームはありません。', flags: MessageFlags.Ephemeral });
          return;
        }

        for (const game of games) {
          gameManager.endGame(game.channelId);
        }
        await interaction.reply(`このサーバーの全ゲーム (${games.length}件) を強制終了しました。`);
        break;
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '不明なエラーが発生しました';
    await interaction.reply({ content: `エラー: ${errorMessage}`, flags: MessageFlags.Ephemeral }).catch(() => interaction.followUp({ content: `エラー: ${errorMessage}`, flags: MessageFlags.Ephemeral }));
  }
}
