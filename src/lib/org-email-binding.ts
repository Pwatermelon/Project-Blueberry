import type { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ensureRootAdminMembership } from "@/lib/root-admin";

export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

/** Создаёт membership по всем непривязанным записям с этой почтой. */
export async function applyEmailBindingsForUser(userId: string, rawEmail: string): Promise<number> {
  const email = normalizeEmail(rawEmail);
  const bindings = await prisma.organizationEmailBinding.findMany({
    where: { email, boundUserId: null },
  });

  let linked = 0;
  for (const binding of bindings) {
    await prisma.$transaction(async (tx) => {
      await tx.membership.upsert({
        where: {
          userId_organizationId: {
            userId,
            organizationId: binding.organizationId,
          },
        },
        update: {
          role: binding.role,
          studyGroupId: binding.studyGroupId,
        },
        create: {
          userId,
          organizationId: binding.organizationId,
          role: binding.role,
          studyGroupId: binding.studyGroupId,
        },
      });

      await tx.organizationEmailBinding.update({
        where: { id: binding.id },
        data: { boundUserId: userId, boundAt: new Date() },
      });
    });
    linked += 1;
  }

  return linked;
}

export async function upsertYandexUser(input: {
  yandexId: string;
  email: string;
  name?: string | null;
  avatarUrl?: string | null;
}) {
  const email = normalizeEmail(input.email);
  const yandexId = input.yandexId;

  let user = await prisma.user.findFirst({
    where: { OR: [{ yandexId }, { email }] },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        yandexId,
        name: input.name ?? null,
        avatarUrl: input.avatarUrl ?? null,
      },
    });
  } else {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        yandexId: user.yandexId ?? yandexId,
        email,
        name: input.name ?? user.name,
        avatarUrl: input.avatarUrl ?? user.avatarUrl,
      },
    });
  }

  await applyEmailBindingsForUser(user.id, email);
  await ensureRootAdminMembership(user.id, email);
  return user;
}

export async function resolveStudyGroupId(
  organizationId: string,
  groupName?: string | null,
): Promise<string | null> {
  const name = groupName?.trim();
  if (!name) return null;

  const group = await prisma.studyGroup.findUnique({
    where: { organizationId_name: { organizationId, name } },
  });
  return group?.id ?? null;
}

export const BINDING_ROLES: Role[] = ["STUDENT", "TEACHER", "STAFF", "ADMIN"];

export function parseBindingRole(raw: string): Role | null {
  const role = raw.trim().toUpperCase() as Role;
  return BINDING_ROLES.includes(role) ? role : null;
}
