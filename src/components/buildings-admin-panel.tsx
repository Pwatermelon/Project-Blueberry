"use client";

import { useFormStatus } from "react-dom";
import { useFormState } from "react-dom";
import { deleteBuilding, upsertBuilding, upsertBuildingForm } from "@/actions/campus-buildings";

function SaveButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl bg-[var(--org-primary)] px-4 py-2 text-sm text-white disabled:opacity-60"
    >
      {pending ? "…" : label}
    </button>
  );
}

export function BuildingsAdminPanel({
  slug,
  buildings,
}: {
  slug: string;
  buildings: Array<{
    id: string;
    name: string;
    address: string | null;
    lat: number;
    lng: number;
    description: string | null;
    floors: unknown;
  }>;
}) {
  const [state, action] = useFormState(upsertBuilding.bind(null, slug), {});

  return (
    <div className="space-y-8">
      <section className="portal-card space-y-4 p-6">
        <h3 className="text-lg font-medium text-white">Добавить корпус</h3>
        <form action={action} className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm text-zinc-400">Название</label>
            <input name="name" required className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-white" />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm text-zinc-400">Адрес</label>
            <input name="address" className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-white" />
          </div>
          <div>
            <label className="mb-1 block text-sm text-zinc-400">Широта</label>
            <input name="lat" type="number" step="any" required defaultValue={51.5335} className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-white" />
          </div>
          <div>
            <label className="mb-1 block text-sm text-zinc-400">Долгота</label>
            <input name="lng" type="number" step="any" required defaultValue={46.0345} className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-white" />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm text-zinc-400">Описание</label>
            <textarea name="description" rows={2} className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-white" />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm text-zinc-400">Этажи (JSON)</label>
            <textarea
              name="floorsJson"
              rows={6}
              defaultValue="[]"
              className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 font-mono text-xs text-white"
            />
          </div>
          <div className="sm:col-span-2">
            <SaveButton label="Сохранить корпус" />
            {state?.error ? <p className="mt-2 text-sm text-red-400">{state.error}</p> : null}
            {state?.ok ? <p className="mt-2 text-sm text-emerald-400">{state.ok}</p> : null}
          </div>
        </form>
      </section>

      <section className="space-y-4">
        {buildings.map((b) => (
          <details key={b.id} className="portal-card p-4">
            <summary className="cursor-pointer font-medium text-white">
              {b.name}
              {b.address ? <span className="ml-2 text-sm font-normal text-zinc-500">{b.address}</span> : null}
            </summary>
            <form action={upsertBuildingForm.bind(null, slug)} className="mt-4 grid gap-3 sm:grid-cols-2">
              <input type="hidden" name="id" value={b.id} />
              <div className="sm:col-span-2">
                <input name="name" defaultValue={b.name} required className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-white" />
              </div>
              <div className="sm:col-span-2">
                <input name="address" defaultValue={b.address ?? ""} className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-white" />
              </div>
              <input name="lat" type="number" step="any" defaultValue={b.lat} className="rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-white" />
              <input name="lng" type="number" step="any" defaultValue={b.lng} className="rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-white" />
              <div className="sm:col-span-2">
                <textarea name="description" defaultValue={b.description ?? ""} rows={2} className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-white" />
              </div>
              <div className="sm:col-span-2">
                <textarea
                  name="floorsJson"
                  defaultValue={JSON.stringify(b.floors ?? [], null, 2)}
                  rows={8}
                  className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 font-mono text-xs text-white"
                />
              </div>
              <div className="flex gap-3 sm:col-span-2">
                <SaveButton label="Обновить" />
              </div>
            </form>
            <form action={deleteBuilding.bind(null, slug)} className="mt-2">
              <input type="hidden" name="id" value={b.id} />
              <button type="submit" className="text-sm text-red-400 hover:text-red-300">
                Удалить корпус
              </button>
            </form>
          </details>
        ))}
      </section>
    </div>
  );
}
