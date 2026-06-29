# inuso-admin — 文化祭運営スタッフ向け管理画面

犬山総合高等学校 文化祭「ISF」の運営スタッフ向け管理Webアプリです。  
ブース・イベント・お知らせ・混雑状況などを Firestore に登録・編集します。

> **ISFプロジェクト** が開発・運用しています。

---

## 管理権限の種別

| 権限 | パス | 説明 |
|---|---|---|
| **DB管理者** | `/db/*` | Firestoreの全データを閲覧・作成・編集・削除できる上位権限 |
| **運営オペレーター** | `/admin/*` | 混雑状況更新・通知送信など当日運営向けの限定操作 |

認証は JWT ベースの HTTPOnly Cookie（`db_session` / `admin_session`）で管理します。

---

## 機能一覧

### DB管理者（`/db/*`）

| 機能 | パス | 説明 |
|---|---|---|
| ブース管理 | `/db/booth` | ブースの作成・編集・削除（クラス/部活/飲食/有志/委員会） |
| イベント管理 | `/db/event` | タイムテーブルの作成・編集・遅延設定 |
| お知らせ管理 | `/db/notice` | 通知の作成・編集・削除 |
| 飲食管理 | `/db/eat` | キッチンカー・PTAバザーのメニュー・価格・商品画像設定 |
| マップ設定 | `/db/map` | フロアマップ画像 URL の更新 |
| ファイル設定 | `/db/files` | デジタルパンフレット PDF URL の更新・値クリア |
| 設定管理 | `/db/config` | システム設定（Bluetooth baseline 等） |
| 機能 ON/OFF | `/db/features` | viewer・admin の各機能をトグルスイッチで制御 |
| アカウント管理 | `/db/accounts` | 運営オペレーターアカウントの有効/無効を一括制御 |
| 変更ログ | `/db/changelog` | 全操作の変更履歴を閲覧 |

### 運営オペレーター（`/admin/*`）

| 機能 | パス | 説明 |
|---|---|---|
| 混雑状況更新 | `/admin/booth` | ブースごとの混雑ステータスをリアルタイム更新 |
| お知らせ送信 | `/admin/notice` | FCM プッシュ通知付きで通知を即時送信 |
| イベント遅延管理 | `/admin/event` | 当日の遅延・変更を即時反映 |
| マイブース | `/admin/mybooth` | 担当ブースのみを表示・編集 |
| 飲食管理 | `/admin/eat` | 担当飲食ブースのメニュー更新 |
| 操作ログ | `/admin/logs` | 自分の操作履歴を確認 |

---

## 技術スタック

| 技術 | バージョン | 用途 |
|---|---|---|
| Next.js (App Router) | 16 | フロントエンド・Server Actions |
| Firebase Admin SDK | — | Firestore 読み書き（サーバーサイド） |
| Firebase Admin Messaging | — | FCM プッシュ通知送信 |
| Tailwind CSS | — | スタイリング |
| Vercel | — | ホスティング |

---

## 環境変数

`.env.local` に以下を設定してください。

```env
# Firebase Admin SDK
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}

# JWT署名鍵（運営オペレーター・DB管理者共通）
# 生成: openssl rand -base64 32
SESSION_SECRET=your_jwt_secret_32chars_or_more

# DB管理者認証
DB_ADMIN_ID=your_db_admin_id
DB_ADMIN_PW=your_db_admin_password
DB_ADMIN_PIN=1234   # 任意。未設定時はPINステージをスキップ

# 運営オペレーター認証（JSON: {"スコープ名": "パスワード", ...}）
ADMIN_PASSWORDS={"実行委員":"password","教員":"password"}

# Viewer on-demand ISR 無効化
VIEWER_REVALIDATE_URL=https://your-viewer.vercel.app/api/revalidate
REVALIDATE_SECRET=your_secret_here   # viewer の REVALIDATE_SECRET と同一値

# Bluetooth 混雑データ受信 API
BLUETOOTH_SECRET=your_bluetooth_secret

# Firebase Realtime Database（変更ログ用）
FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com
```

