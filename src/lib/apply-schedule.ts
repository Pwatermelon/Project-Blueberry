import { prisma } from "@/lib/prisma";
import type { ParsedLesson } from "@/lib/parser-client";

export async function replaceScheduleForGroup(
  organizationId: string,
  studyGroupId: string,
  lessons: ParsedLesson[],
) {
  await prisma.$transaction(async (tx) => {
    await tx.scheduleEntry.deleteMany({ where: { studyGroupId } });
    for (const L of lessons) {
      const d = new Date(L.date);
      if (Number.isNaN(d.getTime())) continue;
      await tx.scheduleEntry.create({
        data: {
          organizationId,
          studyGroupId,
          date: d,
          timeStart: L.time_start,
          timeEnd: L.time_end,
          room: L.room,
          subject: L.subject,
          kind: L.kind,
          teacher: L.teacher,
        },
      });
    }
  });
}
