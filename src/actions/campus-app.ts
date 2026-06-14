"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireMember(slug: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Нужна авторизация", session: null, org: null, member: null };
  const org = await prisma.organization.findUnique({ where: { slug } });
  if (!org) return { error: "Вуз не найден", session: null, org: null, member: null };
  const member = await prisma.membership.findUnique({
    where: { userId_organizationId: { userId: session.user.id, organizationId: org.id } },
  });
  if (!member) return { error: "Нет доступа к этому вузу", session: null, org: null, member: null };
  return { error: null, session, org, member };
}

export async function createHomework(slug: string, formData: FormData): Promise<void> {
  const gate = await requireMember(slug);
  if (gate.error || !gate.org || !gate.member) return;
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const due = String(formData.get("dueAt") ?? "").trim();
  if (!title || !body) return;

  const dueAt = due ? new Date(due) : null;
  if (due && dueAt && Number.isNaN(dueAt.getTime())) return;

  await prisma.homework.create({
    data: {
      organizationId: gate.org.id,
      studyGroupId: gate.member.studyGroupId,
      authorId: gate.session!.user!.id,
      title,
      body,
      dueAt,
    },
  });

  revalidatePath(`/o/${slug}/homework`);
}

export async function postChatMessage(slug: string, formData: FormData): Promise<void> {
  const gate = await requireMember(slug);
  if (gate.error || !gate.org) return;
  const roomId = String(formData.get("roomId") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!roomId || !body) return;

  const room = await prisma.chatRoom.findFirst({
    where: { id: roomId, organizationId: gate.org.id },
  });
  if (!room) return;

  await prisma.message.create({
    data: {
      roomId,
      userId: gate.session!.user!.id,
      body,
    },
  });

  revalidatePath(`/o/${slug}/chats`);
}
