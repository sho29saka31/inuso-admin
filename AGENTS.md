<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# inuso-admin 開発ガイド（Claude Code 向け）

## ブランチ運用

- **必ず `claudecode` ブランチで開発**すること
- コミットメッセージは日本語で簡潔に
- push 後は `dev` 向け draft PR を作成すること

## 共通ライブラリ

以下は必ず共通モジュールを使うこと。重複実装禁止。

| 用途 | モジュール |
|---|---|
| Firestore 接続 | `src/lib/firebase-admin.ts` の `getDb()` / `nowTimestamp()` |
| 運営オペレーター認証 | `src/lib/admin-auth.ts` の `getOperatorId()` / `getAdminScope()` |
| DB管理者認証 | `src/lib/auth.ts` |
| 変更ログ保存 | `src/lib/changelog.ts` の `saveChangeLog()` |
| Viewer ISR 無効化 | `src/lib/revalidate.ts` の `revalidateViewer(paths)` |
| FCM 通知送信 | `src/lib/fcm-notify.ts` の `sendAdminNotification()` |
| 通知ターゲット定数 | `src/lib/notice-constants.ts` の `ALL_TARGETS` / `NON_TEACHER_TARGETS` / `TYPE_OPTIONS` |
| 削除ボタン | `src/components/DeleteButton.tsx` の `DeleteButton` |
| 確認ダイアログ | `src/components/ConfirmDialog.tsx` / `src/hooks/useConfirm.ts` |

## 認証フロー

### 運営オペレーター（`/admin/*`）
- Cookie: `admin_operator`（JWT）
- 認証: `getOperatorId()` で operatorId を取得（null なら 401）
- スコープ: `getAdminScope()` でスコープを取得（全オペレーター操作の前に確認）
- ログイン: `POST /api/admin/login`、ログアウト: `POST /api/admin/logout`

### DB管理者（`/db/*`）
- Cookie: `db_session`（JWT）
- 認証: `src/lib/auth.ts` 参照
- ログイン: `/db` ページのフォーム（`LoginForm.tsx` / `actions.ts`）

## API ルールの注意

- 全 POST エンドポイントは認証必須（`getOperatorId()` or `getAdminScope()` でチェック）
- `/api/health` のみ認証不要（公開エンドポイント）
- `/api/booth/bluetooth` は Bearer トークン認証（`BLUETOOTH_API_SECRET`）
- お知らせの作成・更新・削除後は必ず `revalidateViewer(["/notice", "/top"])` を呼ぶ
- ブース・イベント更新後は必ず `revalidateViewer(["/busy", "/booth"])` 等を呼ぶ

## 変更ログの記録

データ変更後は必ず `saveChangeLog()` を呼ぶこと：

```ts
await saveChangeLog({
  operatorId,
  targetCollection: "booths",
  targetId: boothId,
  changeType: "update",      // "create" | "update" | "delete"
  changedFields: fields,
});
```

## お知らせ送信の仕様

通知作成時の動作順序：
1. Firestore `notices` コレクションに保存
2. FCM push 通知を送信（`target` トピックに送信）
3. `revalidateViewer(["/notice", "/top"])` で Viewer ISR を即時更新

更新・削除時は FCM 送信なし、ISR 更新のみ。

## スコープ制限

運営オペレーターには `scope` フィールドがあり、担当ブース・飲食のみ操作可能な制限アカウントが存在する。

- フルアクセス確認: `isFullAccess(scope)` （`src/lib/admin-scope.ts` 参照）
- 限定スコープのオペレーターは `target: "all"` の通知のみ送信可能（`prof` 等は選択不可）

## よくある注意点

- `db/*/DeleteButton.tsx` は `src/components/DeleteButton.tsx` の re-export。直接インポートを追加するなら `src/components/DeleteButton.tsx` を使うこと
- `await` を含むイベントハンドラでは `currentTarget` を先に変数に保存すること（React の合成イベントプール問題）
- Firestore の Timestamp は `nowTimestamp()` で生成すること（`admin.firestore.FieldValue.serverTimestamp()` と互換）
