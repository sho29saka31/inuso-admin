"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="ja">
      <body className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-4xl">⚠️</p>
          <h1 className="text-lg font-bold text-gray-800">エラーが発生しました</h1>
          <p className="text-sm text-gray-500">ページを再読み込みしてください。</p>
          <button
            onClick={reset}
            className="mt-2 px-4 py-2 rounded-lg bg-[#1EA78C] text-white text-sm font-bold"
          >
            再試行
          </button>
        </div>
      </body>
    </html>
  );
}
