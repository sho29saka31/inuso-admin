import { BoothForm } from "../BoothForm";
import { createBooth } from "../actions";

export default function BoothNewPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">ブース新規作成</h1>
      <BoothForm action={createBooth} />
    </div>
  );
}
