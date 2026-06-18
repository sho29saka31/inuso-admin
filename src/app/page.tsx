import Link from "next/link";

export default function AdminTop() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 p-8">
      <h1 className="text-2xl font-bold">ISF webapp 管理システム</h1>
      <div className="flex flex-col gap-4 w-full max-w-xs">
        <Link
          href="/db"
          className="block text-center py-3 px-6 rounded-lg bg-primary text-white font-bold text-lg"
        >
          DB管理セクション
          <span className="block text-sm font-normal opacity-80">（3段階認証）</span>
        </Link>
        <Link
          href="/admin"
          className="block text-center py-3 px-6 rounded-lg bg-secondary text-white font-bold text-lg"
        >
          管理者セクション
          <span className="block text-sm font-normal opacity-80">（任意文字列認証）</span>
        </Link>
      </div>
    </div>
  );
}
