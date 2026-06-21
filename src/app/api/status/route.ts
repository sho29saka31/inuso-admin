import { NextResponse } from "next/server";
import { getDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

interface BluetoothConfig {
  enabled: boolean;
  scanIntervalSeconds: number;
  staleness: { warnMinutes: number; alertMinutes: number };
}

interface BoothStatus {
  boothId: string;
  name: string;
  mode: string;
  updatedAtDisplay: string;
  updatedAtUnix: number;
  elapsedMinutes: number;
  state: "ok" | "warn" | "alert";
}

async function fetchFirestoreStatus() {
  const db = getDb();
  const snap = await db.collection("config").doc("bluetooth").get();
  const config = snap.exists
    ? (snap.data() as BluetoothConfig)
    : { enabled: true, scanIntervalSeconds: 30, staleness: { warnMinutes: 15, alertMinutes: 20 } };
  return { ok: true, config };
}

async function fetchBoothStatus(warnMinutes: number, alertMinutes: number) {
  const db = getDb();
  const snap = await db.collection("booths").orderBy("boothId").get();
  const now = Date.now();
  const booths: BoothStatus[] = snap.docs.map((doc) => {
    const d = doc.data();
    const unix: number = d.updatedAt?.unix ?? 0;
    const elapsedMinutes = unix > 0 ? Math.floor((now - unix) / 60000) : 9999;
    const state: BoothStatus["state"] =
      unix === 0
        ? "alert"
        : elapsedMinutes >= alertMinutes
        ? "alert"
        : elapsedMinutes >= warnMinutes
        ? "warn"
        : "ok";
    return {
      boothId: d.boothId ?? doc.id,
      name: d.name ?? doc.id,
      mode: d.mode ?? "-",
      updatedAtDisplay: d.updatedAt?.display ?? "未記録",
      updatedAtUnix: unix,
      elapsedMinutes,
      state,
    };
  });
  return booths;
}

async function fetchLatestNotice() {
  const db = getDb();
  const snap = await db
    .collection("notices")
    .orderBy("createdAt", "desc")
    .limit(1)
    .get();
  if (snap.empty) return null;
  const d = snap.docs[0].data();
  return {
    title: d.title ?? "(タイトルなし)",
    createdAt: d.createdAt ?? "不明",
    isUrgent: d.isUrgent ?? false,
  };
}

async function fetchSentryIssues(project: string, statsPeriod: string) {
  const token = process.env.SENTRY_API_TOKEN;
  if (!token) return { count: null, error: "SENTRY_API_TOKEN未設定" };
  const org = "isf-webapp";
  const url = `https://sentry.io/api/0/projects/${org}/${project}/issues/?query=is%3Aunresolved&statsPeriod=${statsPeriod}&limit=100`;
  console.log(`[Sentry] token=${token ? "set("+token.slice(0,6)+"...)" : "unset"} url=${url}`);
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 0 },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.log(`[Sentry] ${project} ${statsPeriod} -> ${res.status} ${body.slice(0, 200)}`);
    return { count: null, error: `HTTP ${res.status}: ${body.slice(0, 100)}` };
  }
  const data = await res.json();
  return { count: Array.isArray(data) ? data.length : null, error: null };
}

export async function GET() {
  const serverTime = new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" }) + " (JST)";

  const [firestoreResult, noticeResult] = await Promise.allSettled([
    fetchFirestoreStatus(),
    fetchLatestNotice(),
  ]);

  const config =
    firestoreResult.status === "fulfilled"
      ? firestoreResult.value.config
      : { enabled: null, scanIntervalSeconds: null, staleness: { warnMinutes: 15, alertMinutes: 20 } };

  const { warnMinutes, alertMinutes } = config.staleness ?? { warnMinutes: 15, alertMinutes: 20 };

  const boothResult = await Promise.allSettled([fetchBoothStatus(warnMinutes, alertMinutes)]);

  const [sentry1hViewer, sentry24hViewer, sentry1hAdmin, sentry24hAdmin] = await Promise.allSettled([
    fetchSentryIssues("viewer", "1h"),
    fetchSentryIssues("viewer", "24h"),
    fetchSentryIssues("admin", "1h"),
    fetchSentryIssues("admin", "24h"),
  ]);

  const booths =
    boothResult[0].status === "fulfilled" ? boothResult[0].value : null;

  const summary = booths
    ? {
        ok: booths.filter((b) => b.state === "ok").length,
        warn: booths.filter((b) => b.state === "warn").length,
        alert: booths.filter((b) => b.state === "alert").length,
      }
    : null;

  return NextResponse.json({
    serverTime,
    deploy: {
      sha: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
      deployedAt: process.env.BUILD_TIME
        ? new Date(process.env.BUILD_TIME).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" }) + " (JST)"
        : null,
    },
    firestore:
      firestoreResult.status === "fulfilled"
        ? { ok: true, config }
        : { ok: false, error: String((firestoreResult as PromiseRejectedResult).reason) },
    booths: booths ?? null,
    boothsError: boothResult[0].status === "rejected" ? String((boothResult[0] as PromiseRejectedResult).reason) : null,
    boothSummary: summary,
    warnMinutes,
    alertMinutes,
    notice:
      noticeResult.status === "fulfilled"
        ? noticeResult.value
        : null,
    noticeError: noticeResult.status === "rejected" ? String((noticeResult as PromiseRejectedResult).reason) : null,
    sentry: {
      viewer: {
        issues1h: sentry1hViewer.status === "fulfilled" ? sentry1hViewer.value.count : null,
        issues24h: sentry24hViewer.status === "fulfilled" ? sentry24hViewer.value.count : null,
        error: sentry1hViewer.status === "fulfilled" ? sentry1hViewer.value.error : String((sentry1hViewer as PromiseRejectedResult).reason),
      },
      admin: {
        issues1h: sentry1hAdmin.status === "fulfilled" ? sentry1hAdmin.value.count : null,
        issues24h: sentry24hAdmin.status === "fulfilled" ? sentry24hAdmin.value.count : null,
        error: sentry1hAdmin.status === "fulfilled" ? sentry1hAdmin.value.error : String((sentry1hAdmin as PromiseRejectedResult).reason),
      },
    },
  });
}
