import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
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
    );

export async function execute(interaction: ChatInputCommandInteraction) {
    const subcommand = interaction.options.getSubcommand();
    const channelId = interaction.channelId;
    const guildId = interaction.guildId;
    const user = interaction.user;

    if (!channelId || !guildId) {
        await interaction.reply({ content: 'このコマンドはサーバー内でのみ使用できます。', ephemeral: true });
        return;
    }

    try {
        switch (subcommand) {
            case 'ping': {
                await interaction.reply('Pong!');
                break;
            }
            case 'create': {
                gameManager.createGame(channelId, guildId, user.id);
                await interaction.reply(`ゲームを作成しました！参加者は \`/werewolf join\` で参加してください。\nホスト: ${user.toString()}`);
                break;
            }
            case 'join': {
                const game = gameManager.getGame(channelId);
                if (!game) {
                    await interaction.reply({ content: 'このチャンネルでゲームは開催されていません。', ephemeral: true });
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
                    await interaction.reply({ content: 'このチャンネルでゲームは開催されていません。', ephemeral: true });
                    return;
                }
                game.removePlayer(user.id);
                await interaction.reply(`${user.toString()} が退出しました。 (現在 ${game.players.length}人)`);
                break;
            }
            case 'start': {
                const game = gameManager.getGame(channelId);
                if (!game) {
                    await interaction.reply({ content: 'このチャンネルでゲームは開催されていません。', ephemeral: true });
                    return;
                }
                if (game.hostId !== user.id) {
                    await interaction.reply({ content: 'ゲームを開始できるのはホストのみです。', ephemeral: true });
                    return;
                }

                await interaction.reply('ゲームを開始します！役職を配布しています...');
                await gameManager.startGame(channelId, interaction.client);
                await interaction.followUp('役職の配布が完了しました。夜フェーズを開始します。DMを確認してください。');
                break;
            }
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '不明なエラーが発生しました';
        await interaction.reply({ content: `エラー: ${errorMessage}`, ephemeral: true }).catch(() => interaction.followUp({ content: `エラー: ${errorMessage}`, ephemeral: true }));
    }
}