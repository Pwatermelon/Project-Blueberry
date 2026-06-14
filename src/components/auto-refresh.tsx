"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Периодически обновляет server components (чаты без WebSocket). */
export function AutoRefresh({
  intervalMs = 8000,
  enabled = true,
}: {
  intervalMs?: number;
  enabled?: boolean;
}) {
  const router = useRouter();

  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs, enabled]);

  return null;
}
