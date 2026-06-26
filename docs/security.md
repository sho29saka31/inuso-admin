# セキュリティガイド — inuso-admin

このドキュメントは inuso-admin のセキュリティ設計・実装・運用上の注意点をまとめたものです。

---

## 認証アーキテクチャ

### 運営オペレーター認証（`/admin/*`）

| 項目 | 詳細 |
|---|---|
| Cookie 名 | `admin_session` |
| 方式 | 署名付き JWT（HS256、`jose` ライブラリ） |
| ペイロード | `{ operatorId: string, scope: string }` |
| 有効期限 | 8 時間 |
| 署名鍵 | `SESSION_SECRET` 環境変数 |

**フロー:**

```
POST /api/admin/login
  ↓ scope + password を受信
  ↓ ADMIN_PASSWORDS[scope] と safeCompare() で検証
  ↓ setOperatorSession(scope, scope) → signed JWT を Cookie にセット
  ↓ 以降は getOperatorId() / getAdminScope() でペイロードを取得
```

> **重要**: 旧実装（PR #78 以前）では `admin_operator` と `admin_scope` が平文 Cookie で保存されており、誰でも偽造可能でした。現在は署名付き JWT に移行済みです。

### DB管理者認証（`/db/*`）

| 項目 | 詳細 |
|---|---|
| Cookie 名 | `db_session` |
| 方式 | 署名付き JWT（HS256） |
| ペイロード | `{ auth: true }` |
| 有効期限 | 8 時間 |
| 署名鍵 | `SESSION_SECRET` 環境変数（運営オペレーターと共有） |

**3段階ログインフロー:**

```
Stage 1: DB_ADMIN_ID の照合
Stage 2: DB_ADMIN_PW の照合
Stage 3: DB_ADMIN_PIN の照合（未設定時はスキップ）
  ↓ createSession() → signed JWT を Cookie にセット
  ↓ redirect("/db/booth")
```

> `DB_ADMIN_PIN` は任意設定です。未設定時は PIN ステージをスキップしてログインできます。設定する場合は数字4〜6桁を推奨します。

---

## タイミング安全な比較（`safeCompare`）

全シークレット文字列の比較は `src/lib/safe-compare.ts` の `safeCompare()` を使います。

```ts
import { safeCompare } from "@/lib/safe-compare";

// NG: 通常の文字列比較（タイミング攻撃のリスク）
if (token === process.env.SOME_SECRET) { ... }

// OK: タイミング安全な比較
if (safeCompare(token, process.env.SOME_SECRET ?? "")) { ... }
```

**適用箇所:**

| ファイル | 比較対象 |
|---|---|
| `src/app/api/admin/login/route.ts` | オペレーターパスワード |
| `src/app/api/booth/bluetooth/route.ts` | Bearer トークン |
| `src/app/api/revalidate/route.ts` | REVALIDATE_SECRET |
| `src/lib/auth.ts` | DB_ADMIN_ID / DB_ADMIN_PW / DB_ADMIN_PIN |

---

## スコープ制限（アクセス制御）

`src/lib/admin-scope.ts` の `isFullAccess(scope)` でスコープを判定します。

### フルアクセス判定

```ts
// 以下のスコープのみフルアクセス
const FULL_ACCESS_SCOPES = ["実行委員", "教員"];
```

### 制限内容

| 操作 | フルアクセス | 限定スコープ |
|---|---|---|
| 通知送信 `target` | 任意選択可 | `"all"` に強制 |
| 通知送信 `authorId` | 任意指定可 | `getScopeAuthorId(scope)` に固定 |
| 通知削除 | 全通知削除可 | 自分の通知（`authorId` 一致）のみ |
| ブース更新 | 全ブース更新可 | ブースの `scope` フィールドが一致するもののみ |
| イベント更新 | 更新可 | **403 Forbidden** |

### ブース `scope` フィールドの設定

Firestore の `booths` コレクションの各ドキュメントに `scope` フィールドを設定することで、担当クラス・部活を紐づけます。

```json
// booths/{boothId}
{
  "boothId": "booth-1-1",
  "name": "1年1組 お化け屋敷",
  "scope": "1-1",   ← これが担当スコープ
  ...
}
```

---

