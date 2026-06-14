"use client";

import { useFormStatus } from "react-dom";
import { useFormState } from "react-dom";
import type { Role } from "@prisma/client";
import {
  assignRegisteredUser,
  promoteToAdminForm,
  removeOrgMember,
  ROLE_LABELS,
} from "@/actions/org-members";

function PrimaryButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl bg-[var(--org-primary)] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

export function OrgMembersPanel({
  slug,
  isRoot,
  members,
  pendingYandexUsers,
}: {
  slug: string;
  isRoot: boolean;
  members: Array<{
    id: string;
    role: Role;
    user: { id: string; email: string; name: string | null; yandexId: string | null };
    studyGroup: { name: string } | null;
  }>;
  pendingYandexUsers: Array<{
    id: string;
    email: string;
    name: string | null;
    createdAt: Date;
  }>;
}) {
  const [assignState, assignAction] = useFormState(assignRegisteredUser.bind(null, slug), {});

  return (
    <div className="space-y-8">
      <section className="portal-card space-y-4 p-6">
        <h3 className="text-lg font-medium text-white">Добавить участника</h3>
        <p className="text-sm text-zinc-500">
          Пользователь должен хотя бы раз войти через Яндекс ID на этом сервере. Затем укажите его
          почту и роль — он получит доступ к порталу вуза.
        </p>
        <form action={assignAction} className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm text-zinc-400">Почта (Яндекс ID)</label>
            <input
              name="email"
              type="email"
              required
              list="yandex-users-list"
              placeholder="ivanov@yandex.ru"
              className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-white"
            />
            <datalist id="yandex-users-list">
              {pendingYandexUsers.map((u) => (
                <option key={u.id} value={u.email}>
                  {u.name ?? u.email}
                </option>
              ))}
            </datalist>
          </div>
          <div>
            <label className="mb-1 block text-sm text-zinc-400">Роль</label>
            <select
              name="role"
              defaultValue="STUDENT"
              className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-white"
            >
              <option value="STUDENT">{ROLE_LABELS.STUDENT}</option>
              <option value="TEACHER">{ROLE_LABELS.TEACHER}</option>
              <option value="STAFF">{ROLE_LABELS.STAFF}</option>
              {isRoot ? <option value="ADMIN">{ROLE_LABELS.ADMIN}</option> : null}
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
            <PrimaryButton label="Добавить в вуз" pendingLabel="Добавление…" />
            {assignState?.error ? <p className="mt-2 text-sm text-red-400">{assignState.error}</p> : null}
            {assignState?.ok ? <p className="mt-2 text-sm text-emerald-400">{assignState.ok}</p> : null}
          </div>
        </form>
      </section>

      {pendingYandexUsers.length > 0 ? (
        <section className="portal-card p-6">
          <h3 className="text-lg font-medium text-white">Зарегистрировались через Яндекс, но ещё не в вузе</h3>
          <p className="mt-1 text-sm text-zinc-500">{pendingYandexUsers.length} человек(а)</p>
          <ul className="mt-4 space-y-2">
            {pendingYandexUsers.slice(0, 10).map((u) => (
              <li key={u.id} className="flex justify-between text-sm text-zinc-300">
                <span>{u.name ?? "—"}</span>
                <span className="text-zinc-500">{u.email}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="portal-card overflow-hidden">
        <div className="border-b border-white/5 px-6 py-4">
          <h3 className="text-lg font-medium text-white">Участники вуза ({members.length})</h3>
          {isRoot ? (
            <p className="mt-1 text-xs text-zinc-500">
              Вы root (ROOT_ADMIN_EMAIL). Можете назначать других администраторов.
            </p>
          ) : null}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-zinc-500">
              <tr className="border-b border-white/5">
                <th className="px-6 py-3 font-medium">Имя / почта</th>
                <th className="px-6 py-3 font-medium">Роль</th>
                <th className="px-6 py-3 font-medium">Группа</th>
                <th className="px-6 py-3 font-medium">Действия</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <MemberRow key={m.id} slug={slug} isRoot={isRoot} member={m} />
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function MemberRow({
  slug,
  isRoot,
  member,
}: {
  slug: string;
  isRoot: boolean;
  member: {
    id: string;
    role: Role;
    user: { email: string; name: string | null };
    studyGroup: { name: string } | null;
  };
}) {
  return (
    <tr className="border-b border-white/5 last:border-0">
      <td className="px-6 py-3">
        <div className="text-white">{member.user.name ?? "—"}</div>
        <div className="text-xs text-zinc-500">{member.user.email}</div>
      </td>
      <td className="px-6 py-3 text-zinc-300">{ROLE_LABELS[member.role]}</td>
      <td className="px-6 py-3 text-zinc-400">{member.studyGroup?.name ?? "—"}</td>
      <td className="px-6 py-3">
        <div className="flex flex-wrap gap-2">
          {isRoot && member.role !== "ADMIN" ? (
            <form action={promoteToAdminForm.bind(null, slug)}>
              <input type="hidden" name="membershipId" value={member.id} />
              <button type="submit" className="text-xs text-indigo-400 hover:underline">
                Сделать админом
              </button>
            </form>
          ) : null}
          <form action={removeOrgMember.bind(null, slug)}>
            <input type="hidden" name="membershipId" value={member.id} />
            <button type="submit" className="text-xs text-red-400 hover:underline">
              Исключить
            </button>
          </form>
        </div>
      </td>
    </tr>
  );
}
