# notice-create

通知を新規作成する際の確認チェックリスト。

## フォームの仕様
- **発信元 (authorId)**: クラス名 / 先生名 / その他 から選択
- **タイトル**: 必須
- **本文**: 必須
- **通知対象 (target)**: `all` / `guest` / `edu` / `prof` / `1nen` / `2nen` / `3nen`
  - `prof` は発信元が「先生」の場合のみ選択可
- **通知種別 (type)**: `urgent`(緊急) / `info`(お知らせ) / `warning`(注意) / `other`(その他)

## 作成時の動作
1. Firestore `notices` コレクションに保存
2. FCM push 通知を全 type で送信 (`target` トピックに送信)
3. Viewer のキャッシュを即時更新 (`/notice`, `/top`)

## 更新・削除時の動作
- FCM 送信なし
- Viewer キャッシュのみ更新

## 環境変数（admin に設定必要）
- `VIEWER_REVALIDATE_URL`: `https://[viewer本番URL]/api/revalidate`
- `VIEWER_REVALIDATE_SECRET`: viewer の `REVALIDATE_SECRET` と同じ値
