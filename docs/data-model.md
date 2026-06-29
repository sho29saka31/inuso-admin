# データモデル — inuso-admin

## Firestore

### コレクション: `booths/{boothId}`

ブースの基本情報と混雑状況を管理します。admin からの手動更新および Bluetooth API による自動更新が行われます。

| フィールド | 型 | 説明 | 取りうる値 |
|---|---|---|---|
| `boothId` | string | ブース識別子（ドキュメント ID と同一） | `"1-1"`, `"eスポーツ部"` など |
| `name` | string | ブース表示名 | 任意文字列 |
| `category` | string | ブース種別 | `"class"` / `"club"` / `"food"` / `"volunteer"` / `"committee"` |
| `scope` | string | FCM 通知ルーティング用スコープ（ログイン担当と一致） | 例: `"1-1"`, `"eスポーツ部"` |
| `status` | number | 混雑レベル | `0`（未設定）〜 `5`（満員） |
| `waitCount` | number | 待機人数 | 0 以上の整数 |
| `isManual` | boolean | 手動モードフラグ（true のとき Bluetooth 更新をスキップ） | `true` / `false` |
| `isManualByFailover` | boolean | フェイルオーバーによる手動フラグ | `true` / `false` |
| `failoverAt` | Timestamp \| null | フェイルオーバー発生時刻 | Firestore Timestamp または null |
| `lastBluetoothAt` | Timestamp \| null | 最後に Bluetooth データを受信した時刻 | Firestore Timestamp または null |
| `lastManualReminderAt` | Timestamp \| null | 最後にリマインダー通知を送った時刻 | Firestore Timestamp または null |
| `baselineMax` | number \| null | 満員時のデバイス数（朝の計測値、C-3 算出に使用） | 0 以上の整数または null |
| `products` | unknown[] | 飲食ブースのメニュー情報 | 配列（飲食ブースのみ） |
| `updatedAt` | Timestamp | 最終更新日時 | Firestore Timestamp |

**存在しない `boothId` への操作は 400 を返します（自動生成しません）。**

---

### コレクション: `notices/{noticeId}`

来場者向けお知らせを管理します。

| フィールド | 型 | 説明 | 取りうる値 |
|---|---|---|---|
| `noticeId` | string | お知らせ識別子（ドキュメント ID と同一） | 自動生成 ID |
| `title` | string | タイトル | 任意文字列 |
| `body` | string | 本文 | 任意文字列 |
| `authorId` | string | 送信者スコープ | 例: `"実行委員"` |
| `target` | string | FCM 送信トピック | `"all"` / `"guest"` / `"edu"` / `"prof"` / `"1nen"` / `"2nen"` / `"3nen"` |
| `type` | string | お知らせ種別 | `"urgent"` / `"info"` / `"warning"` / `"other"` |
| `createdAt` | Timestamp | 作成日時 | Firestore Timestamp |

**限定アカウント（クラス・部活・委員会担当）は `target` を `"all"` のみに制限されます。**

---

### コレクション: `events/{eventId}`

文化祭イベントのスケジュールを管理します。

| フィールド | 型 | 説明 | 取りうる値 |
|---|---|---|---|
| `eventId` | string | イベント識別子（ドキュメント ID と同一） | 任意文字列 |
| `title` | string | イベント名 | 任意文字列 |
| `startTime` | Timestamp | 開始時刻 | Firestore Timestamp |
| `endTime` | Timestamp | 終了時刻 | Firestore Timestamp |
| `location` | string | 開催場所 | 任意文字列 |
| `isDelayed` | boolean | 遅延フラグ | `true` / `false` |
| `delayMinutes` | number（任意） | 遅延分数 | 正の整数 |

---

### コレクション: `adminFcmTokens/{scope}`

運営スタッフの FCM トークンを管理します。スコープ単位で 1 ドキュメント（最新端末のみ保持）。

| フィールド | 型 | 説明 | 取りうる値 |
|---|---|---|---|
| `token` | string | FCM デバイストークン | FCM トークン文字列 |
| `updatedAt` | string | 最終更新日時（ISO 文字列） | ISO 8601 形式 |

---

### コレクション: `fcmTokens/{tokenSuffix}`

