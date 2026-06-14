"use server";

import { revalidatePath } from "next/cache";
import { requireOrgAdmin } from "@/lib/org-permissions";
import { prisma } from "@/lib/prisma";

function revalidateBuildings(slug: string) {
  revalidatePath(`/o/${slug}/admin/buildings`);
  revalidatePath(`/o/${slug}/map`);
}

export async function upsertBuilding(
  slug: string,
  _prev: { error?: string; ok?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string; ok?: string }> {
  const ctx = await requireOrgAdmin(slug);
  if (!ctx) return { error: "Нет доступа." };

  const id = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const lat = parseFloat(String(formData.get("lat") ?? "0"));
  const lng = parseFloat(String(formData.get("lng") ?? "0"));
  const floorsJson = String(formData.get("floorsJson") ?? "[]").trim();

  if (!name) return { error: "Название корпуса обязательно." };
  if (Number.isNaN(lat) || Number.isNaN(lng)) return { error: "Некорректные координаты." };

  let floors: object[] = [];
  try {
    const parsed = JSON.parse(floorsJson) as unknown;
    if (Array.isArray(parsed)) floors = parsed as object[];
  } catch {
    return { error: "floorsJson должен быть JSON-массивом." };
  }

  const data = {
    name,
    address: address || null,
    description: description || null,
    lat,
    lng,
    floors,
  };

  if (id) {
    const existing = await prisma.campusBuilding.findFirst({
      where: { id, organizationId: ctx.org.id },
    });
    if (!existing) return { error: "Корпус не найден." };
    await prisma.campusBuilding.update({ where: { id }, data });
  } else {
    await prisma.campusBuilding.create({
      data: { ...data, organizationId: ctx.org.id },
    });
  }

  revalidateBuildings(slug);
  return { ok: "Корпус сохранён." };
}

export async function upsertBuildingForm(slug: string, formData: FormData): Promise<void> {
  await upsertBuilding(slug, undefined, formData);
}

export async function deleteBuilding(slug: string, formData: FormData): Promise<void> {
  const ctx = await requireOrgAdmin(slug);
  if (!ctx) return;

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const building = await prisma.campusBuilding.findFirst({
    where: { id, organizationId: ctx.org.id },
  });
  if (!building) return;

  await prisma.campusBuilding.delete({ where: { id } });
  revalidateBuildings(slug);
}