> `VIEWER_REVALIDATE_URL` / `REVALIDATE_SECRET` は通知・ブース・イベント更新時に  
> Viewer 側の ISR キャッシュを即時無効化するために使用します。

---

## ブランチ運用

| ブランチ | 役割 |
|---|---|
| `main` | 本番環境（Vercel 本番デプロイ） |
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

## ディレクトリ構成

```
src/
├── app/
│   ├── db/                        # DB管理者画面（要 db_session Cookie）
│   │   ├── booth/                 # ブース管理
│   │   ├── event/                 # イベント管理
│   │   ├── notice/                # お知らせ管理
│   │   ├── eat/                   # 飲食ブース管理
│   │   ├── map/                   # マップ URL設定
│   │   ├── files/                 # パンフ URL設定
│   │   ├── config/                # システム設定
│   │   ├── changelog/             # 変更ログ
│   │   ├── DbShell.tsx            # DB管理者共通レイアウト
│   │   └── layout.tsx             # 認証ガード
│   ├── (admin-auth)/admin/        # 運営オペレーター画面（要 admin_operator Cookie）
│   │   ├── booth/                 # 混雑状況更新
│   │   ├── notice/                # 通知送信・管理
│   │   ├── event/                 # 遅延管理
│   │   ├── mybooth/               # マイブース
│   │   ├── eat/                   # 担当飲食ブース
│   │   └── logs/                  # 操作ログ
│   └── api/
│       ├── admin/login/           # ログイン（POST）
│       ├── admin/logout/          # ログアウト（POST）
│       ├── admin/check-failover/  # フェイルオーバー確認（POST, 認証必須）
│       ├── admin/register-fcm/    # FCM トークン登録（POST, 認証必須）
│       ├── booth/update/          # 混雑状況更新（POST, 認証必須）
│       ├── booth/bluetooth/       # Bluetooth 混雑データ受信（POST, Bearer認証）
│       ├── event/update/          # イベント更新（POST, 認証必須）
│       ├── notice/send/           # 通知送信（POST, 認証必須）
│       ├── notice/update/         # 通知更新（POST, 認証必須）
│       ├── notice/delete/         # 通知削除（POST, 認証必須）
│       ├── logs/list/             # 変更ログ取得（GET, 認証必須）
│       ├── revalidate/            # Viewer ISR 無効化中継（POST, シークレット認証）
│       ├── firebase-sw-config/    # Service Worker 向け Firebase 設定
│       └── health/                # ヘルスチェック（GET, 認証なし）
├── components/
│   ├── DeleteButton.tsx           # 削除ボタン（確認ダイアログ付き）
│   ├── ConfirmDialog.tsx          # 確認ダイアログ
│   ├── LoadingOverlay.tsx         # 送信中オーバーレイ
│   └── AdminFcmInit.tsx           # 管理者向け FCM 初期化
├── hooks/
│   └── useConfirm.ts              # 確認ダイアログ Promise フック
└── lib/
    ├── firebase-admin.ts          # Admin SDK 初期化・getDb()・nowTimestamp()
    ├── admin-auth.ts              # 運営オペレーター認証（JWT Cookie）
    ├── admin-scope.ts             # スコープ取得ユーティリティ
    ├── auth.ts                    # DB管理者認証（JWT Cookie）
    ├── changelog.ts               # 変更ログ保存
    ├── fcm-notify.ts              # FCM プッシュ通知送信
    ├── revalidate.ts              # Viewer ISR 無効化（共通）
    └── notice-constants.ts        # 通知ターゲット・種別定数（共通）
```

---

## セキュリティ

- DB管理者・運営オペレーターはそれぞれ独立したパスワード認証
- JWT は HTTPOnly Cookie で管理し、XSS 対策済み
- 全 API エンドポイントは認証チェック済み（`/health` のみ公開）
- Bluetooth データ受信 API は Bearer トークン認証
- Viewer ISR 無効化 API はシークレットキーで保護

---

## ライセンス

© 2026 ISFプロジェクト  
本リポジトリのコードは学校行事目的のみに使用します。
