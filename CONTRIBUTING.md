# コントリビューションガイド — inuso-admin

---

## ブランチ戦略

| ブランチ | 役割 | マージ先 |
|---|---|---|
| `main` | 本番環境 | — |
| `dev` | 統合・ステージング | `main` |
| `claudecode` | Claude Code 自動開発 | `dev` |
| `feature/*` | 機能開発 | `dev` |
| `fix/*` | バグ修正 | `dev` |

**ルール:**
- `main` への直接 push は禁止
- `dev` へのマージは PR 経由で行う
- Claude Code は必ず `claudecode` ブランチを使用する

---

## 開発フロー

```bash
# 1. dev の最新を取得
git fetch origin
git checkout dev
git pull origin dev

# 2. 作業ブランチを作成
git checkout -b feature/my-feature

# 3. 変更・コミット
git add <files>
git commit -m "feat: 機能名を追加"

# 4. push して PR を作成
git push -u origin feature/my-feature
```

---

## コミットメッセージ規約

```
<種別>: <変更内容の要約>
```

| 種別 | 用途 |
|---|---|
| `feat` | 新機能追加 |
| `fix` | バグ修正 |
| `refactor` | リファクタリング（動作変更なし） |
| `docs` | ドキュメントのみの変更 |
| `style` | スタイル・デザイン変更 |
| `chore` | ビルド設定・依存関係更新 |
| `security` | セキュリティ修正 |

日本語でも可。例: `fix: フォームのFormDataエラーを修正`

---

## コーディング規約

### 共通ライブラリの使用

既存の共通モジュールを積極的に使い、重複実装を避けてください。

| 用途 | 使うもの |
|---|---|
| Firestore 接続 | `src/lib/firebase-admin.ts` の `getDb()` / `nowTimestamp()` |
| 運営オペレーター認証 | `src/lib/admin-auth.ts` の `getOperatorId()` / `getAdminScope()` |
| 変更ログ保存 | `src/lib/changelog.ts` の `saveChangeLog()` |
| Viewer ISR 無効化 | `src/lib/revalidate.ts` の `revalidateViewer()` |
| FCM 通知送信 | `src/lib/fcm-notify.ts` の `sendAdminNotification()` |
| 通知定数 | `src/lib/notice-constants.ts` の `ALL_TARGETS` / `TYPE_OPTIONS` 等 |
| 削除ボタン | `src/components/DeleteButton.tsx` の `DeleteButton` |

### API ルートのルール

- 全 POST エンドポイントは必ず認証チェックを実装する
- データ変更後は必ず `saveChangeLog()` を呼ぶ
- お知らせ・ブース・イベント更新後は必ず `revalidateViewer()` を呼ぶ
- `await` を含むイベントハンドラでは `currentTarget` を先に変数に保存する

### セキュリティ

- `isFullAccess(scope)` でフルアクセス確認を行い、限定スコープのユーザーへの制限を徹底する
- 限定スコープユーザーは担当ブース以外の操作を行えないようにする
- `/admin/booth` 等の権限チェックは必ずサーバーサイドで行う

---

## PR を作成する前のチェックリスト

- [ ] `npm run build` が通る
- [ ] TypeScript エラーがない
- [ ] 新しい API エンドポイントに認証チェックがある
- [ ] データ変更後に `saveChangeLog()` を呼んでいる
- [ ] 変更内容を PR の description に記載している
- [ ] 既存機能（他のスコープのユーザー）への影響を確認している

---

## Claude Code での開発

Claude Code を使う場合は `.claude/commands/` のスラッシュコマンドを活用してください。

| コマンド | 説明 |
|---|---|
| `/deploy` | 変更を `claudecode` ブランチにコミット・push |
| `/create-pr` | `claudecode` → `dev` の draft PR を作成 |
| `/sync-dev` | `dev` の最新を `claudecode` に取り込む |
| `/notice-create` | お知らせ作成時の仕様確認チェックリスト |
