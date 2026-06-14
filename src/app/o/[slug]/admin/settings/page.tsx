import { auth } from "@/auth";
import { updateOrganizationSettings } from "@/actions/org-admin";
import { getOrgBySlug } from "@/lib/org-context";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";

export default async function AdminSettingsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth();
  const ctx = await getOrgBySlug(slug);
  if (!ctx) notFound();

  const member = await prisma.membership.findUnique({
    where: {
      userId_organizationId: { userId: session!.user!.id, organizationId: ctx.organization.id },
    },
  });
  if (member?.role !== "ADMIN") {
    redirect(`/o/${slug}/dashboard`);
  }

  const org = ctx.organization;
  const pc = ctx.portalConfig;

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-white">Настройки вуза</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Одинаковый набор полей для всех организаций: бренд, интеграция с СГТУ, приветствие. Расширение — через
          portalConfig (JSON).
        </p>
      </div>

      <form action={updateOrganizationSettings.bind(null, slug)} className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
        <div>
          <label className="mb-1 block text-sm text-zinc-400">Полное название</label>
          <input
            name="name"
            defaultValue={org.name}
            required
            className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-zinc-400">Краткое название</label>
          <input
            name="shortName"
            defaultValue={org.shortName ?? ""}
            className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-white"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-zinc-400">Основной цвет</label>
            <input
              name="primaryColor"
              type="color"
              defaultValue={org.primaryColor}
              className="h-10 w-full cursor-pointer rounded-xl border border-white/10 bg-zinc-900"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-zinc-400">Акцент</label>
            <input
              name="accentColor"
              type="color"
              defaultValue={org.accentColor}
              className="h-10 w-full cursor-pointer rounded-xl border border-white/10 bg-zinc-900"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm text-zinc-400">URL логотипа</label>
          <input
            name="logoUrl"
            defaultValue={org.logoUrl ?? ""}
            placeholder="https://..."
            className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-zinc-400">ID группы на rasp.sstu.ru</label>
          <input
            name="sstuGroupId"
            type="number"
            defaultValue={org.sstuGroupId ?? ""}
            placeholder="55"
            className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-zinc-400">Приветственный баннер (текст)</label>
          <textarea
            name="welcomeBanner"
            defaultValue={pc.welcomeBanner ?? ""}
            rows={3}
            className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-zinc-400">Справка по расписанию (URL)</label>
          <input
            name="scheduleHelpUrl"
            defaultValue={pc.scheduleHelpUrl ?? ""}
            className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-zinc-400">
            portalConfig (JSON) — центр карты, featureFlags и др.
          </label>
          <textarea
            name="portalConfigJson"
            rows={12}
            defaultValue={JSON.stringify(org.portalConfig ?? {}, null, 2)}
            className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 font-mono text-xs text-white"
          />
          <p className="mt-1 text-xs text-zinc-500">
            Сохраняется поверх полей выше; невалидный JSON игнорируется. Схема:{" "}
            <code className="text-zinc-400">src/lib/portal-config.ts</code>
          </p>
        </div>
        <button type="submit" className="rounded-xl bg-[var(--org-primary)] px-4 py-2 text-sm font-medium text-white">
          Сохранить
        </button>
      </form>
    </div>
  );
}
