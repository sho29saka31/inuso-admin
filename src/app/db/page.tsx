import { verifySession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LoginForm } from "./LoginForm";

export default async function DbLoginPage() {
  const authed = await verifySession();
  if (authed) redirect("/db/booth");

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-sm bg-surface rounded-xl shadow p-8 flex flex-col gap-6">
        <div className="text-center">
          <h1 className="text-xl font-bold">DB管理セクション</h1>
          <p className="text-sm text-text-sub mt-1">3段階認証</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
