import { getDb, nowTimestamp } from "./firebase-admin";

interface ChangeLogEntry {
  operatorId: string;
  targetCollection: string;
  targetId: string;
  changeType: "create" | "update" | "delete";
  changedFields: Record<string, unknown>;
}

export async function saveChangeLog(entry: ChangeLogEntry) {
  const db = getDb();
  const now = nowTimestamp();
  const logId = `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  await db.collection("changeLogs").doc(logId).set({
    logId,
    operatorId: entry.operatorId,
    targetCollection: entry.targetCollection,
    targetId: entry.targetId,
    changeType: entry.changeType,
    changedFields: entry.changedFields,
    changedAt: now,
  });
}
