"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { isHubRootAdminEmail } from "@/lib/hub-root";
import { normalizeEmail } from "@/lib/org-email-binding";
import { prisma } from "@/lib/prisma";

async function requireHubRoot() {
  const session = await auth();
  if (!session?.user?.email) return null;
  if (!isHubRootAdminEmail(session.user.email)) return null;
  return session;
}

function revalidateHub() {
  revalidatePath("/");
  revalidatePath("/hub/admin/tenants");
}

export async function upsertRegisteredTenant(
  _prev: { error?: string; ok?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string; ok?: string }> {
  const gate = await requireHubRoot();
  if (!gate) return { error: "Только root hub может управлять реестром вузов." };

  const id = String(formData.get("id") ?? "").trim();
  const slug = String(formData.get("slug") ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-");
  const name = String(formData.get("name") ?? "").trim();
  const shortName = String(formData.get("shortName") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const siteUrl = String(formData.get("siteUrl") ?? "").trim();
  const logoUrl = String(formData.get("logoUrl") ?? "").trim();
  const primaryColor = String(formData.get("primaryColor") ?? "#4f46e5").trim();
  const accentColor = String(formData.get("accentColor") ?? "#a855f7").trim();
  const isPublished = formData.get("isPublished") === "on";
  const sortOrder = parseInt(String(formData.get("sortOrder") ?? "0"), 10);

  if (!slug || !name || !siteUrl) {
    return { error: "Slug, название и домен реплики обязательны." };
  }
  if (!siteUrl.startsWith("http://") && !siteUrl.startsWith("https://")) {
    return { error: "Домен должен начинаться с http:// или https://" };
  }

  const data = {
    slug,
    name,
    shortName: shortName || null,
    description: description || null,
    siteUrl: siteUrl.replace(/\/$/, ""),
    logoUrl: logoUrl || null,
    primaryColor,
    accentColor,
    isPublished,
    sortOrder: Number.isNaN(sortOrder) ? 0 : sortOrder,
  };

  if (id) {
    await prisma.registeredTenant.update({ where: { id }, data });
  } else {
    const exists = await prisma.registeredTenant.findUnique({ where: { slug } });
    if (exists) return { error: "Вуз с таким slug уже в реестре." };
    await prisma.registeredTenant.create({ data });
  }

  revalidateHub();
  return { ok: id ? "Запись обновлена." : "Вуз добавлен в реестр." };
}

export async function deleteRegisteredTenant(formData: FormData): Promise<void> {
  const gate = await requireHubRoot();
  if (!gate) return;

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await prisma.registeredTenant.delete({ where: { id } });
  revalidateHub();
}

export async function seedRegisteredTenantFromOrg(input: {
  slug: string;
  name: string;
  shortName?: string | null;
  siteUrl: string;
  logoUrl?: string | null;
  primaryColor?: string;
  accentColor?: string;
}) {
  return prisma.registeredTenant.upsert({
    where: { slug: input.slug },
    update: {
      name: input.name,
      shortName: input.shortName,
      siteUrl: input.siteUrl,
      logoUrl: input.logoUrl,
      primaryColor: input.primaryColor,
      accentColor: input.accentColor,
    },
    create: {
      slug: input.slug,
      name: input.name,
      shortName: input.shortName,
      siteUrl: input.siteUrl,
      logoUrl: input.logoUrl,
      primaryColor: input.primaryColor ?? "#4f46e5",
      accentColor: input.accentColor ?? "#a855f7",
      description: "Реплика развёрнута на сервере вуза. Данные управляются локально.",
      isPublished: true,
    },
  });
}

export { normalizeEmail };
