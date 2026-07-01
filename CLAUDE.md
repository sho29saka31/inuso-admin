@AGENTS.md

# ISF Admin - Codebase Guide

## Project Overview

ISF Admin is the back-office web app for the ISF school festival. It manages booths, events, notices, food vendors, and congestion levels via Firestore. Two user roles exist:

- **DB管理者** (`/db/*`) — full Firestore CRUD, protected by `db_session` JWT cookie
- **運営オペレーター** (`/admin/*`) — day-of operations (congestion updates, notices, delays), protected by `admin_operator` cookie

## Tech Stack

- **Next.js 16** (App Router) with React 19 and TypeScript
- **Firebase Admin SDK** — Firestore reads/writes and FCM push notifications (server-side only)
- **Tailwind CSS v4** — styling via `@theme` custom properties in `globals.css`
- **jose** — JWT signing/verification for auth cookies
- **Sentry** — error tracking and monitoring (org: `isf-webapp`, project: `admin`)
- **Vercel** — hosting and deployment

## Commands

```bash
npm run dev      # Start dev server (localhost:3000)
npm run build    # Production build
npm run lint     # ESLint (flat config, eslint.config.mjs)
```

There is no test suite configured.

## Directory Structure

```
src/
├── app/
│   ├── layout.tsx                # Root layout (M PLUS Rounded 1c font, lang="ja")
│   ├── globals.css               # Tailwind + theme tokens (--color-primary, etc.)
│   ├── page.tsx                  # Landing/root page
│   ├── global-error.tsx          # Sentry error boundary
│   ├── db/                       # DB管理者 pages (Server Actions pattern)
│   │   ├── layout.tsx            # Wraps DbShell
│   │   ├── booth/                # Booth CRUD (actions.ts + form components)
│   │   ├── event/                # Event CRUD with CalendarPicker
│   │   ├── notice/               # Notice CRUD
│   │   ├── eat/                  # Food vendor management
│   │   ├── files/                # Map/pamphlet URL config
│   │   ├── config/               # App config
│   │   ├── digital/              # Digital pamphlet settings
│   │   ├── map/                  # Floor map settings
│   │   └── changelog/            # Operation log viewer
│   ├── (admin-auth)/             # Route group with auth guard layout
│   │   ├── layout.tsx            # Checks admin_operator cookie, redirects if missing
│   │   ├── AdminShell.tsx        # Operator shell UI
│   │   └── admin/
│   │       ├── booth/            # Congestion status updates
│   │       ├── event/            # Delay management
│   │       ├── notice/           # Send push notifications
│   │       ├── logs/             # Operator's own log history
│   │       └── mybooth/          # Operator's booth view
│   ├── admin/login/              # Login page (outside auth group)
│   └── api/                      # Route handlers
│       ├── admin/login/          # POST — sets operator cookies
│       ├── admin/logout/         # POST — clears operator cookies
│       ├── booth/bluetooth/      # POST — Bluetooth device-count based congestion
│       ├── booth/update/         # POST — manual booth status update
│       ├── event/update/         # POST — event update
│       ├── health/               # GET — Firestore connectivity check
│       ├── logs/list/            # GET — changelog query
│       ├── notice/send/          # POST — create notice + FCM push
│       ├── notice/update/        # POST — update notice
│       ├── notice/delete/        # POST — delete notice
│       └── revalidate/           # POST — ISR cache invalidation
├── components/
│   ├── ConfirmDialog.tsx         # Modal confirmation dialog
│   └── LoadingOverlay.tsx        # Full-screen loading spinner
├── hooks/
│   └── useConfirm.ts            # Hook for ConfirmDialog state
├── lib/
│   ├── firebase-admin.ts        # Firebase Admin singleton + nowTimestamp()
│   ├── auth.ts                  # DB admin JWT session (db_session cookie)
│   ├── admin-auth.ts            # Operator cookies (admin_operator, admin_scope)
│   ├── admin-scope.ts           # Scope helpers (class/club/full-access resolution)
│   └── changelog.ts             # Write operation logs to Firestore changeLogs collection
├── proxy.ts                     # Middleware: protects /db/* routes via JWT verification
├── instrumentation.ts           # Sentry server-side init
└── instrumentation-client.ts    # Sentry client-side init
```

