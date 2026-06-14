"use server";

import fs from "node:fs";
import { revalidatePath } from "next/cache";
import { requireOrgAdmin } from "@/lib/org-permissions";
import { resolveTenantDataPath } from "@/lib/tenant-pack";
import { prisma } from "@/lib/prisma";

function revalidateGroups(slug: string) {
  revalidatePath(`/o/${slug}/admin/groups`);
  revalidatePath(`/o/${slug}/schedule`);
}

export async function addStudyGroup(
  slug: string,
  _prev: { error?: string; ok?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string; ok?: string }> {
  const ctx = await requireOrgAdmin(slug);
  if (!ctx) return { error: "Нет доступа." };

  const name = String(formData.get("name") ?? "").trim();
  const externalKey = String(formData.get("externalKey") ?? "").trim();

  if (!name) return { error: "Укажите название группы." };

  await prisma.studyGroup.upsert({
    where: { organizationId_name: { organizationId: ctx.org.id, name } },
    update: { externalKey: externalKey || null },
    create: {
      organizationId: ctx.org.id,
      name,
      externalKey: externalKey || null,
    },
  });

  revalidateGroups(slug);
  return { ok: `Группа «${name}» сохранена.` };
}

export async function deleteStudyGroup(slug: string, formData: FormData): Promise<void> {
  const ctx = await requireOrgAdmin(slug);
  if (!ctx) return;

  const groupId = String(formData.get("groupId") ?? "");
  if (!groupId) return;

  const group = await prisma.studyGroup.findFirst({
    where: { id: groupId, organizationId: ctx.org.id },
  });
  if (!group) return;

  await prisma.studyGroup.delete({ where: { id: group.id } });
  revalidateGroups(slug);
}

export async function importStudyGroupsFromPack(
  slug: string,
): Promise<{ error?: string; ok?: string }> {
  const ctx = await requireOrgAdmin(slug);
  if (!ctx) return { error: "Нет доступа." };

  const csvPath = resolveTenantDataPath(slug, "data/links.csv");
  if (!fs.existsSync(csvPath)) {
    return { error: `Файл не найден: tenants/${slug}/data/links.csv` };
  }

  const lines = fs.readFileSync(csvPath, "utf-8").split(/\r?\n/).filter(Boolean);
  let imported = 0;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]!;
    const comma = line.indexOf(",");
    if (comma < 0) continue;
    const url = line.slice(0, comma).trim();
    const name = line.slice(comma + 1).trim();
    const m = url.match(/\/group\/(\d+)/);
    const externalKey = m?.[1];
    if (!name || !externalKey) continue;

    await prisma.studyGroup.upsert({
      where: { organizationId_name: { organizationId: ctx.org.id, name } },
      update: { externalKey },
      create: { organizationId: ctx.org.id, name, externalKey },
    });
    imported++;
  }

  revalidateGroups(slug);
  return { ok: `Импортировано групп: ${imported}.` };
}

export async function importStudyGroupsFromPackForm(slug: string): Promise<void> {
  await importStudyGroupsFromPack(slug);
}
