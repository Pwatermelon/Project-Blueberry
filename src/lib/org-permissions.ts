import type { Membership, Organization, Role } from "@prisma/client";
import { auth } from "@/auth";
import { isRootAdminEmail } from "@/lib/root-admin";
import { prisma } from "@/lib/prisma";

export type OrgAdminContext = {
  org: Organization;
  userId: string;
  userEmail: string;
  member: Membership;
  isRoot: boolean;
};

export async function getOrgAdminContext(slug: string): Promise<OrgAdminContext | null> {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) return null;

  const org = await prisma.organization.findUnique({ where: { slug } });
  if (!org) return null;

  const member = await prisma.membership.findUnique({
    where: {
      userId_organizationId: { userId: session.user.id, organizationId: org.id },
    },
  });

  const isRoot = isRootAdminEmail(session.user.email, slug);
  if (!member) return null;
  if (member.role !== "ADMIN" && !isRoot) return null;

  return {
    org,
    userId: session.user.id,
    userEmail: session.user.email,
    member,
    isRoot,
  };
}

export async function requireOrgAdmin(slug: string): Promise<OrgAdminContext | null> {
  return getOrgAdminContext(slug);
}

export function assertCanChangeRole(
  ctx: OrgAdminContext,
  targetEmail: string,
  newRole: Role,
): string | null {
  if (isRootAdminEmail(targetEmail, ctx.org.slug) && newRole !== "ADMIN") {
    return "Root-администратор из env не может быть понижен.";
  }
  if (newRole === "ADMIN" && !ctx.isRoot) {
    return "Назначать администраторов может только root (ROOT_ADMIN_EMAIL).";
  }
  return null;
}
