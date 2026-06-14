"use server";

import { signIn } from "@/auth";

export async function signInWithYandex(redirectTo: string) {
  await signIn("yandex", { redirectTo });
}
