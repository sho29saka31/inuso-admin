import { NoticeForm } from "../NoticeForm";
import { createNotice } from "../actions";

export default function NoticeNewPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">通知新規作成</h1>
      <NoticeForm action={createNotice} />
    </div>
  );
}
