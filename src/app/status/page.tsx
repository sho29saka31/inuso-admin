import type { Metadata } from "next";
import StatusPageClient from "./StatusPageClient";

export const metadata: Metadata = { title: "システムステータス | ISF" };

export default function StatusPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F4FAFA]">
      <header className="bg-[#1EA78C] text-white px-4 py-3 sticky top-0 z-10 shadow-sm">
        <div className="max-w-3xl mx-auto flex items-center gap-2">
          <span className="font-bold text-sm">ISF</span>
          <span className="opacity-60 text-sm">/</span>
          <span className="text-sm opacity-90">システムステータス</span>
        </div>
      </header>

      <main className="flex-1 px-4 py-6 max-w-3xl w-full mx-auto">
        <StatusPageClient />
      </main>

      <footer className="border-t bg-white px-4 py-3">
        <p className="text-xs text-center text-gray-400">
          ISF 犬山総合高等学校 文化祭アプリ — 管理システム
        </p>
      </footer>
    </div>
  );
}
