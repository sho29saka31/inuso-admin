import { EatForm } from "../../EatForm";
import { createEatItem } from "../../actions";

export default function EatCarNewPage() {
  async function create(fd: FormData) {
    "use server";
    await createEatItem("car", fd);
  }
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">キッチンカー新規作成</h1>
      <EatForm action={create} type="car" />
    </div>
  );
}
