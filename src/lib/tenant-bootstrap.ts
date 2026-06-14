import type { Organization, ScheduleSource } from "@prisma/client";
import { getTenantSlug } from "@/lib/deployment";
import {
  loadTenantBuildings,
  loadTenantPack,
  tenantPackToPortalConfig,
} from "@/lib/tenant-pack";
import { prisma } from "@/lib/prisma";

function scheduleSourceFromAdapter(adapter?: string): ScheduleSource {
  if (adapter === "sstu-rasp") return "SSTU_RASP";
  if (adapter === "legacy-txt") return "LEGACY_TXT";
  return "JSON_IMPORT";
}

export async function ensureTenantOrganization(slug: string): Promise<Organization> {
  const pack = loadTenantPack(slug);
  const portalConfig = pack ? tenantPackToPortalConfig(pack) : {};

  return prisma.organization.upsert({
    where: { slug },
    update: {
      tenantPackSlug: slug,
      hubBaseUrl: process.env.HUB_BASE_URL ?? undefined,
    },
    create: {
      slug,
      name: pack?.name ?? slug,
      shortName: pack?.shortName ?? slug,
      primaryColor: pack?.branding?.primaryColor ?? "#4f46e5",
      accentColor: pack?.branding?.accentColor ?? "#a855f7",
      scheduleSource: scheduleSourceFromAdapter(pack?.schedule?.adapter),
      tenantPackSlug: slug,
      hubBaseUrl: process.env.HUB_BASE_URL ?? null,
      portalConfig,
    },
  });
}

export async function bootstrapTenantFromEnv(): Promise<Organization | null> {
  const slug = getTenantSlug();
  if (!slug) return null;
  return ensureTenantOrganization(slug);
}

export async function seedTenantBuildings(orgId: string, slug: string): Promise<void> {
  const count = await prisma.campusBuilding.count({ where: { organizationId: orgId } });
  if (count > 0) return;

  const fromPack = loadTenantBuildings(slug);
  for (const b of fromPack) {
    await prisma.campusBuilding.create({
      data: {
        organizationId: orgId,
        name: b.name,
        address: b.address,
        lat: b.lat,
        lng: b.lng,
        description: b.description,
        floors: b.floors ?? [],
      },
    });
  }
}
