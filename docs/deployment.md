# デプロイ手順 — inuso-admin

---

## 環境一覧

| 環境 | ブランチ | URL |
|---|---|---|
| 本番 | `main` | Vercel 本番ドメイン |
| ステージング | `dev` | Vercel Preview |
| 開発 | `claudecode` | Vercel Preview（自動） |

---

## 初回セットアップ

### 1. リポジトリクローン

```bash
git clone https://github.com/sho29saka31/inuso-admin.git
cd inuso-admin
npm install
```

### 2. 環境変数の設定

`.env.local` を作成して以下を設定します。

```env
# Firebase Admin SDK
# Firebase コンソール → プロジェクト設定 → サービスアカウント → 新しい秘密鍵の生成
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"..."}

# JWT 署名鍵（運営オペレーター・DB管理者の両セッションで共用）
# 生成: openssl rand -base64 32
SESSION_SECRET=your_jwt_secret_32chars_or_more

# DB管理者認証
DB_ADMIN_ID=your_db_admin_id
DB_ADMIN_PW=your_db_admin_password
DB_ADMIN_PIN=1234   # 任意。未設定時はPINステージをスキップ

# 運営オペレーター認証（JSON形式: {"スコープ名": "パスワード", ...}）
# 例: {"実行委員": "pass1", "1-1": "pass2", "eスポーツ部": "pass3"}
ADMIN_PASSWORDS={"実行委員":"password","教員":"password"}

# Viewer ISR 無効化（inuso-viewer の本番 URL を設定）
VIEWER_REVALIDATE_URL=https://your-viewer.vercel.app/api/revalidate
VIEWER_REVALIDATE_SECRET=same_value_as_viewer_REVALIDATE_SECRET

# Bluetooth データ受信 API（Surface Go 2 から送られてくるトークン）
BLUETOOTH_SECRET=your_bluetooth_bearer_token
```

> セキュリティ設計の詳細は [`docs/security.md`](./security.md) を参照してください。

### 3. ローカル起動確認

```bash
npm run dev
# http://localhost:3000 で確認
```

---

## Vercel プロジェクト設定

### 環境変数の登録

Vercel ダッシュボード → Settings → Environment Variables に上記の全変数を登録します。

> **重要**: `ADMIN_PASSWORDS` は JSON 文字列として登録します。エスケープ不要（Vercel が自動処理）。

### ビルド設定

| 項目 | 設定値 |
|---|---|
| Framework Preset | Next.js |
| Build Command | `npm run build` |
| Output Directory | `.next` |
| Install Command | `npm install` |

---

## 運営オペレーターアカウントの管理

### アカウント追加

`ADMIN_PASSWORDS` 環境変数の JSON に追記します。

```json
{
  "実行委員": "password1",
  "教員": "password2",
  "1-1": "class_password",
  "eスポーツ部": "club_password",
  "キッチンカー": "food_password",
  "保健委員会": "committee_password"
}
```

スコープ値は `src/lib/admin-scope.ts` の定義を参照してください。

### パスワード変更手順

1. Vercel ダッシュボード → Settings → Environment Variables → `ADMIN_PASSWORDS` を編集
2. 変更を保存 → Vercel が自動で再デプロイ
3. 旧パスワードで発行済みの JWT Cookie は次回ログイン時に自然に無効化される

---

## 本番リリース手順

1. `dev` ブランチで動作確認（特に認証フロー・Firestore 書き込み）
2. `dev` → `main` への PR を作成・レビュー
3. マージ → Vercel が自動でデプロイ
4. デプロイ後、本番 URL でログイン・各機能の動作確認

---

## inuso-viewer との連携確認

admin をデプロイ後、以下を確認します。

1. `VIEWER_REVALIDATE_URL` が viewer の `/api/revalidate` エンドポイントを指しているか
2. `VIEWER_REVALIDATE_SECRET` が viewer の `REVALIDATE_SECRET` と同じ値か
3. お知らせ送信後、viewer 側のページが更新されるか

---

## Bluetooth API の設定

Surface Go 2 側の設定ファイルに以下を登録してください。

```
API_URL=https://your-admin.vercel.app/api/booth/bluetooth
API_TOKEN=<BLUETOOTH_SECRET の値>
```

詳細は [`docs/bluetooth.md`](./bluetooth.md) を参照してください。

---

## トラブルシューティング

デプロイ・運用中のトラブルは [`docs/troubleshooting.md`](./troubleshooting.md) を参照してください。
