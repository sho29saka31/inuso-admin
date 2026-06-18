import { EventForm } from "../EventForm";
import { createEvent } from "../actions";

export default function EventNewPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">イベント新規作成</h1>
      <EventForm action={createEvent} />
    </div>
  );
}
