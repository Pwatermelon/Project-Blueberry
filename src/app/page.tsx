import Link from "next/link";
import { auth } from "@/auth";
import { getPublicSiteUrl, isHubDeploy, isTenantDeploy } from "@/lib/deployment";
import { getTenantSlug } from "@/lib/deployment";
import { listPublishedTenants } from "@/lib/hub-registry";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

function TenantCard({
  name,
  shortName,
  description,
  siteUrl,
  primaryColor,
  accentColor,
  external,
}: {
  name: string;
  shortName?: string | null;
  description?: string | null;
  siteUrl: string;
  primaryColor: string;
  accentColor: string;
  external?: boolean;
}) {
  return (
    <a
      href={siteUrl}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className="portal-card group block p-5 transition hover:border-indigo-500/40"
      style={
        {
          "--org-primary": primaryColor,
          "--org-accent": accentColor,
        } as React.CSSProperties
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-[var(--org-accent)]">
            {shortName || "ВУЗ"}
          </p>
          <h3 className="mt-1 text-lg font-semibold text-white group-hover:text-indigo-200">
            {name}
          </h3>
          {description ? <p className="mt-2 text-sm text-zinc-500">{description}</p> : null}
        </div>
        <span className="text-zinc-600 group-hover:text-indigo-400" aria-hidden>
          →
        </span>
      </div>
      <p className="mt-4 truncate text-xs text-zinc-600">{siteUrl}</p>
    </a>
  );
}

async function HubHome() {
  const session = await auth();
  const tenants = await listPublishedTenants();

  return (
    <div className="portal-shell min-h-screen text-zinc-100">
      <div className="mx-auto max-w-5xl px-6 py-20">
        <p className="text-sm font-medium uppercase tracking-[0.25em] text-indigo-400">
          Родительский портал
        </p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Единый вход, общение между вузами
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-zinc-400">
          Здесь — авторизация через Яндекс ID и межвузовские чаты. Каждый вуз разворачивает{" "}
          <strong className="font-medium text-zinc-300">свою реплику</strong> на своём сервере:
          расписание, карты, участники — всё управляется локально. Ниже — зарегистрированные
          вузы и ссылки на их домены.
        </p>

        <div className="mt-10 flex flex-wrap gap-4">
          {session?.user ? (
            <Link
              href="/hub/chats"
              className="rounded-xl bg-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 hover:bg-indigo-400"
            >
              Межвузовские чаты
            </Link>
          ) : (
            <Link
              href="/login?redirectTo=/hub/chats"
              className="rounded-xl bg-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 hover:bg-indigo-400"
            >
              Войти через Яндекс ID
            </Link>
          )}
        </div>

        <section className="mt-20">
          <h2 className="text-lg font-semibold text-white">Вузы в сети</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Данные на стороне вуза. Hub хранит только мета и домен реплики.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {tenants.length === 0 ? (
              <p className="text-zinc-500 sm:col-span-2">
                Пока нет зарегистрированных вузов. Root добавляет их в{" "}
                <Link href="/hub/admin/tenants" className="text-indigo-400 hover:underline">
                  реестре
                </Link>
                .
              </p>
            ) : (
              tenants.map((t) => (
                <TenantCard
                  key={t.id}
                  name={t.name}
                  shortName={t.shortName}
                  description={t.description}
                  siteUrl={t.siteUrl}
                  primaryColor={t.primaryColor}
                  accentColor={t.accentColor}
                  external
                />
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

async function TenantHome() {
  const slug = getTenantSlug();
  if (!slug) {
    return (
      <div className="portal-shell flex min-h-screen items-center justify-center px-6 text-zinc-400">
        Задайте <code className="text-zinc-300">TENANT_SLUG</code> в окружении.
      </div>
    );
  }

  const session = await auth();
  if (session?.user?.id) {
    const member = await prisma.membership.findFirst({
      where: {
        userId: session.user.id,
        organization: { slug },
      },
    });
    if (member) redirect(`/o/${slug}/dashboard`);
  }

  const org = await prisma.organization.findUnique({ where: { slug } });
  const hubUrl = process.env.HUB_BASE_URL;

  return (
    <div className="portal-shell min-h-screen text-zinc-100">
      <div className="mx-auto max-w-lg px-6 py-24 text-center">
        <p className="text-sm uppercase tracking-widest text-zinc-500">Портал вуза</p>
        <h1 className="mt-3 text-3xl font-bold text-white">{org?.name ?? slug}</h1>
        <p className="mt-4 text-zinc-400">
          Локальная реплика на сервере вуза. Войдите через Яндекс ID — root или администратор
          добавит вас в участники.
        </p>
        <Link
          href={`/login?redirectTo=${encodeURIComponent(`/o/${slug}/dashboard`)}`}
          className="mt-8 inline-block rounded-xl bg-indigo-500 px-6 py-3 font-semibold text-white hover:bg-indigo-400"
        >
          Войти
        </Link>
        {hubUrl ? (
          <p className="mt-8 text-sm text-zinc-500">
            Межвузовское общение — на{" "}
            <a href={hubUrl} className="text-indigo-400 hover:underline">
              родительском портале
            </a>
          </p>
        ) : null}
      </div>
    </div>
  );
}

async function AllInOneHome() {
  const session = await auth();
  const [tenants, localOrgs] = await Promise.all([
    listPublishedTenants(),
    prisma.organization.findMany({
      orderBy: { name: "asc" },
      select: { slug: true, name: true, shortName: true, primaryColor: true, accentColor: true },
    }),
  ]);

  const base = getPublicSiteUrl() || "http://localhost:3000";

  return (
    <div className="portal-shell min-h-screen text-zinc-100">
      <div className="mx-auto max-w-5xl px-6 py-20">
        <p className="text-sm font-medium uppercase tracking-[0.25em] text-indigo-400">
          Dev: hub + tenant
        </p>
        <h1 className="mt-4 text-4xl font-bold text-white">Цифровой ВУЗ</h1>
        <p className="mt-4 max-w-2xl text-zinc-400">
          Локально симулируются и родительский портал, и реплики вузов.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/hub/chats" className="rounded-xl bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white">
            Hub: чаты
          </Link>
          <Link href="/login" className="portal-card px-5 py-2.5 text-sm font-semibold text-white">
            Войти
          </Link>
        </div>

        <section className="mt-16">
          <h2 className="text-lg font-semibold">Реестр (как на prod hub)</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {tenants.map((t) => (
              <TenantCard
                key={t.id}
                name={t.name}
                shortName={t.shortName}
                description={t.description}
                siteUrl={t.siteUrl}
                primaryColor={t.primaryColor}
                accentColor={t.accentColor}
                external={!t.siteUrl.includes("localhost")}
              />
            ))}
          </div>
        </section>

        <section className="mt-16">
          <h2 className="text-lg font-semibold">Локальные реплики (dev)</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {localOrgs.map((o) => (
              <TenantCard
                key={o.slug}
                name={o.name}
                shortName={o.shortName}
                description="Эмуляция реплики на этом же localhost"
                siteUrl={`${base}/o/${o.slug}/dashboard`}
                primaryColor={o.primaryColor}
                accentColor={o.accentColor}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default async function Home() {
  if (isHubDeploy()) return <HubHome />;
  if (isTenantDeploy()) return <TenantHome />;
  return <AllInOneHome />;
}
