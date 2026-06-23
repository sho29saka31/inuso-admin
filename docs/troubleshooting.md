# トラブルシューティング — inuso-admin

当日・開発中によくある問題と対処法をまとめています。

---

## ログインできない

### 症状
ログインフォームでエラーが表示される / ログイン後に画面が変わらない。

### 対処

**1. パスワードが違います**
- `ADMIN_PASSWORDS` 環境変数の JSON に該当スコープとパスワードが設定されているか確認
- JSON の形式が正しいか確認: `{"スコープ名": "パスワード"}`
- Vercel の環境変数変更後に再デプロイされているか確認

**2. 所属・担当が一覧に存在しない**
- `/api/admin/login` の `scope` はフォームの選択値がそのまま送られる
- `ADMIN_PASSWORDS` のキーとフォームの選択肢が一致しているか確認

**3. Cookie が保存されない**
- ブラウザの Cookie が無効になっていないか確認
- サードパーティ Cookie ブロックが `admin_operator` Cookie に影響していないか確認

---

## 混雑状況を更新しても viewer に反映されない

### 症状
ブース更新後、来場者側（inuso-viewer）の表示が変わらない。

### 対処

1. `VIEWER_REVALIDATE_URL` が正しい viewer の URL を指しているか確認
2. `VIEWER_REVALIDATE_SECRET` が viewer 側の `REVALIDATE_SECRET` と一致しているか確認
3. viewer の `/api/health` にアクセスして正常稼働しているか確認
4. Vercel の Function ログで `revalidate` の呼び出しが成功しているか確認

---

## Bluetooth データが受信されない

### 症状
ブース詳細の `lastBluetoothAt` が更新されない / フェイルオーバーが頻発する。

### 対処

**1. Surface Go 2 側の問題**
- Surface Go 2 が起動しているか確認
- `bluetooth-positioning-system` の Python スクリプトが動作しているか確認
- Surface Go 2 の Wi-Fi 接続を確認

**2. 認証エラー**
- Surface Go 2 の設定ファイルの `API_TOKEN` が `BLUETOOTH_SECRET` と一致しているか確認
- `/api/booth/bluetooth` に対して手動で curl テスト:
  ```bash
  curl -X POST https://your-admin.vercel.app/api/booth/bluetooth \
    -H "Authorization: Bearer YOUR_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"boothId":"booth-001","deviceCount":5}'
  ```

**3. `boothId` が存在しない**
- 送信している `boothId` が Firestore の `booths` コレクションに存在するか確認
- 存在しない場合、API は `400 booth not found` を返す

**4. ブースが手動モード**
- Firestore でブースの `isManual: true` かつ `isManualByFailover: false` の場合、Bluetooth データはスキップされる
- `/admin/booth` から手動モードを解除する

詳細は [`docs/bluetooth.md`](./bluetooth.md) を参照してください。

---

## フェイルオーバーが頻発する

### 症状
Bluetooth データを送信しているのに、すぐ手動モードに切り替わる。

### 原因と対処

- フェイルオーバー閾値は **3分**（`FAILOVER_THRESHOLD_MS = 3 * 60 * 1000`）
- Surface Go 2 からの送信間隔が 3 分を超えていないか確認
- Bluetooth スキャン→API 送信のループが正常に動作しているか確認
- ネットワーク遅延で API タイムアウトが発生していないか確認

---

## お知らせ送信後、プッシュ通知が届かない

### 症状
通知を送信したが、来場者のデバイスに届かない。

### 対処

1. FCM の送信エラーを Vercel Function ログで確認
2. `FIREBASE_SERVICE_ACCOUNT_JSON` に Cloud Messaging の権限が含まれているか確認
3. 来場者が通知を許可しているか確認（viewer 側の問題）
4. `target` トピックに購読者がいるか確認（`fcmTokens` コレクション）

---

## 変更ログが記録されない

### 症状
操作後、`/db/changelog` や `/admin/logs` に変更が表示されない。

### 対処

- RTDB（Realtime Database）への書き込みが失敗している可能性
- `FIREBASE_SERVICE_ACCOUNT_JSON` に RTDB の書き込み権限があるか確認
- Firebase コンソール → Realtime Database → ルールを確認:
  ```json
  {
    "rules": {
      ".read": false,
      ".write": false,
      "changeLogs": {
        ".read": "auth != null",
        ".write": "auth != null"
      }
    }
  }
  ```
  Admin SDK はルールをバイパスするため、通常は問題なし

---

## `/db/*` ページが認証ループする

### 症状
DB管理者ページにアクセスすると、ログイン → 再度ログインのループになる。

### 対処

1. `DB_SESSION_SECRET` が設定されているか確認
2. `DB_ADMIN_PASSWORD` が正しいか確認
3. ブラウザの Cookie を削除して再度ログイン
4. HTTPOnly Cookie (`db_session`) がブラウザに保存されているか開発者ツールで確認

---

## AdminShell のフェイルオーバーチェックが動作しない

### 症状
AdminShell の 2 分ポーリングで `check-failover` が呼ばれない。

### 対処

- `/admin/*` 画面を開いた状態でブラウザの開発者ツール → Network タブで `/api/admin/check-failover` の定期呼び出しを確認
- `admin_operator` Cookie が有効か確認（無効だと 401 が返り、以降の呼び出しも失敗）

---

## Vercel ビルドエラー

### 対処

1. Vercel ダッシュボード → Deployments → Build Logs を確認
2. よくある原因:
   - `FIREBASE_SERVICE_ACCOUNT_JSON` が未設定または不正な JSON
   - TypeScript エラー（`npm run build` をローカルで実行して確認）
   - `ADMIN_PASSWORDS` が不正な JSON 形式
