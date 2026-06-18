import Link from "next/link";
import { getDb } from "@/lib/firebase-admin";
import { deleteEvent } from "./actions";
import { DeleteButton } from "./DeleteButton";

async function getEvents() {
  try {
    const db = getDb();
    const snap = await db.collection("events").orderBy("startTime").get();
    return snap.docs.map((d) => d.data());
  } catch {
    return null;
  }
}

export default async function EventListPage() {
  const events = await getEvents();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">イベント一覧</h1>
        <Link href="/db/event/new" className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium">
          + 新規作成
        </Link>
      </div>

      {events === null ? (
        <p className="text-danger text-sm">Firebase未設定。環境変数を確認してください。</p>
      ) : events.length === 0 ? (
        <p className="text-text-sub text-sm">イベントがありません。</p>
      ) : (
        <div className="flex flex-col gap-2">
          {events.map((ev) => (
            <div key={ev.eventId} className="bg-surface rounded-lg border p-4 flex items-start justify-between gap-4">
              <div className="flex flex-col gap-0.5">
                <span className="font-medium text-sm">{ev.eventName}</span>
                <span className="text-xs text-text-sub">{ev.day} {ev.startTime}〜{ev.endTime}</span>
                <span className="text-xs text-text-sub">{ev.location}</span>
                {ev.isDelayed && (
                  <span className="text-xs text-warning">⚠ {ev.delayMinutes}分遅延</span>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                <Link href={`/db/event/${ev.eventId}`} className="text-xs px-3 py-1.5 rounded border border-primary text-primary">
                  編集
                </Link>
                <DeleteButton eventId={ev.eventId} name={ev.eventName} action={deleteEvent} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
