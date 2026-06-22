"use client";

import { useEffect } from "react";

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

const FIREBASE_CONFIG = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export default function AdminFcmInit() {
  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("Notification" in window)) return;
    if (!VAPID_KEY || !FIREBASE_CONFIG.apiKey) return;

    async function init() {
      try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;

        const registration = await navigator.serviceWorker.register(
          "/firebase-messaging-sw.js",
          { scope: "/" }
        );
        await navigator.serviceWorker.ready;

        const { initializeApp, getApps } = await import("firebase/app");
        const { getMessaging, getToken, onMessage } = await import("firebase/messaging");

        if (!getApps().length) {
          initializeApp(FIREBASE_CONFIG);
        }

        const messaging = getMessaging();
        const token = await getToken(messaging, {
          vapidKey: VAPID_KEY,
          serviceWorkerRegistration: registration,
        });

        if (!token) return;

        await fetch("/api/admin/register-fcm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        }).catch(() => {});

        onMessage(messaging, (payload) => {
          const title = (payload.data?.title ?? payload.notification?.title) ?? "ISF運営";
          const body = (payload.data?.body ?? payload.notification?.body) ?? "";
          new Notification(title, { body, icon: "/icon-192.png" });
        });
      } catch (err) {
        console.warn("Admin FCM init error:", err);
      }
    }

    init();
  }, []);

  return null;
}
