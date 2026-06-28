"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "./actions";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useConfirm } from "@/hooks/useConfirm";

const NAV_ITEMS = [
  { href: "/db/booth", label: "ブース" },
  { href: "/db/event", label: "イベント" },
  { href: "/db/eat", label: "飲食" },
  { href: "/db/notice", label: "通知" },
  { href: "/db/files", label: "ファイル" },
  { href: "/db/config", label: "設定" },
];

export function DbShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === "/db";
  const { confirm, confirmState, handleResult } = useConfirm();

  async function handleLogout() {
    const ok = await confirm("ログアウトしますか？"); if (!ok) return;
    await logoutAction();
  }

  return (
    <div className="min-h-screen flex flex-col">
      {!isLogin && (
        <>
          <header className="bg-primary text-white px-4 py-3 flex items-center justify-between sticky top-0 z-10">
            <Link href="/db/booth" className="font-bold text-sm">
              DB管理
            </Link>
            <div className="flex items-center gap-3">
              <button type="button" onClick={handleLogout} className="text-sm opacity-80 hover:opacity-100">
                ログアウト
              </button>
            </div>
          </header>

          <nav className="bg-white border-b px-2 overflow-x-auto">
            <div className="flex gap-1 py-1 min-w-max">
              {NAV_ITEMS.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3 py-1.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                      active
                        ? "border-primary text-primary"
                        : "border-transparent text-text-main hover:bg-background"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </nav>
        </>
      )}

      <main className="flex-1 p-4 max-w-3xl w-full mx-auto">{children}</main>
      {confirmState && <ConfirmDialog message={confirmState.message} onConfirm={() => handleResult(true)} onCancel={() => handleResult(false)} />}
    </div>
  );
}
