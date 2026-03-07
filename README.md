# werewolf-bot

Discord 上で人狼（人狼ジャッジメント準拠）を遊べる Bot を TypeScript で実装するプロジェクトです。ほぼ全て AI エージェントによって作られています。

## セットアップ

### 1) 依存関係のインストール

```bash
npm install
```

### 2) 環境変数

`.env.example` を参考に `.env` を作成してください。

- `DISCORD_TOKEN`: Bot トークン
- `CLIENT_ID`: アプリケーション（Bot）の Client ID
- `GUILD_ID`（任意）: 開発中は指定推奨（ギルドコマンドは反映が速い）

### 3) コマンド登録

```bash
npm run deploy:commands
```

### 4) 起動

開発（ホットリロード）:

```bash
npm run dev
```

本番ビルド:

```bash
npm run build
npm run start
```

## コマンド

### ゲーム管理

| コマンド | 説明 | 権限 |
|----------|------|------|
| `/werewolf create` | 現在のチャンネルに村を作成します | 誰でも |
| `/werewolf join` | ゲームに参加します（ロビー中のみ） | 誰でも |
| `/werewolf leave` | ゲームから退出します（ロビー中のみ） | 誰でも |
| `/werewolf start` | ゲームを開始し、役職を配布します | ホストのみ |
| `/werewolf status [game_id]` | ゲームの現在状況を表示します | 誰でも |
| `/werewolf end [game_id]` | ゲームを強制終了します | ホストまたは管理者 |
| `/werewolf endall` | このサーバーの全ゲームを強制終了します | 管理者のみ |
| `/werewolf ping` | Bot の生存確認を行います | 誰でも |

> ロビーの募集メッセージに表示される「参加する」「退出する」ボタンでも join / leave 操作ができます。

