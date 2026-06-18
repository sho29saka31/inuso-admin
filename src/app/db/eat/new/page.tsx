import { EatForm } from "../EatForm";
import { createEatItem } from "../actions";

export default function EatNewPage() {
  async function create(fd: FormData) {
    "use server";
    await createEatItem(fd);
  }
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">飲食 新規作成</h1>
      <EatForm action={create} showTypeSelect />
    </div>
  );
}
