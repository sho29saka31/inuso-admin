# API 仕様 — inuso-admin

## エンドポイント一覧

| メソッド | パス | 認証 | 概要 |
|---|---|---|---|
| POST | `/api/admin/login` | なし | スコープ+パスワードで JWT Cookie を発行 |
| POST | `/api/admin/logout` | なし | JWT Cookie を削除 |
| POST | `/api/admin/check-failover` | Cookie | Bluetooth フェイルオーバー確認・切替 |
| POST | `/api/admin/register-fcm` | Cookie | 運営スタッフ FCM トークンを登録 |
| POST | `/api/booth/update` | Cookie | ブース混雑状況を手動更新 |
| POST | `/api/booth/bluetooth` | Bearer | Bluetooth デバイス数を受信し混雑レベルを算出 |
| POST | `/api/event/update` | Cookie | イベント情報を更新 |
| POST | `/api/notice/send` | Cookie | お知らせを送信（FCM 含む） |
| POST | `/api/notice/update` | Cookie | お知らせを更新（FCM なし） |
| POST | `/api/notice/delete` | Cookie | お知らせを削除 |
| GET | `/api/logs/list` | Cookie | 変更ログ一覧を取得 |
| POST | `/api/revalidate` | `REVALIDATE_SECRET` | viewer ISR キャッシュを無効化（転送） |
| GET | `/api/health` | なし | ヘルスチェック |

---

## POST /api/admin/login

スコープとパスワードを照合し、JWT Cookie `admin_operator` を発行します。

### 認証

なし

### リクエスト

```json
{
  "scope": "実行委員",
  "password": "secret-password"
}
```

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| `scope` | string | ✓ | 所属・担当（スコープ）名 |
| `password` | string | ✓ | スコープに対応したパスワード |

パスワードはサーバー環境変数 `ADMIN_PASSWORDS`（JSON 形式）で管理されます。

### レスポンス

**成功 (200)** — `Set-Cookie: admin_operator=<JWT>` を付与

```json
{ "ok": true }
```

**失敗 (401)**

```json
{ "error": "unauthorized" }
```

---

## POST /api/admin/logout

`admin_operator` Cookie を削除します。

### 認証

なし

### レスポンス

```json
{ "ok": true }
```

---

## POST /api/admin/check-failover

Bluetooth データ未受信が 3 分を超えた場合、手動モードに自動切替（フェイルオーバー）し、FCM 通知を送信します。5 分ごとにリマインダー通知を再送します。

### 認証

`admin_operator` Cookie 必須

### リクエスト

なし（ボディ不要）

### レスポンス

```json
{
  "ok": true,
  "result": "ok"
}
```

`result` の取りうる値:

| 値 | 説明 |
|---|---|
| `ok` | 正常（フェイルオーバー不要） |
| `switched_to_manual` | フェイルオーバー実行・手動モードに切替 |
| `reminder_sent` | リマインダー FCM 通知を送信 |
| `manual_by_human` | 人手による手動モード中（スキップ） |
| `no_data_yet` | まだデータなし |
| `no_booth` | 対象ブースなし |

---

## POST /api/admin/register-fcm

運営スタッフの FCM トークンを Firestore `adminFcmTokens/{scope}` に保存します。

### 認証

`admin_operator` Cookie 必須

### リクエスト

```json
{ "token": "fcm-device-token-string" }
```

### レスポンス

```json
{ "ok": true }
```

---

## POST /api/booth/update

ブースの混雑状況を手動更新し、変更ログを RTDB に保存します。更新後に viewer ISR キャッシュを無効化します。

### 認証

`admin_operator` Cookie 必須

### リクエスト

```json
{
  "boothId": "1-1",
  "status": 3,
  "waitCount": 10,
  "isManual": true,
  "products": []
}
```

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| `boothId` | string | ✓ | ブース ID（存在しない場合は 400） |
| `status` | number | ✓ | 混雑レベル 0〜5 |
| `waitCount` | number | ✓ | 待機人数 |
| `isManual` | boolean | | 手動モードフラグ |
| `products` | unknown[] | | 飲食メニュー |

### レスポンス

```json
{ "ok": true }
```

---

## POST /api/booth/bluetooth

Bluetooth デバイス数を受信し、C-3 ハイブリッドアルゴリズムで混雑レベル（1〜5）を算出して Firestore を更新します。手動モード中はスキップします。フェイルオーバー状態の場合は自動復旧します。

### 認証

`Authorization: Bearer <BLUETOOTH_SECRET>` ヘッダー必須

### リクエスト

