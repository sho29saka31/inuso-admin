"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/admin/booth", label: "ブース" },
  { href: "/admin/event", label: "イベント" },
  { href: "/admin/notice", label: "通知" },
  { href: "/admin/logs", label: "ログ" },
];

export function AdminShell({
  children,
  operatorId,
}: {
  children: React.ReactNode;
  operatorId: string;
}) {
  const pathname = usePathname();

  async function handleLogout() {
    if (!confirm("ログアウトしますか？")) return;
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-primary text-white px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <Link href="/admin/booth" className="font-bold text-sm">
          運営管理
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-sm opacity-80">{operatorId}</span>
          <button
            type="button"
            onClick={handleLogout}
            className="text-sm opacity-80 hover:opacity-100"
          >
            退出
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

      <main className="flex-1 p-4 max-w-3xl w-full mx-auto">{children}</main>
    </div>
  );
}
