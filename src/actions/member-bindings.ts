"use server";

import { revalidatePath } from "next/cache";
import {
  normalizeEmail,
  parseBindingRole,
  resolveStudyGroupId,
} from "@/lib/org-email-binding";
import { requireOrgAdmin } from "@/lib/org-permissions";
import { prisma } from "@/lib/prisma";

async function requireOrgAdminLegacy(slug: string) {
  const ctx = await requireOrgAdmin(slug);
  if (!ctx) return null;
  return { org: ctx.org, session: { user: { id: ctx.userId, email: ctx.userEmail } } };
}

export async function addEmailBinding(
  slug: string,
  _prev: { error?: string; ok?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string; ok?: string }> {
  const gate = await requireOrgAdminLegacy(slug);
  if (!gate) return { error: "Нет доступа." };

  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const role = parseBindingRole(String(formData.get("role") ?? "STUDENT"));
  const groupName = String(formData.get("groupName") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();

  if (!email || !email.includes("@")) {
    return { error: "Укажите корректную почту Яндекса." };
  }
  if (!role) {
    return { error: "Некорректная роль." };
  }

  const studyGroupId = await resolveStudyGroupId(gate.org.id, groupName);

  const existingUser = await prisma.user.findUnique({ where: { email } });

  await prisma.organizationEmailBinding.upsert({
    where: {
      organizationId_email: { organizationId: gate.org.id, email },
    },
    update: {
      role,
      studyGroupId,
      note: note || null,
    },
    create: {
      organizationId: gate.org.id,
      email,
      role,
      studyGroupId,
      note: note || null,
      boundUserId: existingUser?.id ?? null,
      boundAt: existingUser ? new Date() : null,
    },
  });

  if (existingUser) {
    await prisma.membership.upsert({
      where: {
        userId_organizationId: {
          userId: existingUser.id,
          organizationId: gate.org.id,
        },
      },
      update: { role, studyGroupId },
      create: {
        userId: existingUser.id,
        organizationId: gate.org.id,
        role,
        studyGroupId,
      },
    });

    await prisma.organizationEmailBinding.update({
      where: {
        organizationId_email: { organizationId: gate.org.id, email },
      },
      data: { boundUserId: existingUser.id, boundAt: new Date() },
    });
  }

  revalidatePath(`/o/${slug}/admin/members`);
  return { ok: existingUser ? "Пользователь уже был в системе — доступ выдан." : "Почта добавлена. Доступ откроется после входа через Яндекс ID." };
}

export async function removeEmailBinding(slug: string, bindingId: string): Promise<void> {
  const gate = await requireOrgAdminLegacy(slug);
  if (!gate) return;

  const binding = await prisma.organizationEmailBinding.findFirst({
    where: { id: bindingId, organizationId: gate.org.id },
  });
  if (!binding) return;

  if (binding.boundUserId) {
    await prisma.membership.deleteMany({
      where: {
        userId: binding.boundUserId,
        organizationId: gate.org.id,
      },
    });
  }

  await prisma.organizationEmailBinding.delete({ where: { id: binding.id } });
  revalidatePath(`/o/${slug}/admin/members`);
}

export async function removeEmailBindingForm(slug: string, formData: FormData): Promise<void> {
  const bindingId = String(formData.get("bindingId") ?? "");
  if (!bindingId) return;
  await removeEmailBinding(slug, bindingId);
}

export async function importEmailBindingsCsv(
  slug: string,
  _prev: { error?: string; ok?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string; ok?: string }> {
  const gate = await requireOrgAdminLegacy(slug);
  if (!gate) return { error: "Нет доступа." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Выберите CSV-файл." };
  }

  const text = await file.text();
  const lines = text.split(/\r?\n/).filter((l) => l.trim() && !l.trim().startsWith("#"));
  if (lines.length === 0) {
    return { error: "Файл пуст." };
  }

  let imported = 0;
  let skipped = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    if (i === 0 && line.toLowerCase().includes("email")) continue;

    const parts = line.split(/[,;\t]/).map((p) => p.trim());
    const email = normalizeEmail(parts[0] ?? "");
    const role = parseBindingRole(parts[1] ?? "STUDENT");
    const groupName = parts[2] ?? "";
    const note = parts[3] ?? "";

    if (!email.includes("@") || !role) {
      skipped += 1;
      continue;
    }

    const studyGroupId = await resolveStudyGroupId(gate.org.id, groupName);
    const existingUser = await prisma.user.findUnique({ where: { email } });

    await prisma.organizationEmailBinding.upsert({
      where: {
        organizationId_email: { organizationId: gate.org.id, email },
      },
      update: { role, studyGroupId, note: note || null },
      create: {
        organizationId: gate.org.id,
        email,
        role,
        studyGroupId,
        note: note || null,
        boundUserId: existingUser?.id ?? null,
        boundAt: existingUser ? new Date() : null,
      },
    });

    if (existingUser) {
      await prisma.membership.upsert({
        where: {
          userId_organizationId: {
            userId: existingUser.id,
            organizationId: gate.org.id,
          },
        },
        update: { role, studyGroupId },
        create: {
          userId: existingUser.id,
          organizationId: gate.org.id,
          role,
          studyGroupId,
        },
      });
    }

    imported += 1;
  }

  revalidatePath(`/o/${slug}/admin/members`);
  return {
    ok: `Импортировано: ${imported}${skipped ? `, пропущено строк: ${skipped}` : ""}.`,
  };
}
