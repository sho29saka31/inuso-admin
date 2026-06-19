# ISF — 管理画面（Admin）

文化祭「ISF」の運営スタッフ向け管理Webアプリです。  
ブース・イベント・通知・混雑状況・ファイル設定などをFirestoreに登録・編集します。

> **ISFプロジェクト** が開発・運用しています。

---

## 管理権限の種別

| 権限 | パス | 説明 |
|---|---|---|
| **DB管理者** | `/db/*` | Firestoreの全データを閲覧・作成・編集・削除できる上位権限 |
| **運営オペレーター** | `/admin/*` | 混雑状況更新・通知送信など当日運営向けの限定操作 |

認証はJWTベースのCookie（`db_session` / `admin_operator`）で管理します。

---

## 機能一覧

### DB管理者（`/db/*`）

| 機能 | 説明 |
|---|---|
| **ブース管理** | ブースの新規作成・編集・削除（クラス/部活/飲食/有志/委員会） |
| **イベント管理** | タイムテーブルの作成・編集・遅延設定 |
| **お知らせ管理** | 通知の作成・編集・削除（FCM push + Viewer キャッシュ無効化） |
| **飲食管理** | キッチンカー・PTAバザーのメニュー・価格設定 |
| **ファイル設定** | フロアマップ画像URL・デジタルパンフレットPDF URLの更新 |
| **変更ログ** | 全操作の変更履歴を閲覧 |

### 運営オペレーター（`/admin/*`）

| 機能 | 説明 |
|---|---|
| **混雑状況更新** | ブースごとの混雑ステータスをリアルタイム更新 |
| **お知らせ送信** | FCMプッシュ通知付きで緊急・一般通知を即時送信 |
| **イベント遅延管理** | 当日の遅延・変更を即時反映 |
| **操作ログ** | 自分の操作履歴を確認 |

---

## 技術スタック

| 技術 | 用途 |
|---|---|
| **Next.js 16 (App Router)** | フロントエンド・Server Actions |
| **Firebase Admin SDK** | Firestore 読み書き（サーバーサイド） |
| **Firebase Admin Messaging** | FCMプッシュ通知送信 |
| **Tailwind CSS** | スタイリング |
| **Vercel** | ホスティング |

---

## 環境変数

`.env.local` に以下を設定してください。

```env
# Firebase Admin SDK
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}

# DB管理者認証
DB_ADMIN_PASSWORD=your_db_admin_password
DB_SESSION_SECRET=your_jwt_secret

# 運営オペレーター認証
ADMIN_OPERATOR_PASSWORD=your_operator_password
ADMIN_OPERATOR_SECRET=your_operator_jwt_secret

# Viewer キャッシュ on-demand 無効化
VIEWER_REVALIDATE_URL=https://your-viewer.vercel.app/api/revalidate
VIEWER_REVALIDATE_SECRET=your_secret_here
```

> `VIEWER_REVALIDATE_URL` / `VIEWER_REVALIDATE_SECRET` はお知らせ作成・更新・削除時に  
> Viewer 側のISRキャッシュを即時無効化するために使用します。未設定の場合は通知のみ送信されます。

---

## ブランチ運用

| ブランチ | 役割 |
|---|---|
| `main` | 本番環境 |
| `dev` | 統合・ステージング |
| `claudecode` | Claude Code による自動開発ブランチ（→ `dev` へ PR） |

---

## ローカル開発

```bash
npm install
npm run dev
```

[http://localhost:3000](http://localhost:3000) で確認できます。

---

## ディレクトリ構成（主要部分）

```
src/
├── app/
│   ├── db/                    # DB管理者画面（要 db_session Cookie）
│   │   ├── booth/             # ブース管理
│   │   ├── event/             # イベント管理
│   │   ├── notice/            # お知らせ管理
│   │   ├── eat/               # 飲食ブース管理
│   │   ├── files/             # マップ・パンフ URL設定
│   │   └── changelog/         # 変更ログ
│   ├── (admin-auth)/admin/    # 運営オペレーター画面（要 admin_operator Cookie）
│   │   ├── booth/             # 混雑状況更新
│   │   ├── notice/            # 通知送信
│   │   └── event/             # 遅延管理
│   └── api/                   # 認証エンドポイント・通知API
├── components/                # 共通UI（DbShell・AdminShell）
└── lib/                       # Firebase Admin・認証・変更ログ
```

---

## セキュリティ

- DB管理者・運営オペレーターはそれぞれ独立したパスワード認証
- JWTはHTTPOnly Cookieで管理し、XSS対策済み
- Viewer キャッシュ無効化APIはシークレットキーで保護

---

## ライセンス

© 2026 ISFプロジェクト  
本リポジトリのコードは学校行事目的のみに使用します。