来場者の FCM トークンとトピック購読状況を管理します（viewer 側で書き込み）。

| フィールド | 型 | 説明 | 取りうる値 |
|---|---|---|---|
| `token` | string | FCM デバイストークン | FCM トークン文字列 |
| `topics` | string[] | 購読中のトピック名 | `["all"]` など |
| `updatedAt` | string | 最終更新日時（ISO 文字列） | ISO 8601 形式 |

---

### ドキュメント: `config/bluetooth`

Bluetooth 計測の設定パラメータを管理します。

| フィールド | 型 | 説明 |
|---|---|---|
| `baselineMax` | Record\<boothId, number\> | ブースごとの満員時デバイス数マップ |

その他 Bluetooth 算出に関わる設定パラメータを含む場合があります。

---

### ドキュメント: `config/viewer_features`

inuso-viewer の各機能フラグを管理します。DB管理者画面 `/db/features` から変更します。

| フィールド | 型 | 説明 | デフォルト |
|---|---|---|---|
| `service` | boolean | Viewer サービス全体の公開 | `true` |
| `event` | boolean | イベントスケジュール機能 | `true` |
| `booth` | boolean | ブース一覧機能 | `true` |
| `busy` | boolean | 混雑状況機能 | `true` |
| `eat` | boolean | 飲食エリア機能 | `true` |
| `notice` | boolean | お知らせ機能 | `true` |
| `digital` | boolean | デジタルパンフレット機能 | `true` |
| `map` | boolean | 校内マップ機能 | `true` |

> `service: false` にすると viewer 全ページがメンテナンス画面に切り替わります。

---

### ドキュメント: `config/admin_features`

inuso-admin の各機能フラグを管理します。DB管理者画面 `/db/features` から変更します。

| フィールド | 型 | 説明 | デフォルト |
|---|---|---|---|
| `service` | boolean | Admin サービス全体の公開 | `true` |
| `notice` | boolean | お知らせ管理機能 | `true` |
| `booth` | boolean | ブース管理機能 | `true` |
| `event` | boolean | イベント管理機能 | `true` |
| `eat` | boolean | 飲食ブース管理機能 | `true` |

---

### ドキュメント: `config/admin_accounts`

運営オペレーターアカウントの有効/無効状態を管理します。DB管理者画面 `/db/accounts` から変更します。

```json
{
  "1-1": true,
  "eスポーツ部": false
}
```

- キーはスコープ名、値は有効状態（`true` = 有効、`false` = 無効）
- **未登録のスコープは有効（`true`）扱い**
- `false` に設定するとログイン時に 401 を返す

---

### ドキュメント: `config/map`

viewer のマップページで表示するフロアマップ画像 URL を管理します。

| フィールド | 型 | 説明 |
|---|---|---|
| `imageUrl` | string | フロアマップ画像の URL |

---

## Realtime Database (RTDB)

### ノード: `changeLogs/{targetId}/{logId}`

ブース・お知らせ・イベントへの変更操作ログを記録します。Vercel Cron 廃止後は AdminShell の 2 分ポーリングで参照されます。

| フィールド | 型 | 説明 | 取りうる値 |
|---|---|---|---|
| `logId` | string | ログ識別子（衝突しないよう生成） | 一意の文字列 |
| `operatorId` | string | 操作者スコープ | 例: `"実行委員"`, `"1-1"` |
| `targetCollection` | string | 操作対象コレクション名 | `"booths"` / `"notices"` / `"events"` |
| `targetId` | string | 操作対象ドキュメント ID | 例: `"1-1"`, `"abc123"` |
| `changeType` | string | 操作種別 | `"create"` / `"update"` / `"delete"` |
| `changedFields` | Record\<string, unknown\> | 変更されたフィールドと新しい値 | 例: `{ "status": 3, "waitCount": 10 }` |
| `changedAt.display` | string | 変更日時（表示用文字列） | 例: `"2026-06-22 14:30"` |
| `changedAt.unix` | number | 変更日時（Unix タイムスタンプ・秒） | 例: `1750556200` |

**取得は `GET /api/logs/list?limit=50`（最大 200 件）で行います。**
