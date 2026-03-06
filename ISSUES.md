# 発見された問題リスト

## 🔴 Critical (動作が壊れているバグ)

### 1. コマンド実行後に必ずエラーメッセージが送られる
**場所:** `src/index.ts:22-23` / `src/commands/werewolf.ts`

`index.ts` はコマンドの `execute()` の戻り値を使って `interaction.reply()` を呼び出す設計になっている:
```typescript
const result = await command.execute(interaction);
await interaction.reply({ content: result.content }); // ← ここが問題
```
しかし `werewolf.ts` の `execute()` は内部ですべての返信を処理して `void` を返す。
そのため `result` は `undefined` になり、`result.content` で TypeError が発生する。
index.ts の catch ブロックが拾い、`interaction.replied === true` なので `followUp` で
「An error occurred while executing this command.」がユーザーに送られる。
→ **全コマンドが成功しても必ずエラーメッセージが出る。**

TypeScript 的にも `result` の型は `unknown` なので `result.content` は `strict: true` 環境でコンパイルエラーになる。(`tsx` は型チェックしないため実行はできてしまう)

**修正方針:** `index.ts` 側の `reply()` 呼び出しを削除し、コマンド側で完結する設計に統一する。

---

## 🟠 High (設計・実装の重大なミス)

### 2. Medium (霊媒師) の実装が間違っている
**場所:** `src/game/roles/Medium.ts`

```typescript
readonly nightActionType: NightActionType = 'none'; // ← 'inspect' であるべき
canActAt(_dayNumber: number): boolean { return false; } // ← trueであるべき
```
霊媒師は処刑されたプレイヤーの陣営を知ることができる役職。
`nightActionType` は `'inspect'` で、毎晩結果を受け取るべき (`canActAt` = `true`)。
占い師と異なり「誰かを選んで調べる」ではなく「処刑者の結果が自動通知」される点で
アクションの仕組みは別途設計が必要だが、まず `none/false` は明らかに誤り。

### 3. 役職シャッフルのアルゴリズムが偏る
**場所:** `src/game/Game.ts:61`

```typescript
const shuffledRoles = [...this.settings.roles].sort(() => Math.random() - 0.5);
```
`Array.sort` に乱数を使うシャッフルは **偏りが発生する**ことが知られている。
Fisher-Yates アルゴリズムを使うべき。
(人狼ゲームでは役職分布の公平性が重要)

### 4. GameManager.createGame の Game コンストラクタ呼び出しが冗長
**場所:** `src/game/GameManager.ts:12`

```typescript
const game = new Game(channelId, guildId, channelId, hostId);
//                    ^id         ^guildId  ^channelId
```
第1引数 `id` と第3引数 `channelId` に同じ値を渡している。
ゲームIDとチャンネルIDが常に同一になる設計は意図的かもしれないが、
`Game` クラスのコンストラクタシグネチャと使用箇所で `id` の意味が曖昧。

---

---

## 🔵 Low (軽微・命名・一貫性)

### 5. Villager の `name` が不統一
**場所:** `src/game/roles/Villager.ts:5`

```typescript
readonly name = '市民'; // '村人' が一般的な人狼ゲーム用語
```
コメントや設定では「村人」と呼んでいるが、表示名は「市民」になっている。

### 6. `werewolf.ts` の `execute` が直接 `interaction.reply()` を呼ぶ設計
`index.ts` と `werewolf.ts` の責任分担が不明確。
`index.ts` 側が reply するか、コマンド側が reply するかを統一する必要がある。
(問題 #1 と根本原因が同じ)

### 7. `GatewayIntentBits` の設定が最小限
**場所:** `src/index.ts:6`

```typescript
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
```
現在は Guilds のみ。ゲーム進行でメッセージの受信やメンバー情報が必要になった際に
インテントの追加が必要になる。(現時点では問題ないが将来的な拡張で詰まる)

### 8. ホスト以外はゲームを強制終了できない
退出コマンドはロビー中のプレイヤー自身のみ退出できる。
ホストが中断・強制終了するコマンドがない。

---

## まとめ

| 優先度 | 件数 |
|--------|------|
| 🔴 Critical | 1 |
| 🟠 High     | 3 |
| 🔵 Low      | 4 |