```json
{
  "boothId": "1-1",
  "deviceCount": 42,
  "operatorId": "surface-go-01"
}
```

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| `boothId` | string | ✓ | ブース ID |
| `deviceCount` | number | ✓ | 検出 Bluetooth デバイス数 |
| `operatorId` | string | | 送信端末 ID |

### レスポンス

**通常更新**

```json
{ "ok": true, "status": 3 }
```

**手動モード中（スキップ）**

```json
{ "ok": true, "skipped": true, "reason": "manual mode" }
```

#### C-3 混雑レベルアルゴリズム

- Rolling window: 直近 30 件のデバイス数を保持
- baseline: `baselineMax`（朝のテスト計測値）または rolling window の最大値

| ratio (deviceCount / baseline × 100) | レベル | 説明 |
|---|---|---|
| ≤ 15% | 1 | 空 |
| ≤ 35% | 2 | やや空 |
| ≤ 55% | 3 | 普通 |
| ≤ 75% | 4 | 混雑 |
| > 75% | 5 | 満員 |

---

## POST /api/event/update

イベント情報を更新し、viewer ISR キャッシュを無効化します。

### 認証

`admin_operator` Cookie 必須

### リクエスト

```json
{
  "eventId": "event-001",
  "startTime": "2026-06-21T10:00:00+09:00",
  "isDelayed": false
}
```

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| `eventId` | string | ✓ | イベント ID |
| `startTime` | unknown | | 開始時刻 |
| `isDelayed` | boolean | | 遅延フラグ |

### レスポンス

```json
{ "ok": true }
```

---

## POST /api/notice/send

お知らせを Firestore に保存 → FCM トピックに一斉送信 → viewer ISR キャッシュを無効化します。

### 認証

`admin_operator` Cookie 必須

### リクエスト

```json
{
  "authorId": "実行委員",
  "title": "重要なお知らせ",
  "body": "本文テキスト",
  "target": "all",
  "type": "info"
}
```

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| `authorId` | string | ✓ | 送信者スコープ |
| `title` | string | ✓ | タイトル |
| `body` | string | ✓ | 本文 |
| `target` | string | | FCM トピック（`"all"` / `"guest"` / `"edu"` / `"prof"` / `"1nen"` / `"2nen"` / `"3nen"`）、限定アカウントは `"all"` のみ |
| `type` | string | | 種別（`"urgent"` / `"info"` / `"warning"` / `"other"`） |

### レスポンス

```json
{ "ok": true, "noticeId": "abc123" }
```

---

## POST /api/notice/update

Firestore のお知らせを更新します（FCM 再送なし）。更新後に viewer ISR キャッシュを無効化します。

### 認証

`admin_operator` Cookie 必須

### リクエスト

```json
{
  "noticeId": "abc123",
  "authorId": "実行委員",
  "title": "修正後タイトル",
  "body": "修正後本文",
  "target": "all",
  "type": "info"
}
```

### レスポンス

```json
{ "ok": true }
```

---

## POST /api/notice/delete

Firestore からお知らせを削除し、viewer ISR キャッシュを無効化します。

### 認証

`admin_operator` Cookie 必須

### リクエスト

```json
{ "noticeId": "abc123" }
```

### レスポンス

```json
{ "ok": true }
```

---

## GET /api/logs/list

RTDB `changeLogs` から最新の変更ログを取得します。

### 認証

`admin_operator` Cookie 必須

### クエリパラメータ

| パラメータ | 型 | デフォルト | 最大 | 説明 |
|---|---|---|---|---|
| `limit` | number | 50 | 200 | 取得件数 |

### レスポンス

```json
[
  {
    "logId": "log-001",
    "operatorId": "実行委員",
    "targetCollection": "booths",
    "targetId": "1-1",
    "changeType": "update",
    "changedFields": { "status": 3 },
    "changedAt": { "display": "2026-06-22 14:30", "unix": 1750556200 }
  }
]
```

---

## POST /api/revalidate

viewer の `/api/revalidate` にリクエストを転送します。

### 認証

リクエストボディの `secret` が `REVALIDATE_SECRET` と一致する必要があります。

### リクエスト

```json
{
  "secret": "your-revalidate-secret",
  "paths": ["/", "/notices"]
}
```

### レスポンス

viewer からの転送結果、または `{ "ok": true }`

---

## GET /api/health

Firestore への接続確認を行うヘルスチェックエンドポイントです。

### 認証

なし

### レスポンス

**正常 (200)**

```json
{ "ok": true }
```

**異常 (503)**

```json
{ "ok": false }
```
