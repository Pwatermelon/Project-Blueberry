"use server";

import { redirect } from "next/navigation";
import { signIn } from "@/auth";

export type LoginState = { error?: string };

export async function loginUser(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "")
    .toLowerCase()
    .trim();
  const password = String(formData.get("password") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "/");

  if (!email || !password) {
    return { error: "Заполните email и пароль." };
  }

  const result = await signIn("credentials", {
    email,
    password,
    redirect: false,
  });

  if (result && typeof result === "object" && "error" in result && result.error) {
    return { error: "Неверный email или пароль." };
  }

  redirect(redirectTo);
}
