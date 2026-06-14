import Link from "next/link";
import { auth } from "@/auth";
import { DashboardTiles } from "@/components/dashboard-tiles";
import { getOrgAdminContext } from "@/lib/org-permissions";
import { getOrgBySlug } from "@/lib/org-context";
import { notFound } from "next/navigation";

export default async function DashboardPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth();
  const ctx = await getOrgBySlug(slug);
  if (!ctx) notFound();

  const adminCtx = await getOrgAdminContext(slug);
  const banner = ctx.portalConfig.welcomeBanner;
  const isAdmin = Boolean(adminCtx);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-white">Добро пожаловать</h2>
        <p className="mt-1 text-zinc-400">
          {session?.user?.name || session?.user?.email} · {ctx.organization.shortName || ctx.organization.name}
        </p>
      </div>

      {banner ? (
        <div className="portal-card bg-gradient-to-br from-[var(--org-primary)]/15 to-[var(--org-accent)]/10 p-6">
          <p className="leading-relaxed text-zinc-100">{banner}</p>
        </div>
      ) : null}

      <DashboardTiles slug={slug} portalConfig={ctx.portalConfig} />

      {isAdmin ? (
        <section className="portal-card p-6">
          <h3 className="font-medium text-white">Администрирование</h3>
          <p className="mt-1 text-sm text-zinc-500">Данные вуза — на этой реплике, не на hub.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {[
              ["Участники", "members"],
              ["Группы", "groups"],
              ["Расписание", "schedule"],
              ["Корпуса", "buildings"],
              ["Настройки", "settings"],
            ].map(([label, path]) => (
              <Link
                key={path}
                href={`/o/${slug}/admin/${path}`}
                className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-zinc-300 hover:bg-white/5 hover:text-white"
              >
                {label}
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
