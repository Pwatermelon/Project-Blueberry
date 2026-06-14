"use client";

import { useFormStatus } from "react-dom";
import { useFormState } from "react-dom";
import {
  addStudyGroup,
  deleteStudyGroup,
  importStudyGroupsFromPackForm,
} from "@/actions/study-groups";

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl bg-[var(--org-primary)] px-4 py-2 text-sm text-white disabled:opacity-60"
    >
      {pending ? "…" : "Добавить группу"}
    </button>
  );
}

export function StudyGroupsPanel({
  slug,
  groups,
  hasLinksCsv,
}: {
  slug: string;
  groups: Array<{ id: string; name: string; externalKey: string | null; _count: { memberships: number } }>;
  hasLinksCsv: boolean;
}) {
  const [state, action] = useFormState(addStudyGroup.bind(null, slug), {});

  return (
    <div className="space-y-8">
      <section className="portal-card space-y-4 p-6">
        <h3 className="text-lg font-medium text-white">Новая учебная группа</h3>
        <p className="text-sm text-zinc-500">
          Группы нужны для расписания и привязки студентов. External key — ID в системе расписания
          (например, номер на rasp.sstu.ru).
        </p>
        <form action={action} className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-zinc-400">Название</label>
            <input
              name="name"
              required
              placeholder="м2-ИФСТ-11"
              className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-zinc-400">External key</label>
            <input
              name="externalKey"
              placeholder="55"
              className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-white"
            />
          </div>
          <div className="sm:col-span-2">
            <SaveButton />
            {state?.error ? <p className="mt-2 text-sm text-red-400">{state.error}</p> : null}
            {state?.ok ? <p className="mt-2 text-sm text-emerald-400">{state.ok}</p> : null}
          </div>
        </form>
      </section>

      {hasLinksCsv ? (
        <section className="portal-card p-6">
          <h3 className="text-lg font-medium text-white">Импорт из tenant pack</h3>
          <p className="mt-1 text-sm text-zinc-500">
            Загрузить все группы из <code className="text-zinc-400">tenants/{slug}/data/links.csv</code>
          </p>
          <form action={importStudyGroupsFromPackForm.bind(null, slug)} className="mt-4">
            <button
              type="submit"
              className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white hover:bg-white/5"
            >
              Импортировать CSV
            </button>
          </form>
        </section>
      ) : null}

      <section className="portal-card overflow-hidden">
        <div className="border-b border-white/5 px-6 py-4">
          <h3 className="text-lg font-medium text-white">Группы ({groups.length})</h3>
        </div>
        <div className="max-h-[420px] overflow-y-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-zinc-900/95 text-zinc-500">
              <tr className="border-b border-white/5">
                <th className="px-6 py-3">Название</th>
                <th className="px-6 py-3">Key</th>
                <th className="px-6 py-3">Студентов</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody>
              {groups.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-zinc-500">
                    Нет групп — добавьте вручную или импортируйте CSV.
                  </td>
                </tr>
              ) : (
                groups.map((g) => (
                  <tr key={g.id} className="border-b border-white/5">
                    <td className="px-6 py-3 text-white">{g.name}</td>
                    <td className="px-6 py-3 text-zinc-400">{g.externalKey ?? "—"}</td>
                    <td className="px-6 py-3 text-zinc-400">{g._count.memberships}</td>
                    <td className="px-6 py-3 text-right">
                      <form action={deleteStudyGroup.bind(null, slug)}>
                        <input type="hidden" name="groupId" value={g.id} />
                        <button type="submit" className="text-red-400 hover:text-red-300">
                          Удалить
                        </button>
                      </form>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
