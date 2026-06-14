"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { PortalConfig } from "@/lib/portal-config";

export async function updateOrganizationSettings(slug: string, formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;

  const org = await prisma.organization.findUnique({ where: { slug } });
  if (!org) return;

  const member = await prisma.membership.findUnique({
    where: {
      userId_organizationId: { userId: session.user.id, organizationId: org.id },
    },
  });
  if (!member || member.role !== "ADMIN") return;

  const name = String(formData.get("name") ?? "").trim();
  const shortName = String(formData.get("shortName") ?? "").trim();
  const primaryColor = String(formData.get("primaryColor") ?? "").trim();
  const accentColor = String(formData.get("accentColor") ?? "").trim();
  const logoUrl = String(formData.get("logoUrl") ?? "").trim();
  const sstuGroupIdRaw = String(formData.get("sstuGroupId") ?? "").trim();
  const welcomeBanner = String(formData.get("welcomeBanner") ?? "").trim();
  const scheduleHelpUrl = String(formData.get("scheduleHelpUrl") ?? "").trim();
  const portalConfigJson = String(formData.get("portalConfigJson") ?? "").trim();

  const sstuGroupId = sstuGroupIdRaw === "" ? null : parseInt(sstuGroupIdRaw, 10);
  if (sstuGroupId !== null && Number.isNaN(sstuGroupId)) return;

  let portalConfig: PortalConfig = {
    ...(typeof org.portalConfig === "object" && org.portalConfig !== null
      ? (org.portalConfig as object)
      : {}),
  };

  if (portalConfigJson) {
    try {
      const parsed = JSON.parse(portalConfigJson) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        portalConfig = { ...portalConfig, ...(parsed as PortalConfig) };
      }
    } catch {
      /* ignore invalid JSON */
    }
  }

  portalConfig = {
    ...portalConfig,
    welcomeBanner: welcomeBanner || undefined,
    scheduleHelpUrl: scheduleHelpUrl || undefined,
  };

  await prisma.organization.update({
    where: { id: org.id },
    data: {
      name: name || org.name,
      shortName: shortName || null,
      primaryColor: primaryColor || org.primaryColor,
      accentColor: accentColor || org.accentColor,
      logoUrl: logoUrl || null,
      sstuGroupId,
      portalConfig: portalConfig as object,
    },
  });

  revalidatePath(`/o/${slug}`);
  revalidatePath(`/o/${slug}/admin/settings`);
}
