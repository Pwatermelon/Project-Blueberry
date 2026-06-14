"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { signIn } from "@/auth";

export async function registerUser(
  _prev: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const email = String(formData.get("email") ?? "")
    .toLowerCase()
    .trim();
  const password = String(formData.get("password") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const orgSlug = String(formData.get("orgSlug") ?? "").trim();

  if (!email || !password || password.length < 8) {
    return { error: "Укажите email и пароль не короче 8 символов." };
  }
  if (!orgSlug) {
    return { error: "Не выбран вуз." };
  }

  const org = await prisma.organization.findUnique({ where: { slug: orgSlug } });
  if (!org) {
    return { error: "Вуз не найден." };
  }

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    return { error: "Пользователь с таким email уже есть." };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      email,
      name: name || null,
      passwordHash,
      memberships: {
        create: {
          organizationId: org.id,
          role: "STUDENT",
        },
      },
    },
  });

  const signResult = await signIn("credentials", {
    email: user.email,
    password,
    redirect: false,
  });

  if (signResult && typeof signResult === "object" && "error" in signResult && signResult.error) {
    return { error: "Регистрация прошла, но автоматический вход не удался — войдите вручную." };
  }

  redirect(`/o/${orgSlug}/dashboard`);
}
