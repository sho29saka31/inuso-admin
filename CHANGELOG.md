# Changelog

## [Unreleased]

---

## 2026-06-23

- Docs: デプロイ手順・オペレーターアカウント管理を追加 (`docs/deployment.md`)
- Docs: 当日トラブル対処法を追加 (`docs/troubleshooting.md`)
- Docs: Bluetooth 連携仕様・C-3アルゴリズム・フェイルオーバー仕様・当日運用フローを追加 (`docs/bluetooth.md`)
- Docs: コントリビューションガイド（セキュリティチェックリスト付き）を追加 (`CONTRIBUTING.md`)
- Docs: PRテンプレートを追加 (`.github/PULL_REQUEST_TEMPLATE.md`)
- Docs: API仕様書（全13エンドポイント）を追加 (`docs/api-spec.md`)
- Docs: アーキテクチャ図（Mermaid）を追加 (`docs/architecture.md`)
- Docs: Firestore・RTDBデータモデル定義を追加 (`docs/data-model.md`)
- Docs: README・AGENTS.md をリファクタリング後の構成に合わせて更新

---

## 2026-06-22

- Refactor: `revalidateViewer()` を `src/lib/revalidate.ts` に共通化（5つの API ルートの重複解消）
- Refactor: `DeleteButton` を `src/components/DeleteButton.tsx` に統合（3つの重複コンポーネント解消）
- Refactor: 通知定数（`ALL_TARGETS`・`NON_TEACHER_TARGETS`・`TYPE_OPTIONS`）を `src/lib/notice-constants.ts` に共通化
- Refactor: `AdminNoticeClient` の `isFullAccess(scope)` 重複呼び出しを `scopeLocked` 変数に統一
- Refactor: `EventForm.tsx` の未使用 `useState` import を削除
- Feat: ログインの所属・担当に保健委員会を追加
- Fix: ログインページから担当者名入力を削除（所属とパスワードのみに簡略化）
- Fix: 通知送信ページのオーバーレイ文言を「送信中...」に変更
- Security: クラス・部活等の限定アカウントの通知送信対象を `all` のみに固定
- Security: `/admin/booth` を限定アクセスから保護
- Feat: DB管理フォームに保存中オーバーレイを追加
- Fix: クラス・部活・委員会の担当者はマイブースから編集ページに直接リダイレクト
- Feat: 飲食フォームにも `scope` フィールドを追加
- Fix: 全フォームで `await` 前に `currentTarget` を変数に保存（`FormData` エラー修正）
- Revert: `adminFcmTokens` の Realtime Database 移行をリバート（Firestore に戻す）
- Feat: ブースフォームに `scope` フィールドを追加（FCM 通知ルーティング用）
- Refactor: `changeLog` を Firestore → Realtime Database に移行
- Refactor: Vercel Cron を廃止→AdminShell の 2 分ポーリングに変更（Hobby プラン対応）
- Feat: `baselineMax` 対応・Bluetooth フェイルオーバー自動切替・FCM 通知実装
- Security: ログインパスワード認証を追加・型チェック強化・ログ ID 衝突修正
- Fix: 存在しない `boothId` は 400 を返す（自動生成しない）
- Feat: ヘルスチェックエンドポイント `/api/health` を追加
- Fix: Bluetooth API を `update` → `set(merge)` に変更（500 エラー修正）・`lastBluetoothAt` の記録を追加

---

## 2026-06-21

- Chore: ステータスページ関連ファイルを削除（Instatus 移行完了）
- Fix: ステータスページを Instatus にリダイレクト

---

## 2026-06-20

- Feat: カスタム確認ダイアログを導入（全 `confirm()` をサイト独自モーダルに置換）
- Feat: `/status` を公開ページとして追加（認証不要・viewer 風レイアウト）
- Feat: Sentry エラー監視を導入
- Fix: Sentry ビルドエラー修正（`onRequestError` 動的インポート対応・非推奨オプション削除）
- Fix: Sentry 設定を Next.js 16 推奨構成に修正
- Feat: 管理画面の編集フォームに読み込みオーバーレイを追加
- Feat: DB イベントページをデイグループ表示に変更
- Fix: イベント詳細の改行を `whitespace-pre-wrap` で保持
- Fix: ドロップダウンのプレースホルダーオプションを無効化
- Feat: スコープ別の通知発信元・対象を実装（`/admin/notice`）
- Fix: ブース・飲食のフェッチとスコープマッチングを修正
- Fix: ログイン・マイブース・ナビ・イベント表示の複数修正

---

## 2026-06-19

- Fix: TypeScript 型エラーを修正（`DocumentData` → `Notice` キャスト）
- Feat: ブース手動/自動切替・イベント時刻/場所・飲食商品売切・通知編集削除を追加
- Feat: スコープ別アクセス制御を実装（実行委員追加・委員会削除）
- Feat: 担当スコープ選択・マイブース・通知履歴ページを追加
- Feat: 運営管理者向け飲食混雑状況更新ページを追加
- Fix: FCM 送信を `data` のみにして二重通知を修正
- Feat: DB 画面の UI 改善・ログイン動線変更
- Fix: Bluetooth API を Bearer 認証・`deviceCount` 受信・混雑レベル算出に対応
- Feat: favicon を `logo.png` に変更
- Feat: ヘッダーに `logo.png` を適用（DB管理・運営管理）
- Fix: ブース委員会追加・全項目編集可・通知種別を先頭へ・ファイル画面を現在値テキスト表示に変更
- Design: プライマリカラーをティールグリーン（`#1EA78C`）に変更
- Chore: Claude カスタムコマンドを追加
- Fix: admin 通知フォームを `type` 対応に統一・全種別で FCM 送信・`isUrgent` 参照を排除
- Feat: 通知作成時に全 `type` で FCM プッシュを送信
- Perf: `useTransition` で `BoothForm`・`EventForm`・`EatForm`・`NoticeForm` の INP を改善

---

## 2026-06-18

- Feat: ファイルタブ統合・通知 `type` フィールド対応・削除時キャッシュ更新
- Fix: イベント遅延表示の絵文字を SVG に変更
- Feat: `/admin/*` 運営管理セクションを実装（Phase 4 & 5）
- Feat: FCM 通知 API を実装
- Feat: マップ設定ページをナビに追加
- Feat: お知らせ発信元ドロップダウン・カレンダーピッカー・変更ログビューワーを追加
- Fix: ナビバーのアクティブタブに下線を表示
- Fix: 飲食ブースの `name` フィールドを `shopName` と統一
- Feat: 管理 DB 全ページに `force-dynamic` を追加（常に最新データを取得）
- Feat: 飲食作成をブース管理に統合（`eat` カテゴリ専用フォーム・商品・インスタ編集ページを分離）
- Feat: 飲食管理ページを統合（店名・インスタ・商品一覧・画像URL・混雑状況フィールドに刷新）
- Fix: DB ログインページでナビバー・ログアウトボタンを非表示
- Fix: TypeScript 型エラー修正（`unknown`・`Record<string, unknown>` キャスト）
- Fix: middleware → proxy 移行・`checkCredential` を async に修正
- Feat: Phase 3 DB 管理セクション実装（3段階認証 + 全 CRUD）
- Feat: フォント・Tailwind カラー変数をセットアップ

---

## 2026-06-17

- Feat: Next.js プロジェクトを初期化

---

## 2026-06-14

- Chore: リポジトリを作成
