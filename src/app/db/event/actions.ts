"use server";

import { redirect } from "next/navigation";
import { getDb, nowTimestamp } from "@/lib/firebase-admin";
import { saveChangeLog } from "@/lib/changelog";
import { verifySession } from "@/lib/auth";

async function requireSession() {
  if (!await verifySession()) throw new Error("Unauthorized");
}

export async function createEvent(formData: FormData) {
  await requireSession();
  const db = getDb();
  const now = nowTimestamp();
  const eventId = `event-${Date.now()}`;
  const data = {
    eventId,
    eventName: formData.get("eventName") as string,
    day: formData.get("day") as string,
    startTime: formData.get("startTime") as string,
    endTime: formData.get("endTime") as string,
    location: formData.get("location") as string,
    details: formData.get("details") as string,
    isDelayed: false,
    delayMinutes: 0,
    updatedAt: now,
  };

  await db.collection("events").doc(eventId).set(data);
  await saveChangeLog({
    operatorId: "db-admin",
    targetCollection: "events",
    targetId: eventId,
    changeType: "create",
    changedFields: { created: data },
  });

  redirect("/db/event");
}

export async function updateEvent(eventId: string, formData: FormData) {
  await requireSession();
  const db = getDb();
  const now = nowTimestamp();
  const fields = {
    eventName: formData.get("eventName") as string,
    day: formData.get("day") as string,
    startTime: formData.get("startTime") as string,
    endTime: formData.get("endTime") as string,
    location: formData.get("location") as string,
    details: formData.get("details") as string,
    isDelayed: formData.get("isDelayed") === "true",
    delayMinutes: Number(formData.get("delayMinutes") ?? 0),
    updatedAt: now,
  };

  await db.collection("events").doc(eventId).update(fields);
  await saveChangeLog({
    operatorId: "db-admin",
    targetCollection: "events",
    targetId: eventId,
    changeType: "update",
    changedFields: fields,
  });

  redirect("/db/event");
}

export async function deleteEvent(eventId: string) {
  await requireSession();
  const db = getDb();
  await db.collection("events").doc(eventId).delete();
  await saveChangeLog({
    operatorId: "db-admin",
    targetCollection: "events",
    targetId: eventId,
    changeType: "delete",
    changedFields: {},
  });
  redirect("/db/event");
}
