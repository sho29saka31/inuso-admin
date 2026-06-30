/** スコープ値 (cookieに保存される値) */

// クラス: "1-1" 〜 "3-4"
// 部活: "eスポーツ部" | "美術部" | "有志発表"
// 飲食: "eat-car"（キッチンカー・グループ） | "pta-bazaar"（PTAバザー）
// 全アクセス: "全アクセス"

const CLASS_TO_LABEL: Record<string, string> = {
  "1-1": "1年1組", "1-2": "1年2組", "1-3": "1年3組", "1-4": "1年4組",
  "2-1": "2年1組", "2-2": "2年2組", "2-3": "2年3組", "2-4": "2年4組",
  "3-1": "3年1組", "3-2": "3年2組", "3-3": "3年3組", "3-4": "3年4組",
};

// 飲食スコープ値（boothId と揃えた値）→ 表示名・発信元名
const FOOD_SCOPE_TO_LABEL: Record<string, string> = {
  "eat-car": "キッチンカー",
  "pta-bazaar": "PTAバザー",
};

export function isFullAccess(scope: string): boolean {
  return scope === "教員" || scope === "実行委員";
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
  if (scope === "教員") return "教員（全アクセス）";
  if (scope === "実行委員") return "実行委員（全アクセス）";
  return CLASS_TO_LABEL[scope] ?? FOOD_SCOPE_TO_LABEL[scope] ?? scope;
}

/** 通知送信時のauthorIdを返す（クラス: "1-1"、部活: そのまま、飲食: 日本語名） */
export function getScopeAuthorId(scope: string): string {
  return FOOD_SCOPE_TO_LABEL[scope] ?? scope;
}
