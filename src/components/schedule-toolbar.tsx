"use client";

import { useState } from "react";
import { importScheduleFromLegacyText, syncScheduleFromSstu } from "@/actions/schedule-sync";

export function ScheduleToolbar({ slug, canSync }: { slug: string; canSync: boolean }) {
  const [msg, setMsg] = useState<string | null>(null);
  const [raw, setRaw] = useState("");

  async function onSync() {
    setMsg(null);
    const r = await syncScheduleFromSstu(slug);
    if ("error" in r && r.error) setMsg(r.error);
    else if ("ok" in r && r.ok) setMsg(`Импортировано занятий: ${r.count}`);
  }

  async function onImport(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const r = await importScheduleFromLegacyText(slug, raw);
    if ("error" in r && r.error) setMsg(r.error);
    else if ("ok" in r && r.ok) {
      setMsg(`Импортировано занятий: ${r.count}`);
      setRaw("");
    }
  }

  if (!canSync) return null;

  return (
    <div className="mb-8 space-y-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
      <p className="text-sm text-zinc-400">
        Синхронизация с сайтом СГТУ (парсер в Docker) или вставьте текст в legacy-формате (файлы{" "}
        <code className="text-zinc-300">calendars/*.txt</code> из старого проекта).
      </p>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => void onSync()}
          className="rounded-xl bg-[var(--org-primary)] px-4 py-2 text-sm font-medium text-white"
        >
          Синхронизировать с rasp.sstu.ru
        </button>
      </div>
      <form onSubmit={onImport} className="space-y-2">
        <label className="text-sm text-zinc-400">Импорт legacy-текста</label>
        <textarea
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          rows={5}
          className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 font-mono text-sm text-white"
          placeholder="20.05=Понедельник=8:00 - 9:30—;..."
        />
        <button
          type="submit"
          className="rounded-xl border border-[var(--org-accent)] px-4 py-2 text-sm text-white"
        >
          Импортировать текст
        </button>
      </form>
      {msg ? <p className="text-sm text-zinc-300">{msg}</p> : null}
    </div>
  );
}
