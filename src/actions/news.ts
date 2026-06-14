"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function createNewsPost(slug: string, formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;

  const org = await prisma.organization.findUnique({ where: { slug } });
  if (!org) return;

  const member = await prisma.membership.findUnique({
    where: { userId_organizationId: { userId: session.user.id, organizationId: org.id } },
  });
  if (!member || member.role !== "ADMIN") return;

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!title || !body) return;

  await prisma.newsPost.create({
    data: { organizationId: org.id, title, body },
  });

  revalidatePath(`/o/${slug}/news`);
}
