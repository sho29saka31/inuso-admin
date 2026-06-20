"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isFullAccess, getScopeLabel } from "@/lib/admin-scope";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useConfirm } from "@/hooks/useConfirm";

const FULL_NAV = [
  { href: "/admin/mybooth", label: "マイブース" },
  { href: "/admin/eat", label: "飲食" },
  { href: "/admin/event", label: "イベント" },
  { href: "/admin/notice", label: "通知送信" },
  { href: "/admin/notice/history", label: "通知履歴" },
];

const LIMITED_NAV = [
  { href: "/admin/mybooth", label: "マイブース" },
  { href: "/admin/notice", label: "通知送信" },
  { href: "/admin/notice/history", label: "通知履歴" },
];

export function AdminShell({
  children,
  operatorId,
  scope,
}: {
  children: React.ReactNode;
  operatorId: string;
  scope: string;
}) {
  const pathname = usePathname();
  const navItems = isFullAccess(scope) ? FULL_NAV : LIMITED_NAV;
  const { confirm, confirmState, handleResult } = useConfirm();

  async function handleLogout() {
    const ok = await confirm("ログアウトしますか？"); if (!ok) return;
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-primary text-white px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <Link href="/admin/mybooth" className="font-bold text-sm">
          運営管理
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="text-sm opacity-80">{operatorId}</span>
            {scope && (
              <span className="text-xs opacity-60">{getScopeLabel(scope)}</span>
            )}
          </div>
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
          {navItems.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/admin/notice" && pathname.startsWith(item.href + "/"));
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
      {confirmState && <ConfirmDialog message={confirmState.message} onConfirm={() => handleResult(true)} onCancel={() => handleResult(false)} />}
    </div>
  );
}
