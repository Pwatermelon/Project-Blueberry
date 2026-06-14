"use client";

import { useFormStatus } from "react-dom";
import { useFormState } from "react-dom";
import { addEmailBinding, importEmailBindingsCsv, removeEmailBindingForm } from "@/actions/member-bindings";
import type { Role } from "@prisma/client";

const roleLabels: Record<Role, string> = {
  STUDENT: "Студент",
  TEACHER: "Преподаватель",
  STAFF: "Сотрудник",
  ADMIN: "Администратор",
};

function AddButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl bg-[var(--org-primary)] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
    >
      {pending ? "Добавление…" : "Добавить почту"}
    </button>
  );
}

function ImportButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white hover:bg-white/5 disabled:opacity-60"
    >
      {pending ? "Импорт…" : "Загрузить CSV"}
    </button>
  );
}

export function MemberBindingsPanel({
  slug,
  bindings,
}: {
  slug: string;
  bindings: Array<{
    id: string;
    email: string;
    role: Role;
    note: string | null;
    boundAt: Date | null;
    studyGroup: { name: string } | null;
    boundUser: { name: string | null; email: string } | null;
  }>;
}) {
  const [addState, addAction] = useFormState(addEmailBinding.bind(null, slug), {});
  const [importState, importAction] = useFormState(importEmailBindingsCsv.bind(null, slug), {});

  return (
    <div className="space-y-8">
      <section className="portal-card space-y-4 p-6">
        <h3 className="text-lg font-medium text-white">Добавить почту</h3>
        <p className="text-sm text-zinc-500">
          Укажите почту Яндекс ID студента или сотрудника. После первого входа через Яндекс доступ к
          порталу откроется автоматически.
        </p>
        <form action={addAction} className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm text-zinc-400">Почта Яндекс</label>
            <input
              name="email"
              type="email"
              required
              placeholder="ivanov@yandex.ru"
              className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-zinc-400">Роль</label>
            <select
              name="role"
              defaultValue="STUDENT"
              className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-white"
            >
              {Object.entries(roleLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm text-zinc-400">Группа (необязательно)</label>
            <input
              name="groupName"
              placeholder="м2-ИФСТ-11"
              className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-white"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm text-zinc-400">Комментарий</label>
            <input
              name="note"
              placeholder="ФИО, кафедра…"
              className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-white"
            />
          </div>
          <div className="sm:col-span-2">
            <AddButton />
            {addState?.error ? <p className="mt-2 text-sm text-red-400">{addState.error}</p> : null}
            {addState?.ok ? <p className="mt-2 text-sm text-emerald-400">{addState.ok}</p> : null}
          </div>
        </form>
      </section>

      <section className="portal-card space-y-4 p-6">
        <h3 className="text-lg font-medium text-white">Импорт CSV</h3>
        <p className="text-sm text-zinc-500">
          Колонки: <code className="text-zinc-400">email, role, group, note</code>. Разделитель — запятая
          или точка с запятой.
        </p>
        <form action={importAction} className="flex flex-wrap items-end gap-4">
          <div>
            <label className="mb-1 block text-sm text-zinc-400">Файл</label>
            <input
              name="file"
              type="file"
              accept=".csv,text/csv"
              required
              className="text-sm text-zinc-400"
            />
          </div>
          <ImportButton />
        </form>
        {importState?.error ? <p className="text-sm text-red-400">{importState.error}</p> : null}
        {importState?.ok ? <p className="text-sm text-emerald-400">{importState.ok}</p> : null}
      </section>

      <section className="portal-card overflow-hidden">
        <div className="border-b border-white/5 px-6 py-4">
          <h3 className="text-lg font-medium text-white">Список ({bindings.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-zinc-500">
              <tr className="border-b border-white/5">
                <th className="px-6 py-3 font-medium">Почта</th>
                <th className="px-6 py-3 font-medium">Роль</th>
                <th className="px-6 py-3 font-medium">Группа</th>
                <th className="px-6 py-3 font-medium">Статус</th>
                <th className="px-6 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {bindings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">
                    Пока никого нет — добавьте почты студентов и преподавателей.
                  </td>
                </tr>
              ) : (
                bindings.map((b) => (
                  <tr key={b.id} className="border-b border-white/5 last:border-0">
                    <td className="px-6 py-3 text-white">{b.email}</td>
                    <td className="px-6 py-3 text-zinc-300">{roleLabels[b.role]}</td>
                    <td className="px-6 py-3 text-zinc-400">{b.studyGroup?.name ?? "—"}</td>
                    <td className="px-6 py-3">
                      {b.boundAt ? (
                        <span className="text-emerald-400">Вошёл</span>
                      ) : (
                        <span className="text-zinc-500">Ждёт входа</span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <RemoveBindingButton slug={slug} bindingId={b.id} />
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

function RemoveBindingButton({ slug, bindingId }: { slug: string; bindingId: string }) {
  return (
    <form action={removeEmailBindingForm.bind(null, slug)}>
      <input type="hidden" name="bindingId" value={bindingId} />
      <button type="submit" className="text-sm text-red-400 hover:text-red-300">
        Удалить
      </button>
    </form>
  );
}
