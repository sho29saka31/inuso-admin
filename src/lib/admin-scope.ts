/** スコープ値 (cookieに保存される値) */

// クラス: "1-1" 〜 "3-4"
// 部活: "eスポーツ部" | "美術部" | "有志発表"
// その他: "キッチンカー" | "PTAバザー"
// 全アクセス: "全アクセス"

const CLASS_TO_LABEL: Record<string, string> = {
  "1-1": "1年1組", "1-2": "1年2組", "1-3": "1年3組", "1-4": "1年4組",
  "2-1": "2年1組", "2-2": "2年2組", "2-3": "2年3組", "2-4": "2年4組",
  "3-1": "3年1組", "3-2": "3年2組", "3-3": "3年3組", "3-4": "3年4組",
};

export function isFullAccess(scope: string): boolean {
  return scope === "全アクセス";
}

export function isClassScope(scope: string): boolean {
  return scope in CLASS_TO_LABEL;
}

/** ブース名のマッチングに使う検索文字列を返す */
export function getScopeBoothTerm(scope: string): string {
  return CLASS_TO_LABEL[scope] ?? scope;
}

/** スコープの表示ラベルを返す */
export function getScopeLabel(scope: string): string {
  if (scope === "全アクセス") return "全アクセス（教員・実行委員）";
  return CLASS_TO_LABEL[scope] ?? scope;
}

/** 通知送信時のauthorIdを返す（クラス: "1-1"、部活: そのまま） */
export function getScopeAuthorId(scope: string): string {
  return scope;
}
