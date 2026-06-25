"use client";

import { useState } from "react";
import { loginAction } from "./actions";

export function LoginForm() {
  const [stage, setStage] = useState(1);
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setPending(true);

    const fd = new FormData();
    fd.set("id", id);
    fd.set("pw", pw);
    fd.set("pin", pin);

    if (stage === 1) {
      if (!id) { setError("IDを入力してください"); setPending(false); return; }
      setStage(2);
      setPending(false);
      return;
    }
    if (stage === 2) {
      if (!pw) { setError("パスワードを入力してください"); setPending(false); return; }
      setStage(3);
      setPending(false);
      return;
    }

    try {
      const result = await loginAction(fd);
      if (result?.error) {
        setError(result.error);
        setStage(result.stage ?? 1);
        if (result.stage === 1) { setId(""); setPw(""); setPin(""); }
        if (result.stage === 2) { setPw(""); setPin(""); }
        if (result.stage === 3) { setPin(""); }
      }
    } catch {
      setError("ログイン処理に失敗しました。時間をおいて再度お試しください。");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <p className="text-sm text-danger bg-red-50 border border-danger rounded px-3 py-2">
          {error}
        </p>
      )}

      <div className={`flex flex-col gap-1 ${stage !== 1 ? "opacity-40" : ""}`}>
        <label className="text-sm font-medium">第1段階：ID</label>
        <input
          type="text"
          value={id}
          onChange={(e) => setId(e.target.value)}
          disabled={stage !== 1}
          autoComplete="username"
          className="border rounded-lg px-3 py-2 text-sm disabled:bg-gray-100"
          placeholder="管理ID"
        />
      </div>

      <div className={`flex flex-col gap-1 ${stage < 2 ? "opacity-40" : stage > 2 ? "opacity-40" : ""}`}>
        <label className="text-sm font-medium">第2段階：パスワード</label>
        <input
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          disabled={stage !== 2}
          autoComplete="current-password"
          className="border rounded-lg px-3 py-2 text-sm disabled:bg-gray-100"
          placeholder="パスワード"
        />
      </div>

      <div className={`flex flex-col gap-1 ${stage < 3 ? "opacity-40" : ""}`}>
        <label className="text-sm font-medium">第3段階：PIN</label>
        <input
          type="password"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          disabled={stage !== 3}
          inputMode="numeric"
          className="border rounded-lg px-3 py-2 text-sm disabled:bg-gray-100"
          placeholder="数字PIN"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="py-2 px-4 rounded-lg bg-primary text-white font-bold disabled:opacity-60"
      >
        {pending ? "確認中…" : stage < 3 ? "次へ" : "ログイン"}
      </button>

      <p className="text-xs text-text-sub text-center">
        ステップ {stage} / 3
      </p>
    </form>
  );
}
