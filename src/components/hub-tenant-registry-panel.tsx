"use client";

import { useFormStatus } from "react-dom";
import { useFormState } from "react-dom";
import { deleteRegisteredTenant, upsertRegisteredTenant } from "@/actions/hub-registry";

function SaveButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
    >
      {pending ? "Сохранение…" : label}
    </button>
  );
}

export function HubTenantRegistryPanel({
  tenants,
}: {
  tenants: Array<{
    id: string;
    slug: string;
    name: string;
    shortName: string | null;
    description: string | null;
    siteUrl: string;
    logoUrl: string | null;
    primaryColor: string;
    accentColor: string;
    isPublished: boolean;
    sortOrder: number;
  }>;
}) {
  const [state, action] = useFormState(upsertRegisteredTenant, {});

  return (
    <div className="space-y-10">
      <section className="portal-card space-y-4 p-6">
        <h2 className="text-lg font-medium text-white">Добавить вуз в реестр</h2>
        <p className="text-sm text-zinc-500">
          Вуз уже развернул реплику у себя. Здесь — только мета и ссылка на его домен. Расписание,
          карты и участники управляются на его сервере.
        </p>
        <form action={action} className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-zinc-400">Slug</label>
            <input name="slug" required placeholder="sstu" className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-white" />
          </div>
          <div>
            <label className="mb-1 block text-sm text-zinc-400">Домен реплики</label>
            <input
              name="siteUrl"
              required
              placeholder="https://portal.sstu.ru"
              className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-white"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm text-zinc-400">Полное название</label>
            <input name="name" required className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-white" />
          </div>
          <div>
            <label className="mb-1 block text-sm text-zinc-400">Краткое</label>
            <input name="shortName" placeholder="СГТУ" className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-white" />
          </div>
          <div>
            <label className="mb-1 block text-sm text-zinc-400">Порядок</label>
            <input name="sortOrder" type="number" defaultValue={0} className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-white" />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm text-zinc-400">Описание</label>
            <textarea name="description" rows={2} className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-white" />
          </div>
          <div>
            <label className="mb-1 block text-sm text-zinc-400">Основной цвет</label>
            <input name="primaryColor" type="color" defaultValue="#4f46e5" className="h-10 w-full" />
          </div>
          <div>
            <label className="mb-1 block text-sm text-zinc-400">Акцент</label>
            <input name="accentColor" type="color" defaultValue="#a855f7" className="h-10 w-full" />
          </div>
          <div className="flex items-center gap-2 sm:col-span-2">
            <input name="isPublished" type="checkbox" defaultChecked id="pub" />
            <label htmlFor="pub" className="text-sm text-zinc-400">
              Показывать на главной
            </label>
          </div>
          <div className="sm:col-span-2">
            <SaveButton label="Добавить" />
            {state?.error ? <p className="mt-2 text-sm text-red-400">{state.error}</p> : null}
            {state?.ok ? <p className="mt-2 text-sm text-emerald-400">{state.ok}</p> : null}
          </div>
        </form>
      </section>

      <section className="portal-card overflow-hidden">
        <div className="border-b border-white/5 px-6 py-4">
          <h2 className="text-lg font-medium text-white">Зарегистрированные вузы ({tenants.length})</h2>
        </div>
        <ul className="divide-y divide-white/5">
          {tenants.map((t) => (
            <li key={t.id} className="px-6 py-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-white">
                    {t.shortName || t.slug} — {t.name}
                  </p>
                  <a
                    href={t.siteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-indigo-400 hover:underline"
                  >
                    {t.siteUrl}
                  </a>
                  {t.description ? <p className="mt-1 text-sm text-zinc-500">{t.description}</p> : null}
                </div>
                <form action={deleteRegisteredTenant}>
                  <input type="hidden" name="id" value={t.id} />
                  <button type="submit" className="text-sm text-red-400 hover:text-red-300">
                    Удалить
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
