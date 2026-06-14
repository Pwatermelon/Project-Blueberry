import { auth } from "@/auth";
import { getOrgBySlug } from "@/lib/org-context";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function SchedulePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth();
  const ctx = await getOrgBySlug(slug);
  if (!ctx) notFound();

  const member = await prisma.membership.findFirst({
    where: { userId: session!.user!.id, organizationId: ctx.organization.id },
    include: { studyGroup: true },
  });

  const groupId = member?.studyGroupId;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 21);

  const entries = groupId
    ? await prisma.scheduleEntry.findMany({
        where: {
          organizationId: ctx.organization.id,
          studyGroupId: groupId,
          date: { gte: start, lte: end },
        },
        orderBy: [{ date: "asc" }, { timeStart: "asc" }],
      })
    : [];

  const canSync = member?.role === "ADMIN" || member?.role === "STAFF";

  return (
    <div>
      <h2 className="text-2xl font-semibold text-white">Расписание</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Источник: {ctx.organization.scheduleSource}
        {ctx.organization.sstuGroupId ? ` · ID группы СГТУ: ${ctx.organization.sstuGroupId}` : null}
      </p>

      {canSync ? (
        <p className="mt-4 text-sm text-zinc-500">
          Импорт расписания — в{" "}
          <a href={`/o/${slug}/admin/schedule`} className="text-[var(--org-accent)] hover:underline">
            админке
          </a>
          .
        </p>
      ) : null}

      {entries.length === 0 ? (
        <p className="mt-6 text-zinc-500">
          Пока нет занятий. Привяжите учебную группу к профилю или попросите администратора выполнить импорт.
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {entries.map((e) => (
            <li
              key={e.id}
              className="flex flex-col gap-1 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium text-white">{e.subject}</p>
                <p className="text-sm text-zinc-400">
                  {e.date.toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" })}
                  {" · "}
                  {e.timeStart}–{e.timeEnd}
                  {e.room ? ` · ${e.room}` : ""}
                </p>
              </div>
              <div className="text-sm text-zinc-500">
                {e.kind ? <span>{e.kind}</span> : null}
                {e.teacher ? <span className="ml-2">{e.teacher}</span> : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
