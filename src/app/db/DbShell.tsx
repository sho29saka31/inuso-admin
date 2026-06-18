"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "./actions";

const NAV_ITEMS = [
  { href: "/db/booth", label: "ブース" },
  { href: "/db/event", label: "イベント" },
  { href: "/db/eat/car", label: "キッチンカー" },
  { href: "/db/eat/pta", label: "PTAバザー" },
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
            <form action={logoutAction}>
              <button type="submit" className="text-sm opacity-80 hover:opacity-100">
                ログアウト
              </button>
            </form>
          </header>

          <nav className="bg-white border-b px-2 overflow-x-auto">
            <div className="flex gap-1 py-1 min-w-max">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="px-3 py-1.5 rounded text-sm font-medium text-text-main hover:bg-background whitespace-nowrap"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>
        </>
      )}

      <main className="flex-1 p-4 max-w-3xl w-full mx-auto">{children}</main>
    </div>
  );
}
