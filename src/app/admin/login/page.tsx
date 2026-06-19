"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminLoginPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [tapCount, setTapCount] = useState(0);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("担当者名を入力してください");
      return;
    }
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ operatorId: name.trim() }),
    });
    if (res.ok) {
      router.push("/admin/booth");
    } else {
      setError("ログインに失敗しました");
    }
  }

  function handleTitleTap() {
    const next = tapCount + 1;
    setTapCount(next);
    if (tapTimer.current) clearTimeout(tapTimer.current);
    tapTimer.current = setTimeout(() => setTapCount(0), 1500);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="bg-white rounded-2xl shadow-md p-8 w-full max-w-sm flex flex-col gap-6">
        <div className="text-center">
          <h1
            className="text-xl font-bold text-text-main select-none cursor-default"
            onClick={handleTitleTap}
          >
            ISF 運営管理
          </h1>
          <p className="text-sm text-text-sub mt-1">担当者名を入力してください</p>
          {tapCount >= 3 && (
            <Link
              href="/db"
              className="mt-3 inline-block text-xs text-text-sub underline"
            >
              DB管理セクションへ
            </Link>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">担当者名</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: 山田 太郎"
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
            />
          </label>

          {error && <p className="text-xs text-danger">{error}</p>}

          <button
            type="submit"
            className="py-2 rounded-lg bg-primary text-white font-bold text-sm"
          >
            入室
          </button>
        </form>
      </div>
    </div>
  );
}
