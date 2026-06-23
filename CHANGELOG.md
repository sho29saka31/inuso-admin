# Changelog

## [Unreleased]

## 2026-06-23

- Docs: ドキュメント整備 — README・AGENTS.md を現在のコード構成に合わせて更新

## 2026-06-22

- Refactor: コードの共通化・重複解消（`revalidate` 共通化・`DeleteButton` 統合・`notice-constants` 共通化）
- Added: ログインの所属・担当に「保健委員会」を追加
- Changed: ログインページから担当者名入力を削除 — 所属とパスワードのみに簡略化
- Changed: 通知送信ページのオーバーレイ文言を「送信中...」に変更
- Changed: クラス・部活等の限定アカウントの通知送信対象を `all` のみに固定
- Security: `/admin/booth` を限定アクセスから保護・DB 管理フォームに保存中オーバーレイ追加
- Changed: クラス・部活・委員会担当者はマイブースから編集ページに直接リダイレクト
- Added: 飲食フォームに `scope` フィールドを追加
- Fixed: 全フォーム — `await` 前に `currentTarget` を保存して `FormData` エラーを修正
- Refactor: `adminFcmTokens` の Firestore → Realtime Database 移行をリバート（Firestore に戻す）
- Added: ブースフォームに `scope` フィールドを追加（FCM 通知ルーティング用）
- Changed: `changeLog` を Firestore → Realtime Database に移行
- Changed: Vercel Cron を廃止 → AdminShell の 2 分ポーリングに変更（Hobby プラン対応）
- Added: `baselineMax` 対応・Bluetooth フェイルオーバー自動切替・FCM 通知実装
- Added: ログインパスワード認証追加・型チェック強化・ログ ID 衝突修正
- Fixed: 存在しない `boothId` は 400 を返す（自動生成しない）
- Added: ヘルスチェックエンドポイント `GET /api/health` を追加
- Fixed: Bluetooth API — `update` → `set(merge)` で 500 エラー修正・`lastBluetoothAt` 記録を追加

## 2026-06-21

- Changed: ステータスページを Instatus にリダイレクト

## 2026-06-20

- Added: 混雑状況更新 — リアルタイム反映・フェイルオーバー設計
