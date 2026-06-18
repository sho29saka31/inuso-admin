export const dynamic = "force-dynamic";
import Link from "next/link";
import { getDb } from "@/lib/firebase-admin";

async function getEvents() {
  try {
    const db = getDb();
    const snap = await db.collection("events").orderBy("day").get();
    return snap.docs.map((d) => d.data());
  } catch {
    return null;
  }
}

export default async function AdminEventPage() {
  const events = await getEvents();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">イベント一覧</h1>

      {events === null ? (
        <p className="text-danger text-sm">Firebase未設定。</p>
      ) : events.length === 0 ? (
        <p className="text-text-sub text-sm">イベントがありません。</p>
      ) : (
        <div className="flex flex-col gap-2">
          {events.map((ev) => (
            <div
              key={ev.eventId}
              className="bg-white rounded-xl border p-4 flex items-start justify-between gap-4"
            >
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="font-medium text-sm truncate">{ev.eventName}</span>
                <span className="text-xs text-text-sub">
                  {ev.day} {ev.startTime}〜{ev.endTime} / {ev.location}
                </span>
                {ev.isDelayed && (
                  <span className="text-xs text-orange-500">⚠ {ev.delayMinutes}分遅延</span>
                )}
              </div>
              <Link
                href={`/admin/event/${ev.eventId}`}
                className="shrink-0 text-xs px-3 py-1.5 rounded-lg border border-primary text-primary font-medium"
              >
                編集
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
