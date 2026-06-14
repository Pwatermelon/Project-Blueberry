"use server";

import type { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import {
  normalizeEmail,
  parseBindingRole,
  resolveStudyGroupId,
} from "@/lib/org-email-binding";
import {
  assertCanChangeRole,
  requireOrgAdmin,
} from "@/lib/org-permissions";
import { isProtectedRootMember } from "@/lib/root-admin";
import { prisma } from "@/lib/prisma";
import { syncUserProfileToHub } from "@/lib/hub-sync";

function revalidateMembers(slug: string) {
  revalidatePath(`/o/${slug}/admin/members`);
}

export async function assignRegisteredUser(
  slug: string,
  _prev: { error?: string; ok?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string; ok?: string }> {
  const ctx = await requireOrgAdmin(slug);
  if (!ctx) return { error: "Нет доступа." };

  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const role = parseBindingRole(String(formData.get("role") ?? "STUDENT"));
  const groupName = String(formData.get("groupName") ?? "").trim();

  if (!email.includes("@")) return { error: "Укажите корректную почту." };
  if (!role) return { error: "Некорректная роль." };

  const roleError = assertCanChangeRole(ctx, email, role);
  if (roleError) return { error: roleError };

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return {
      error:
        "Пользователь не найден. Сначала он должен войти на платформу через Яндекс ID (хотя бы один раз).",
    };
  }
  if (!user.yandexId) {
    return {
      error:
        "Аккаунт без Яндекс ID. Пользователь должен войти через «Войти через Яндекс ID», а не демо-пароль.",
    };
  }

  const studyGroupId = await resolveStudyGroupId(ctx.org.id, groupName);

  await prisma.membership.upsert({
    where: {
      userId_organizationId: { userId: user.id, organizationId: ctx.org.id },
    },
    update: { role, studyGroupId },
    create: {
      userId: user.id,
      organizationId: ctx.org.id,
      role,
      studyGroupId,
    },
  });

  if (process.env.HUB_BASE_URL) {
    await syncUserProfileToHub(user.id);
  }

  revalidateMembers(slug);
  return { ok: `${user.name || email} добавлен в вуз.` };
}

export async function updateMemberRole(
  slug: string,
  formData: FormData,
): Promise<{ error?: string; ok?: string }> {
  const ctx = await requireOrgAdmin(slug);
  if (!ctx) return { error: "Нет доступа." };

  const membershipId = String(formData.get("membershipId") ?? "");
  const role = parseBindingRole(String(formData.get("role") ?? ""));
  const groupName = String(formData.get("groupName") ?? "").trim();

  if (!membershipId || !role) return { error: "Некорректные данные." };

  const membership = await prisma.membership.findFirst({
    where: { id: membershipId, organizationId: ctx.org.id },
    include: { user: { select: { email: true } } },
  });
  if (!membership) return { error: "Участник не найден." };

  const roleError = assertCanChangeRole(ctx, membership.user.email, role);
  if (roleError) return { error: roleError };

  if (membership.role === "ADMIN" && role !== "ADMIN" && !ctx.isRoot) {
    return { error: "Снимать права администратора может только root." };
  }

  const studyGroupId = await resolveStudyGroupId(ctx.org.id, groupName);

  await prisma.membership.update({
    where: { id: membership.id },
    data: { role, studyGroupId: groupName ? studyGroupId : membership.studyGroupId },
  });

  revalidateMembers(slug);
  return { ok: "Роль обновлена." };
}

export async function removeOrgMember(slug: string, formData: FormData): Promise<void> {
  const ctx = await requireOrgAdmin(slug);
  if (!ctx) return;

  const membershipId = String(formData.get("membershipId") ?? "");
  if (!membershipId) return;

  const membership = await prisma.membership.findFirst({
    where: { id: membershipId, organizationId: ctx.org.id },
    include: { user: { select: { email: true, id: true } } },
  });
  if (!membership) return;

  if (isProtectedRootMember(membership.user.email)) return;
  if (membership.user.id === ctx.userId) return;

  if (membership.role === "ADMIN" && !ctx.isRoot) return;

  await prisma.membership.delete({ where: { id: membership.id } });
  revalidateMembers(slug);
}

export async function promoteToAdmin(slug: string, formData: FormData): Promise<{ error?: string; ok?: string }> {
  const ctx = await requireOrgAdmin(slug);
  if (!ctx?.isRoot) return { error: "Только root может назначать администраторов." };

  const membershipId = String(formData.get("membershipId") ?? "");
  const membership = await prisma.membership.findFirst({
    where: { id: membershipId, organizationId: ctx.org.id },
  });
  if (!membership) return { error: "Участник не найден." };

  await prisma.membership.update({
    where: { id: membership.id },
    data: { role: "ADMIN" },
  });

  revalidateMembers(slug);
  return { ok: "Администратор назначен." };
}

export async function promoteToAdminForm(slug: string, formData: FormData): Promise<void> {
  await promoteToAdmin(slug, formData);
}

export const ROLE_LABELS: Record<Role, string> = {
  STUDENT: "Студент",
  TEACHER: "Преподаватель",
  STAFF: "Сотрудник",
  ADMIN: "Администратор",
};
