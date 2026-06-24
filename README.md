# imin — 予定調整 Web アプリ

ログイン不要で、ホストが予定候補日を提示し、ゲストが出席可能日を回答できる日程調整アプリです。

## 機能

- ホスト: 予定作成、候補日（日付のみ / 日時）登録、回答期限設定、ゲスト用 URL 共有
- ゲスト: URL から出席可 / 出席不可を回答（ログイン不要）
- ホスト: 管理 URL から回答一覧の確認、予定の後から編集

## 技術スタック

- Next.js 16 (App Router) + TypeScript + Tailwind CSS
- SQLite + Prisma
- Zod / nanoid / date-fns（JST 固定）

## 必要環境

- Node.js 20 以上（推奨）
- npm

## セットアップ

```bash
# 環境変数（.env が無い場合は example からコピー）
cp .env.example .env

# 依存関係のインストール
npm install

# DB マイグレーション（初回セットアップ）
npm run db:setup

# 開発サーバー起動
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

## 環境変数

`.env` をプロジェクトルートに置きます。リポジトリには `.env.example` があるので、上記の `cp` でコピーできます。

| 変数 | 説明 | 例 |
|------|------|-----|
| `DATABASE_URL` | SQLite の接続先 | `file:./dev.db` |

未設定時は `file:./dev.db` が使われます（`prisma.config.ts` / アプリ共通）。

## コマンド

| コマンド | 説明 |
|----------|------|
| `npm run dev` | 開発サーバー起動 |
| `npm run build` | 本番ビルド |
| `npm run start` | 本番サーバー起動 |
| `npm run lint` | ESLint 実行 |
| `npm test` | テスト実行（Vitest） |
| `npm run test:watch` | テストをウォッチモードで実行 |
| `npm run db:setup` | 初回 DB セットアップ（マイグレーション適用） |
| `npm run db:migrate` | スキーマ変更時のマイグレーション作成・適用 |
| `npm run db:generate` | Prisma Client 生成 |

## 画面一覧

| パス | 説明 |
|------|------|
| `/` | トップ |
| `/new` | 予定作成 |
| `/e/{eventId}` | ゲスト回答 |
| `/e/{eventId}/created` | 作成完了（リンク表示） |
| `/e/{eventId}/manage?token={hostToken}` | ホスト管理 |

## データベース

- SQLite ファイル: プロジェクトルートの `dev.db`（`DATABASE_URL` に依存）
- スキーマ変更時は `npm run db:migrate` を実行
- `dev.db` は `.gitignore` 対象（ローカルデータ）

## 設計ドキュメント

詳細な仕様は [`docs/design.md`](docs/design.md) を参照してください。
