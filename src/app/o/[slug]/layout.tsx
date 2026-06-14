import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { OrgNav } from "@/components/org-nav";
import { OrgHeader } from "@/components/org-header";
import { getOrgBySlug } from "@/lib/org-context";
import { prisma } from "@/lib/prisma";

export default async function OrgLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/login?redirectTo=${encodeURIComponent(`/o/${slug}/dashboard`)}`);
  }

  const ctx = await getOrgBySlug(slug);
  if (!ctx) notFound();

  const member = await prisma.membership.findUnique({
    where: {
      userId_organizationId: { userId: session.user.id, organizationId: ctx.organization.id },
    },
  });
  if (!member) {
    redirect(`/access-pending?org=${encodeURIComponent(slug)}`);
  }

  const { organization: org, portalConfig } = ctx;
  const isAdmin = member.role === "ADMIN";

  return (
    <div
      className="portal-shell min-h-screen text-zinc-100"
      style={
        {
          "--org-primary": org.primaryColor,
          "--org-accent": org.accentColor,
        } as React.CSSProperties
      }
    >
      <div className="mx-auto flex max-w-7xl gap-0 md:gap-8">
        <aside className="hidden w-60 shrink-0 border-r border-white/5 px-4 py-8 md:block">
          <div className="mb-2 text-xs font-medium uppercase tracking-widest text-zinc-500">
            {org.shortName || org.slug}
          </div>
          <div className="mb-8 text-xl font-bold tracking-tight text-white">Цифровой ВУЗ</div>
          <OrgNav slug={slug} portalConfig={portalConfig} isAdmin={isAdmin} />
        </aside>
        <div className="min-h-screen flex-1">
          <OrgHeader orgName={org.name} userEmail={session.user.email} />
          <div className="border-b border-white/5 px-4 py-3 md:hidden">
            <OrgNav slug={slug} portalConfig={portalConfig} isAdmin={isAdmin} />
          </div>
          <main className="p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
