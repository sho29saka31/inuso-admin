# システム構成・アーキテクチャ — inuso-admin

## 概要

inuso-admin は文化祭運営スタッフ向けの管理画面です。Bluetooth センサーからのデバイス数を受信して混雑レベルを算出し、Firestore へ保存します。更新後は inuso-viewer の ISR キャッシュを即時無効化します。

---

## システム全体構成図

```mermaid
graph TB
    subgraph 運営スタッフ
        STAFF[スタッフブラウザ<br/>管理画面]
        BT[Surface Go 2<br/>Bluetooth センサー]
    end

    subgraph Admin["Vercel (inuso-admin)"]
        ADMIN_NEXT[Next.js 16 App Router]
        API_LOGIN[POST /api/admin/login]
        API_BOOTH[POST /api/booth/update]
        API_BT[POST /api/booth/bluetooth]
        API_FAILOVER[POST /api/admin/check-failover]
        API_NOTICE[POST /api/notice/*]
        API_EVENT[POST /api/event/update]
        API_LOGS[GET /api/logs/list]
        API_FCM_REG[POST /api/admin/register-fcm]
        API_REV_FWD[POST /api/revalidate]
    end

    subgraph Firebase
        FS[(Firestore<br/>booths / notices / events<br/>adminFcmTokens / fcmTokens)]
        RTDB[(Realtime Database<br/>changeLogs)]
        FCM[Firebase Cloud Messaging]
    end

    subgraph Viewer["Vercel (inuso-viewer)"]
        VIEWER_REV[POST /api/revalidate]
        VIEWER_CACHE[ISR キャッシュ]
    end

    STAFF -->|ログイン・操作| ADMIN_NEXT
    ADMIN_NEXT --> API_LOGIN
    ADMIN_NEXT --> API_BOOTH
    ADMIN_NEXT --> API_NOTICE
    ADMIN_NEXT --> API_EVENT
    ADMIN_NEXT --> API_LOGS
    ADMIN_NEXT --> API_FCM_REG

    BT -->|Bearer 認証| API_BT
    API_BT --> FS
    API_BT --> API_FAILOVER

    API_BOOTH --> FS
    API_BOOTH --> RTDB
    API_BOOTH --> API_REV_FWD

    API_NOTICE --> FS
    API_NOTICE --> FCM
    API_NOTICE --> API_REV_FWD

    API_EVENT --> FS
    API_EVENT --> API_REV_FWD

    API_FAILOVER --> FS
    API_FAILOVER --> FCM

    API_FCM_REG --> FS

    API_LOGS --> RTDB

    API_REV_FWD --> VIEWER_REV
    VIEWER_REV --> VIEWER_CACHE

    FCM -->|プッシュ通知（来場者）| VIEWER_CACHE
    FCM -->|プッシュ通知（スタッフ）| STAFF
```

---

## Bluetooth → 混雑レベル算出フロー

```mermaid
sequenceDiagram
    participant BT as Surface Go 2
    participant API as POST /api/booth/bluetooth
    participant FS as Firestore (booths)
    participant Rev as inuso-viewer ISR

    BT->>API: Bearer 認証 + { boothId, deviceCount }
    API->>FS: ブース情報取得（isManual / baselineMax 確認）
    alt 手動モード中
        API-->>BT: { ok: true, skipped: true, reason: "manual mode" }
    else 自動モード
        Note over API: C-3 アルゴリズムで混雑レベル算出
        API->>FS: status / lastBluetoothAt 更新
        alt フェイルオーバー中だった場合
            API->>FS: isManualByFailover = false に復旧
        end
        API-->>BT: { ok: true, status: 3 }
    end
```

### C-3 混雑レベルアルゴリズム

```mermaid
graph LR
    DV[deviceCount] --> RATIO["ratio = deviceCount / baseline × 100"]
    BL["baseline = baselineMax または<br/>rolling window の最大値"] --> RATIO
    RATIO -->|≤ 15%| L1[レベル1: 空]
    RATIO -->|≤ 35%| L2[レベル2: やや空]
    RATIO -->|≤ 55%| L3[レベル3: 普通]
    RATIO -->|≤ 75%| L4[レベル4: 混雑]
    RATIO -->|> 75%| L5[レベル5: 満員]
```

