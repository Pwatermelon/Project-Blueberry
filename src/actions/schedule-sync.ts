"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { replaceScheduleForGroup } from "@/lib/apply-schedule";
import { prisma } from "@/lib/prisma";
import { fetchSstuSchedule, postSstuLegacyTxt } from "@/lib/parser-client";
import { parseScheduleJson, scheduleJsonToLessons } from "@/lib/schedule-json";

async function ensureStaff(slug: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Нужна авторизация." as const, session: null, org: null, group: null };
  }
  const org = await prisma.organization.findUnique({ where: { slug } });
  if (!org) {
    return { error: "Вуз не найден." as const, session: null, org: null, group: null };
  }
  const member = await prisma.membership.findUnique({
    where: {
      userId_organizationId: { userId: session.user.id, organizationId: org.id },
    },
  });
  if (!member || (member.role !== "ADMIN" && member.role !== "STAFF")) {
    return { error: "Недостаточно прав." as const, session: null, org: null, group: null };
  }
  return { error: null, session, org, member };
}

async function resolveImportGroup(org: { id: string; sstuGroupId: number | null }) {
  if (org.sstuGroupId) {
    const byExt = await prisma.studyGroup.findFirst({
      where: {
        organizationId: org.id,
        OR: [{ externalKey: String(org.sstuGroupId) }, { name: "Основная группа" }],
      },
    });
    if (byExt) return byExt;
  }
  return prisma.studyGroup.findFirst({ where: { organizationId: org.id } });
}

async function resolveGroupByName(organizationId: string, name: string, externalKey?: string | null) {
  const group = await prisma.studyGroup.findUnique({
    where: { organizationId_name: { organizationId, name } },
  });
  if (group) {
    if (externalKey && group.externalKey !== externalKey) {
      return prisma.studyGroup.update({
        where: { id: group.id },
        data: { externalKey },
      });
    }
    return group;
  }
  return prisma.studyGroup.create({
    data: { organizationId, name, externalKey: externalKey ?? null },
  });
}

function revalidateSchedule(slug: string) {
  revalidatePath(`/o/${slug}/schedule`);
  revalidatePath(`/o/${slug}/admin/schedule`);
}

export async function importScheduleFromJson(
  slug: string,
  rawText: string,
  targetGroupId?: string,
): Promise<{ error?: string; ok?: boolean; count?: number }> {
  const gate = await ensureStaff(slug);
  if (gate.error || !gate.org) return { error: gate.error ?? "Ошибка" };

  const parsed = parseScheduleJson(rawText);
  if ("error" in parsed) return { error: parsed.error };

  const { data } = parsed;
  if (data.organizationSlug !== slug) {
    return {
      error: `organizationSlug в файле (${data.organizationSlug}) не совпадает с ${slug}.`,
    };
  }

  let group;
  if (targetGroupId) {
    group = await prisma.studyGroup.findFirst({
      where: { id: targetGroupId, organizationId: gate.org.id },
    });
    if (!group) return { error: "Учебная группа не найдена." };
  } else {
    group = await resolveGroupByName(
      gate.org.id,
      data.studyGroup,
      data.studyGroupExternalKey,
    );
  }

  const lessons = scheduleJsonToLessons(data);
  await replaceScheduleForGroup(gate.org.id, group.id, lessons);
  revalidateSchedule(slug);
  return { ok: true, count: lessons.length };
}

export async function importScheduleJsonFile(
  slug: string,
  _prev: { error?: string; ok?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string; ok?: string }> {
  const gate = await ensureStaff(slug);
  if (gate.error) return { error: gate.error };

  const file = formData.get("file");
  const groupId = String(formData.get("groupId") ?? "").trim() || undefined;
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Выберите JSON-файл." };
  }

  const text = await file.text();
  const result = await importScheduleFromJson(slug, text, groupId);
  if (result.error) return { error: result.error };
  return { ok: `Импортировано занятий: ${result.count} (группа из файла или выбранная).` };
}

export async function importScheduleForGroup(
  slug: string,
  groupId: string,
  rawText: string,
): Promise<{ error?: string; ok?: boolean; count?: number }> {
  return importScheduleFromJson(slug, rawText, groupId);
}

export async function syncScheduleFromSstu(slug: string, groupId?: string) {
  const gate = await ensureStaff(slug);
  if (gate.error || !gate.org) {
    return { error: gate.error ?? "Ошибка" };
  }
  const { org } = gate;
  if (!org.sstuGroupId) {
    return { error: "В настройках вуза не указан ID группы СГТУ." };
  }

  const group = groupId
    ? await prisma.studyGroup.findFirst({ where: { id: groupId, organizationId: org.id } })
    : await resolveImportGroup(org);
  if (!group) {
    return { error: "Создайте хотя бы одну учебную группу в этом вузе." };
  }

  let parsed;
  try {
    parsed = await fetchSstuSchedule(org.sstuGroupId);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Ошибка парсера";
    return { error: msg };
  }

  const lessons = parsed.lessons;
  if (!lessons.length) {
    return {
      error:
        "Парсер не вернул занятий. Используйте импорт JSON/legacy-текста или проверьте сайт СГТУ.",
    };
  }

  await replaceScheduleForGroup(org.id, group.id, lessons);
  revalidateSchedule(slug);
  return { ok: true, count: lessons.length };
}

export async function importScheduleFromLegacyText(slug: string, rawText: string) {
  const gate = await ensureStaff(slug);
  if (gate.error || !gate.org) {
    return { error: gate.error ?? "Ошибка" };
  }
  const { org } = gate;
  const group = await resolveImportGroup(org);
  if (!group) {
    return { error: "Сначала укажите ID группы СГТУ в настройках и создайте учебную группу." };
  }

  let parsed;
  try {
    parsed = await postSstuLegacyTxt(rawText);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Ошибка парсера";
    return { error: msg };
  }

  const lessons = parsed.lessons;
  if (!lessons.length) {
    return { error: "В тексте не найдено занятий. Проверьте формат (строки DD.MM=…)." };
  }

  await replaceScheduleForGroup(org.id, group.id, lessons);
  revalidateSchedule(slug);
  return { ok: true, count: lessons.length };
}
