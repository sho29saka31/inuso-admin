import { EatForm } from "../../EatForm";
import { createEatItem } from "../../actions";

export default function EatPtaNewPage() {
  async function create(fd: FormData) {
    "use server";
    await createEatItem("pta", fd);
  }
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">PTAバザー新規作成</h1>
      <EatForm action={create} type="pta" />
    </div>
  );
}
