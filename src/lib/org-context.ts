import { prisma } from "@/lib/prisma";
import { mergePortalConfig, type PortalConfig } from "@/lib/portal-config";
import type { Organization } from "@prisma/client";

export type OrgContext = {
  organization: Organization;
  portalConfig: PortalConfig;
};

export async function getOrgBySlug(slug: string): Promise<OrgContext | null> {
  const organization = await prisma.organization.findUnique({ where: { slug } });
  if (!organization) return null;
  return {
    organization,
    portalConfig: mergePortalConfig(organization.portalConfig),
  };
}