## Fail-Closed 設計

### `SESSION_SECRET` 未設定時

`createSession()` / `verifySession()` / JWT 検証はすべて `SESSION_SECRET` を使います。未設定の場合は `Error("SESSION_SECRET is not set")` をスローし、処理を停止します（フォールバックなし）。

### `ADMIN_PASSWORDS` 未設定時

`Object.keys(passwords).length === 0` の場合は即座に `401 Unauthorized` を返します。空設定での全員ログイン許可は発生しません。

### `REVALIDATE_SECRET` 未設定時

`POST /api/revalidate` は `envSecret` が未設定の場合、即座に `401 Unauthorized` を返します。

### Bluetooth Bearer トークン未設定時

`BLUETOOTH_SECRET` が未設定の場合、全リクエストを `401 Unauthorized` で拒否します。

---

## Server Actions の認証

`/db/*` 配下の全 Server Actions（booth / event / notice / eat）は、操作の前に必ず `verifySession()` を呼びます。

```ts
// actions.ts のパターン
export async function createBooth(formData: FormData) {
  if (!await verifySession()) throw new Error("Unauthorized");
  // ...
}
```

> フォーム送信から直接呼ばれる Server Actions は API ルートと同様に認証が必要です。

---

## 環境変数一覧（セキュリティ関連）

| 変数名 | 用途 | 必須 | 推奨値 |
|---|---|---|---|
| `SESSION_SECRET` | JWT 署名鍵（運営・DB管理者共通） | **必須** | `openssl rand -base64 32` で生成 |
| `ADMIN_PASSWORDS` | 運営オペレーターのパスワード JSON | **必須** | `{"実行委員":"...","1-1":"..."}` |
| `DB_ADMIN_ID` | DB管理者ログイン ID | **必須** | 任意の文字列 |
| `DB_ADMIN_PW` | DB管理者ログイン パスワード | **必須** | 十分な長さのランダム文字列 |
| `DB_ADMIN_PIN` | DB管理者ログイン PIN | 任意 | 数字4〜6桁（未設定時スキップ） |
| `BLUETOOTH_SECRET` | Bluetooth API Bearer トークン | **必須** | `openssl rand -hex 32` で生成 |
| `REVALIDATE_SECRET` | Viewer ISR 無効化の共有シークレット | **必須** | viewer の `REVALIDATE_SECRET` と同一の値 |

### `SESSION_SECRET` の生成

```bash
openssl rand -base64 32
# 例: K7gNU3sdo+OL0wNhqoVWhr3g6s1xYv72ol/pe/Unols=
```

> 一度設定したら変更しないこと。変更すると既存の全セッション（運営・DB管理者）が無効になります。

---

## 変更ログ（changelog）

データ変更操作はすべて Firebase Realtime Database の `changeLogs` に記録されます。

```
changeLogs/
  {collection}/
    {logId}/
      operatorId, targetCollection, targetId, changeType, changedFields, changedAt
```

- **読み取り**: `GET /api/logs/list` → フルアクセスは全ログ、限定スコープは自分の操作のみ
- **書き込み**: `src/lib/changelog.ts` の `saveChangeLog()` 経由

---

## 既知の設計上の判断

| 事項 | 判断 |
|---|---|
| お知らせのターゲットフィルタリングがクライアント側 | 意図的設計。`user_role` Cookie は認証境界でなく表示分類のみの目的。全データはサーバーから取得済みのため機密性の問題なし |
| `DB_ADMIN_PIN` 未設定時スキップ | PIN は追加の安全層として任意。未設定運用も許容設計 |
| Bluetooth 混雑 baseline の揮発 | `baselineMax` を常に設定することで回避。Firestore への永続化は将来課題 |

---

## セキュリティに関する変更を行う際の注意

1. シークレット比較は必ず `safeCompare()` を使うこと
2. 新しい API エンドポイントは `getOperatorId()` を先頭で必ず呼ぶこと
3. スコープ制限が必要な操作は `isFullAccess(scope)` で分岐すること
4. `SESSION_SECRET` などの鍵を直接コードに書かないこと（`.env.local` または Vercel 環境変数）
5. `redirect()` は try/catch の**外**に置くこと（Next.js の内部で throw される）
