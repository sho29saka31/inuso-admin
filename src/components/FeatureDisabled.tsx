export default function FeatureDisabled() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 px-6 text-center">
      <p className="text-5xl">🔒</p>
      <h1 className="text-lg font-bold">この機能は現在無効です</h1>
      <p className="text-sm text-text-sub">DB管理者画面から有効にしてください。</p>
    </div>
  );
}
