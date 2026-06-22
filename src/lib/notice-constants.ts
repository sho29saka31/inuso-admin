export const ALL_TARGETS = [
  { value: "all", label: "全ユーザー (all)" },
  { value: "guest", label: "ゲストのみ (guest)" },
  { value: "edu", label: "生徒全体 (edu)" },
  { value: "prof", label: "先生全体 (prof)" },
  { value: "1nen", label: "1年全体 (1nen)" },
  { value: "2nen", label: "2年全体 (2nen)" },
  { value: "3nen", label: "3年全体 (3nen)" },
];

export const NON_TEACHER_TARGETS = ALL_TARGETS.filter((t) => t.value !== "prof");

export const TYPE_OPTIONS = [
  { value: "urgent", label: "緊急" },
  { value: "info", label: "お知らせ" },
  { value: "warning", label: "注意" },
  { value: "other", label: "その他" },
];
