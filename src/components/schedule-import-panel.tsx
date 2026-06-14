"use client";

import { useFormStatus } from "react-dom";
import { useFormState } from "react-dom";
import { useState } from "react";
import {
  importScheduleFromLegacyText,
  importScheduleJsonFile,
  syncScheduleFromSstu,
} from "@/actions/schedule-sync";

function UploadButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl bg-[var(--org-primary)] px-4 py-2 text-sm text-white disabled:opacity-60"
    >
      {pending ? "Импорт…" : "Загрузить JSON"}
    </button>
  );
}

export function ScheduleImportPanel({
  slug,
  groups,
  sstuGroupId,
  scheduleSource,
}: {
  slug: string;
  groups: Array<{ id: string; name: string; externalKey: string | null }>;
  sstuGroupId: number | null;
  scheduleSource: string;
}) {
  const [jsonState, jsonAction] = useFormState(importScheduleJsonFile.bind(null, slug), {});
  const [msg, setMsg] = useState<string | null>(null);
  const [legacy, setLegacy] = useState("");
  const [selectedGroup, setSelectedGroup] = useState(groups[0]?.id ?? "");

  async function onSstuSync() {
    setMsg(null);
    const r = await syncScheduleFromSstu(slug, selectedGroup || undefined);
    if ("error" in r && r.error) setMsg(r.error);
    else if ("ok" in r && r.ok) setMsg(`СГТУ: импортировано ${r.count} занятий`);
  }

  async function onLegacy(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const r = await importScheduleFromLegacyText(slug, legacy);
    if ("error" in r && r.error) setMsg(r.error);
    else if ("ok" in r && r.ok) {
      setMsg(`Legacy: импортировано ${r.count} занятий`);
      setLegacy("");
    }
  }

  return (
    <div className="space-y-8">
      {groups.length > 0 ? (
        <div className="portal-card p-4">
          <label className="mb-2 block text-sm text-zinc-400">Целевая группа (для СГТУ / override JSON)</label>
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="w-full max-w-md rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-white"
          >
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
                {g.externalKey ? ` (key: ${g.externalKey})` : ""}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          Сначала создайте учебные группы в разделе «Группы».
        </p>
      )}

      <section className="portal-card space-y-4 p-6">
        <h3 className="text-lg font-medium text-white">JSON v1.0 (рекомендуется)</h3>
        <p className="text-sm text-zinc-500">
          Стандартный формат — см. <code className="text-zinc-400">docs/SCHEDULE_FORMAT.md</code>.
          Поле <code className="text-zinc-400">organizationSlug</code> должно быть{" "}
          <strong className="text-zinc-300">{slug}</strong>.
        </p>
        <form action={jsonAction} className="flex flex-wrap items-end gap-4">
          <input type="hidden" name="groupId" value={selectedGroup} />
          <div>
            <label className="mb-1 block text-sm text-zinc-400">Файл .json</label>
            <input name="file" type="file" accept=".json,application/json" required className="text-sm text-zinc-400" />
          </div>
          <UploadButton />
        </form>
        {jsonState?.error ? <p className="text-sm text-red-400">{jsonState.error}</p> : null}
        {jsonState?.ok ? <p className="text-sm text-emerald-400">{jsonState.ok}</p> : null}
      </section>

      {scheduleSource === "SSTU_RASP" && sstuGroupId ? (
        <section className="portal-card space-y-4 p-6">
          <h3 className="text-lg font-medium text-white">Синхронизация с rasp.sstu.ru</h3>
          <p className="text-sm text-zinc-500">
            ID группы на сайте СГТУ: <span className="text-zinc-300">{sstuGroupId}</span> (в настройках
            вуза). Нужен запущенный парсер.
          </p>
          <button
            type="button"
            onClick={() => void onSstuSync()}
            className="rounded-xl bg-[var(--org-primary)] px-4 py-2 text-sm text-white"
          >
            Синхронизировать
          </button>
        </section>
      ) : null}

      <section className="portal-card space-y-4 p-6">
        <h3 className="text-lg font-medium text-white">Legacy TXT</h3>
        <p className="text-sm text-zinc-500">Формат из архива calendars/*.txt</p>
        <form onSubmit={onLegacy} className="space-y-3">
          <textarea
            value={legacy}
            onChange={(e) => setLegacy(e.target.value)}
            rows={6}
            className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 font-mono text-xs text-white"
            placeholder="20.05=Понедельник=8:00 - 9:30—;..."
          />
          <button
            type="submit"
            className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white hover:bg-white/5"
          >
            Импортировать текст
          </button>
        </form>
      </section>

      {msg ? <p className="text-sm text-zinc-300">{msg}</p> : null}
    </div>
  );
}
