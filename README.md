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

- `/ping`: Pong! を返します

