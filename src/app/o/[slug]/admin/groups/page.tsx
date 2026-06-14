import fs from "node:fs";
import { StudyGroupsPanel } from "@/components/study-groups-panel";
import { getOrgAdminContext } from "@/lib/org-permissions";
import { resolveTenantDataPath } from "@/lib/tenant-pack";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function AdminGroupsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ctx = await getOrgAdminContext(slug);
  if (!ctx) redirect(`/o/${slug}/dashboard`);

  const groups = await prisma.studyGroup.findMany({
    where: { organizationId: ctx.org.id },
    orderBy: { name: "asc" },
    include: { _count: { select: { memberships: true } } },
  });

  const csvPath = resolveTenantDataPath(slug, "data/links.csv");
  const hasLinksCsv = fs.existsSync(csvPath);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-white">Учебные группы</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Группы для расписания и привязки студентов. Управляется на стороне вуза — hub этого не
          хранит.
        </p>
      </div>
      <StudyGroupsPanel slug={slug} groups={groups} hasLinksCsv={hasLinksCsv} />
    </div>
  );
}
