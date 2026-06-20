export const dynamic = "force-dynamic";
import Link from "next/link";
import { getDb } from "@/lib/firebase-admin";

interface Event {
  eventId: string;
  eventName: string;
  day: string;
  startTime: string;
  endTime: string;
  location: string;
  details?: string;
  isDelayed?: boolean;
  delayMinutes?: number;
}

function isAllDayEvent(ev: Event): boolean {
  return /日目/.test(ev.eventName) || ev.startTime === "00:00" || ev.startTime === "00:00:00";
}

function formatDay(day: string): string {
  const d = new Date(day + "T00:00:00");
  return d.toLocaleDateString("ja-JP", { month: "long", day: "numeric", weekday: "short" });
}

async function getEvents() {
  try {
    const db = getDb();
    const snap = await db
      .collection("events")
      .orderBy("day")
      .orderBy("startTime")
      .get();
    return snap.docs.map((d) => d.data() as Event);
  } catch {
    return null;
  }
}

export default async function AdminEventPage() {
  const events = await getEvents();

  if (events === null) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-xl font-bold">イベント一覧</h1>
        <p className="text-danger text-sm">Firebase未設定。</p>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-xl font-bold">イベント一覧</h1>
        <p className="text-text-sub text-sm">イベントがありません。</p>
      </div>
    );
  }

  const grouped = events.reduce<Record<string, Event[]>>((acc, e) => {
    if (!acc[e.day]) acc[e.day] = [];
    acc[e.day].push(e);
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">イベント一覧</h1>

      <div className="flex flex-col gap-6">
        {Object.entries(grouped).map(([day, items]) => {
          const allDayEvents = items.filter(isAllDayEvent);
          const regularEvents = items.filter((e) => !isAllDayEvent(e));
          return (
            <section key={day}>
              <h2 className="text-sm font-bold text-primary mb-2 pb-1 border-b border-primary">
                {formatDay(day)}
              </h2>
              {allDayEvents.map((ev) => (
                <div
                  key={ev.eventId}
                  className="mb-2 rounded-lg bg-primary/10 border border-primary/30 px-3 py-2 flex items-center justify-between gap-2"
                >
                  <span className="text-sm font-bold text-primary">{ev.eventName}</span>
                  <Link
                    href={`/admin/event/${ev.eventId}`}
                    className="shrink-0 text-xs px-2 py-1 rounded border border-primary text-primary font-medium"
                  >
                    編集
                  </Link>
                </div>
              ))}
              <div className="flex flex-col gap-2">
                {regularEvents.map((ev) => (
                  <div
                    key={ev.eventId}
                    className="flex gap-3 rounded-xl bg-white border p-3"
                  >
                    <div className="flex flex-col items-center text-xs text-text-sub shrink-0 w-14 pt-0.5">
                      <span className="font-bold text-sm text-text-main">
                        {(ev.startTime ?? "").slice(0, 5)}
                      </span>
                      <span>〜</span>
                      <span>{(ev.endTime ?? "").slice(0, 5)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-sm text-text-main">{ev.eventName}</p>
                        {ev.isDelayed && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 font-medium">
                            遅延 +{ev.delayMinutes}分
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-text-sub mt-0.5">{ev.location}</p>
                      {ev.details && (
                        <p className="text-xs text-text-sub mt-1 whitespace-pre-wrap">{ev.details}</p>
                      )}
                    </div>
                    <Link
                      href={`/admin/event/${ev.eventId}`}
                      className="shrink-0 self-start text-xs px-2 py-1 rounded border border-primary text-primary font-medium"
                    >
                      編集
                    </Link>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
