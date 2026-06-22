export const dynamic = "force-dynamic";
import Link from "next/link";
import { getDb } from "@/lib/firebase-admin";
import { deleteEvent } from "./actions";
import { DeleteButton } from "./DeleteButton";

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
    const snap = await db.collection("events").orderBy("day").orderBy("startTime").get();
    return snap.docs.map((d) => d.data() as Event);
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
      ) : (() => {
        const grouped = events.reduce<Record<string, Event[]>>((acc, e) => {
          if (!acc[e.day]) acc[e.day] = [];
          acc[e.day].push(e);
          return acc;
        }, {});
        return (
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
                      <div className="flex gap-2 shrink-0">
                        <Link href={`/db/event/${ev.eventId}`} className="text-xs px-2 py-1 rounded border border-primary text-primary font-medium">
                          編集
                        </Link>
                        <DeleteButton id={ev.eventId} label="削除" confirmMessage={`「${ev.eventName}」を削除しますか？`} action={deleteEvent} />
                      </div>
                    </div>
                  ))}
                  <div className="flex flex-col gap-2">
                    {regularEvents.map((ev) => (
                      <div key={ev.eventId} className="flex gap-3 rounded-xl bg-white border p-3">
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
                        <div className="flex gap-2 shrink-0 self-start">
                          <Link href={`/db/event/${ev.eventId}`} className="text-xs px-2 py-1 rounded border border-primary text-primary font-medium">
                            編集
                          </Link>
                          <DeleteButton id={ev.eventId} label="削除" confirmMessage={`「${ev.eventName}」を削除しますか？`} action={deleteEvent} />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        );
      })()}
    </div>
  );
}
