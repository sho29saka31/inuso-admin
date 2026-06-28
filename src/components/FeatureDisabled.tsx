export default function FeatureDisabled() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 px-6 text-center">
      <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-400">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0110 0v4" />
      </svg>
      <h1 className="text-lg font-bold">この機能は現在無効です</h1>
      <p className="text-sm text-text-sub">DB管理者画面から有効にしてください。</p>
    </div>
  );
}
