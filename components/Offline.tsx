"use client";

import { useEffect, useState } from "react";

/**
 * Registers the offline service worker (out/sw.js, written after each build) and says in the
 * footer once the site has been saved for offline use. Does nothing in `next dev`.
 */
export function Offline() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
    navigator.serviceWorker.register(`${base}/sw.js`, { scope: `${base}/` }).catch(() => {});
    navigator.serviceWorker.ready.then((r) => { if (r.active) setReady(true); });
  }, []);
  if (!ready) return null;
  return <span className="mt-1 block text-xs text-stone-400">✓ Saved on this device: works offline</span>;
}
