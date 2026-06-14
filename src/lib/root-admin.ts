import type { Role } from "@prisma/client";
import { getTenantSlug } from "@/lib/deployment";
import { normalizeEmail } from "@/lib/org-email-binding";
import { prisma } from "@/lib/prisma";

export function getRootAdminEmail(): string | undefined {
  const raw = process.env.ROOT_ADMIN_EMAIL?.trim();
  return raw ? normalizeEmail(raw) : undefined;
}

export function isRootAdminEmail(email: string, orgSlug?: string): boolean {
  const root = getRootAdminEmail();
  if (!root || normalizeEmail(email) !== root) return false;

  const tenantSlug = getTenantSlug();
  if (tenantSlug && orgSlug && tenantSlug !== orgSlug) return false;

  return true;
}

/** При первом входе root получает ADMIN в своём tenant-инстансе. */
export async function ensureRootAdminMembership(userId: string, email: string): Promise<void> {
  if (!isRootAdminEmail(email)) return;

  const tenantSlug = getTenantSlug();
  if (!tenantSlug) return;

  const org = await prisma.organization.findUnique({ where: { slug: tenantSlug } });
  if (!org) return;

  await prisma.membership.upsert({
    where: {
      userId_organizationId: { userId, organizationId: org.id },
    },
    update: { role: "ADMIN" },
    create: {
      userId,
      organizationId: org.id,
      role: "ADMIN",
    },
  });
}

export function canAssignRole(actorIsRoot: boolean, role: Role): boolean {
  if (role === "ADMIN") return actorIsRoot;
  return true;
}

export function isProtectedRootMember(email: string): boolean {
  return Boolean(getRootAdminEmail() && normalizeEmail(email) === getRootAdminEmail());
}
