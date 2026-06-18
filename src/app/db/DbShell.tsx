"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "./actions";

const NAV_ITEMS = [
  { href: "/db/booth", label: "ブース" },
  { href: "/db/event", label: "イベント" },
  { href: "/db/eat", label: "飲食" },
  { href: "/db/notice", label: "通知" },
  { href: "/db/digital", label: "パンフレット" },
  { href: "/db/config", label: "設定" },
];

export function DbShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === "/db";

  return (
    <div className="min-h-screen flex flex-col">
      {!isLogin && (
        <>
          <header className="bg-primary text-white px-4 py-3 flex items-center justify-between sticky top-0 z-10">
            <Link href="/db/booth" className="font-bold text-base">
              ISF DB管理
            </Link>
            <div className="flex items-center gap-3">
              <Link href="/db/changelog" className="text-sm opacity-80 hover:opacity-100 flex items-center gap-1">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
                </svg>
                変更ログ
              </Link>
              <form action={logoutAction}>
                <button type="submit" className="text-sm opacity-80 hover:opacity-100">
                  ログアウト
                </button>
              </form>
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
    </div>
  );
}