- Rolling window: 直近 30 件のデバイス数を保持して最大値を baseline に使用
- `baselineMax` が設定済みの場合はそちらを優先

---

## フェイルオーバーフロー

```mermaid
sequenceDiagram
    participant SHELL as AdminShell (2分ポーリング)
    participant API as POST /api/admin/check-failover
    participant FS as Firestore
    participant FCM as FCM（スタッフ通知）

    SHELL->>API: ポーリング（2分ごと）
    API->>FS: lastBluetoothAt 確認
    alt 3分以上 Bluetooth データなし
        API->>FS: isManual = true, isManualByFailover = true
        API->>FCM: フェイルオーバー通知をスタッフ全員に送信
        API-->>SHELL: { result: "switched_to_manual" }
    else 手動モード継続中（5分ごと）
        API->>FCM: リマインダー通知
        API-->>SHELL: { result: "reminder_sent" }
    else 正常
        API-->>SHELL: { result: "ok" }
    end
```

---

## お知らせ送信フロー

```mermaid
sequenceDiagram
    participant STAFF as 運営スタッフ
    participant API as POST /api/notice/send
    participant FS as Firestore (notices)
    participant FCM as Firebase Cloud Messaging
    participant VIEWER as inuso-viewer

    STAFF->>API: { title, body, target, type }
    API->>FS: notices/{noticeId} に保存
    API->>FCM: target トピックに一斉送信
    FCM-->>STAFF: （スタッフ端末にも通知）
    API->>VIEWER: POST /api/revalidate
    VIEWER-->>API: ISR 無効化完了
    API-->>STAFF: { ok: true, noticeId }
```

---

## 主要コンポーネント

| レイヤー | 技術 | 役割 |
|---|---|---|
| フロントエンド | Next.js 16 App Router | 管理 UI |
| ホスティング | Vercel | サーバーレス API・エッジ配信 |
| 認証 | JWT Cookie (`admin_operator`) | スタッフ認証 |
| データベース | Firebase Firestore | ブース・お知らせ・イベント・FCM トークン |
| 変更ログ | Firebase Realtime Database | `changeLogs` |
| プッシュ通知 | Firebase Cloud Messaging (FCM) | 来場者・スタッフへの通知 |
| Bluetooth センサー | Surface Go 2 | デバイス数計測（Bearer 認証） |
| ステータス | Instatus | サービス稼働状況ページ |

## スコープ（アクセス権限）

| スコープ | 種別 | 権限 |
|---|---|---|
| `"実行委員"` | フルアクセス | 全ブース・全通知対象選択可 |
| `"教員"` | フルアクセス | 全ブース・全通知対象選択可 |
| `"1-1"` 〜 `"3-4"` | クラス担当 | 担当ブースのみ、通知は `all` のみ |
| `"eスポーツ部"` / `"美術部"` / `"有志発表"` | 部活担当 | 担当ブースのみ、通知は `all` のみ |
| `"キッチンカー"` / `"PTAバザー"` | 飲食担当 | 担当ブースのみ、通知は `all` のみ |
| `"保健委員会"` | 委員会担当 | 担当ブースのみ、通知は `all` のみ |

## 機能 ON/OFF システム

Firestore `config` コレクションで viewer・admin の各機能を管理します。

| Firestore ドキュメント | 制御対象 |
|---|---|
| `config/viewer_features` | inuso-viewer の各機能（service/event/booth/busy/eat/notice/digital/map） |
| `config/admin_features` | inuso-admin の各機能（service/notice/booth/event/eat） |
| `config/admin_accounts` | 運営オペレーターアカウントの有効/無効 |

- DB管理者画面 `/db/features` からトグルスイッチで制御
- フラグ変更時に `revalidateViewer()` で ISR キャッシュを即時更新
- `viewer_features.service: false` → viewer 全ページがメンテナンス画面に切替
