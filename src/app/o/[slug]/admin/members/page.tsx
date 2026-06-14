import { auth } from "@/auth";
import { MemberBindingsPanel } from "@/components/member-bindings-panel";
import { OrgMembersPanel } from "@/components/org-members-panel";
import { getOrgBySlug } from "@/lib/org-context";
import { getOrgAdminContext } from "@/lib/org-permissions";
import { getRootAdminEmail } from "@/lib/root-admin";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";

export default async function AdminMembersPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ctx = await getOrgAdminContext(slug);
  if (!ctx) {
    const session = await auth();
    if (session?.user?.id) redirect(`/o/${slug}/dashboard`);
    redirect(`/login?redirectTo=${encodeURIComponent(`/o/${slug}/admin/members`)}`);
  }

  const orgCtx = await getOrgBySlug(slug);
  if (!orgCtx) notFound();

  const [members, pendingYandexUsers, bindings] = await Promise.all([
    prisma.membership.findMany({
      where: { organizationId: orgCtx.organization.id },
      orderBy: [{ role: "asc" }, { user: { email: "asc" } }],
      include: {
        user: { select: { id: true, email: true, name: true, yandexId: true } },
        studyGroup: { select: { name: true } },
      },
    }),
    prisma.user.findMany({
      where: {
        yandexId: { not: null },
        NOT: {
          memberships: { some: { organizationId: orgCtx.organization.id } },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { id: true, email: true, name: true, createdAt: true },
    }),
    prisma.organizationEmailBinding.findMany({
      where: { organizationId: orgCtx.organization.id },
      orderBy: [{ boundAt: "desc" }, { createdAt: "desc" }],
      include: {
        studyGroup: { select: { name: true } },
        boundUser: { select: { name: true, email: true } },
      },
    }),
  ]);

  const rootEmail = getRootAdminEmail();

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <div>
        <h2 className="text-2xl font-semibold text-white">Управление участниками</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Вуз управляет своими данными на своём сервере. Root задаётся при деплое через{" "}
          <code className="text-zinc-400">ROOT_ADMIN_EMAIL</code>
          {rootEmail ? (
            <>
              {" "}
              (сейчас: <span className="text-zinc-300">{rootEmail}</span>)
            </>
          ) : (
            " (не задан — используйте демо-админа в dev)"
          )}
          . Root и назначенные им администраторы добавляют студентов и преподавателей, которые уже
          вошли через Яндекс ID.
        </p>
      </div>

      <OrgMembersPanel
        slug={slug}
        isRoot={ctx.isRoot}
        members={members}
        pendingYandexUsers={pendingYandexUsers}
      />

      <details className="portal-card group p-6">
        <summary className="cursor-pointer text-lg font-medium text-white">
          Резерв по почте (до первого входа)
        </summary>
        <p className="mt-3 text-sm text-zinc-500">
          Опционально: можно заранее добавить почту — доступ откроется автоматически, когда человек
          впервые войдёт через Яндекс ID.
        </p>
        <div className="mt-6">
          <MemberBindingsPanel slug={slug} bindings={bindings} />
        </div>
      </details>
    </div>
  );
}