## Key Patterns

### Authentication

- **DB Admin** (`/db/*`): 3-stage credential check (ID → password → PIN) via `src/lib/auth.ts`. Session is an HS256 JWT stored in `db_session` httpOnly cookie (8h expiry). Middleware in `src/proxy.ts` guards protected sub-routes.
- **Operator** (`/admin/*`): Login sets `admin_operator` (operator ID) and `admin_scope` (scope string) cookies. The `(admin-auth)/layout.tsx` server component checks the cookie and redirects to `/admin/login` if absent.

### Server Actions vs Route Handlers

- **DB admin CRUD** uses Next.js Server Actions (`"use server"` in `actions.ts` files). These call `getDb()` directly and `redirect()` after mutation.
- **Operator/API endpoints** use Route Handlers (`route.ts`) returning `NextResponse.json()`. These check auth via cookie or Bearer token.

### Data Flow for Mutations

1. Write to Firestore via `getDb()`
2. Log the change via `saveChangeLog()` (writes to `changeLogs` collection)
3. Optionally trigger Viewer ISR cache invalidation via `VIEWER_REVALIDATE_URL`
4. For notices: send FCM push notification via `getMessaging().send()`

### Firestore Collections

- `booths` — booth data (id, category, name, location, status, congestion)
- `events` — event/timetable entries
- `notices` — push notification records
- `eats` — food vendor entries
- `config` — app configuration documents
- `changeLogs` — audit trail of all mutations

### Styling

Tailwind CSS v4 with custom theme tokens defined in `src/app/globals.css`. Key colors: `primary` (#1EA78C), `secondary` (#0D7A67), `danger` (#EF4444). Font: M PLUS Rounded 1c. UI text is in Japanese.

### Path Alias

`@/*` maps to `./src/*` (configured in tsconfig.json). Always use `@/` imports.

## Environment Variables

Required in `.env.local`:

```
FIREBASE_SERVICE_ACCOUNT_JSON   # Firebase Admin SDK service account JSON
DB_ADMIN_ID                     # DB admin login ID
DB_ADMIN_PW                     # DB admin password
DB_ADMIN_PIN                    # DB admin PIN
SESSION_SECRET                  # JWT signing secret for db_session
ADMIN_OPERATOR_PASSWORD         # Operator login password
BLUETOOTH_SECRET                # Bearer token for Bluetooth API
VIEWER_REVALIDATE_URL           # Viewer app revalidation endpoint (optional)
VIEWER_REVALIDATE_SECRET        # Viewer revalidation secret (optional)
CRON_SECRET                     # Bearer token verifying Vercel Cron requests (/api/cron/*)
```

## Branch Strategy

| Branch | Purpose |
|---|---|
| `main` | Production (deployed to Vercel) |
| `dev` | Integration / staging |
| `claudecode` | Claude Code development branch (PRs go to `dev`) |

## Conventions

- Commit messages in Japanese describing the change
- All UI text is in Japanese
- Firestore document IDs follow the pattern `{type}-{timestamp}` (e.g., `notice-1719000000000`)
- `nowTimestamp()` returns `{ display: string, unix: number }` for all timestamp fields
- Operator actions always log via `saveChangeLog()`
- API routes validate auth first, then input, then perform the operation
- No test framework — verify changes by running the dev server

## MCP Servers

- **Sentry** (`https://mcp.sentry.dev/mcp/isf-webapp/admin`) — error monitoring for the admin project

## Custom Slash Commands

- `/create-pr` — Create a draft PR from `claudecode` to `dev`
- `/deploy` — Commit and push to `claudecode`, then create PR if needed
- `/notice-create` — Checklist for notice creation workflow
- `/sync-dev` — Merge latest `dev` into `claudecode`
