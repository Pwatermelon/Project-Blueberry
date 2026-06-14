import { ScheduleImportPanel } from "@/components/schedule-import-panel";
import { getOrgAdminContext } from "@/lib/org-permissions";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function AdminSchedulePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ctx = await getOrgAdminContext(slug);
  if (!ctx) redirect(`/o/${slug}/dashboard`);

  const groups = await prisma.studyGroup.findMany({
    where: { organizationId: ctx.org.id },
    orderBy: { name: "asc" },
    select: { id: true, name: true, externalKey: true },
  });

  const entryCount = await prisma.scheduleEntry.count({
    where: { organizationId: ctx.org.id },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-white">Импорт расписания</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Управляется на стороне вуза. Сейчас в БД: {entryCount} занятий, {groups.length} групп.
        </p>
      </div>
      <ScheduleImportPanel
        slug={slug}
        groups={groups}
        sstuGroupId={ctx.org.sstuGroupId}
        scheduleSource={ctx.org.scheduleSource}
      />
    </div>
  );
}
