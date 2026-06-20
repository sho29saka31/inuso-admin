"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const SCOPE_GROUPS = [
  {
    group: "教員・実行委員",
    items: [
      { value: "教員", label: "教員（全アクセス）" },
      { value: "実行委員", label: "実行委員（全アクセス）" },
    ],
  },
  {
    group: "1年",
    items: [
      { value: "1-1", label: "1年1組" },
      { value: "1-2", label: "1年2組" },
      { value: "1-3", label: "1年3組" },
      { value: "1-4", label: "1年4組" },
    ],
  },
  {
    group: "2年",
    items: [
      { value: "2-1", label: "2年1組" },
      { value: "2-2", label: "2年2組" },
      { value: "2-3", label: "2年3組" },
      { value: "2-4", label: "2年4組" },
    ],
  },
  {
    group: "3年",
    items: [
      { value: "3-1", label: "3年1組" },
      { value: "3-2", label: "3年2組" },
      { value: "3-3", label: "3年3組" },
      { value: "3-4", label: "3年4組" },
    ],
  },
  {
    group: "部活",
    items: [
      { value: "eスポーツ部", label: "eスポーツ部" },
      { value: "美術部", label: "美術部" },
    ],
  },
  {
    group: "その他",
    items: [
      { value: "キッチンカー", label: "キッチンカー" },
      { value: "PTAバザー", label: "PTAバザー" },
    ],
  },
];

export default function AdminLoginPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [scope, setScope] = useState("");
  const [error, setError] = useState("");
  const [tapCount, setTapCount] = useState(0);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("担当者名を入力してください");
      return;
    }
    if (!scope) {
      setError("担当を選択してください");
      return;
    }
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ operatorId: name.trim(), scope }),
    });
    if (res.ok) {
      router.push("/admin/mybooth");
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
          <p className="text-sm text-text-sub mt-1">担当者名と所属を入力してください</p>
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

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">所属・担当</label>
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">選択してください</option>
              {SCOPE_GROUPS.map((g) => (
                <optgroup key={g.group} label={g.group}>
                  {g.items.map((item) => (
                    <option key={item.label} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

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
