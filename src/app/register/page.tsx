import Link from "next/link";
import { redirect } from "next/navigation";
import { isYandexAuthConfigured } from "@/auth";
import { YandexLoginButton } from "@/components/yandex-login-button";
import { getTenantSlug } from "@/lib/deployment";
import { prisma } from "@/lib/prisma";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ s?: string }>;
}) {
  if (isYandexAuthConfigured()) {
    redirect("/login");
  }

  const sp = await searchParams;
  const tenantSlug = getTenantSlug();
  const orgSlug = tenantSlug ?? sp.s ?? "sstu";

  const org = await prisma.organization.findUnique({
    where: { slug: orgSlug },
    select: { name: true, shortName: true },
  });

  const redirectTo = `/o/${orgSlug}/dashboard`;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-900/50 p-8 shadow-2xl">
        <h1 className="text-2xl font-semibold text-white">Регистрация</h1>
        <p className="mt-3 text-sm text-zinc-400">
          В продакшене регистрация только через Яндекс ID. Администратор{" "}
          {org?.shortName || org?.name || "вуза"} заранее добавляет вашу почту — после входа доступ
          открывается автоматически.
        </p>
        <div className="mt-8 space-y-4">
          {isYandexAuthConfigured() ? (
            <YandexLoginButton redirectTo={redirectTo} />
          ) : (
            <p className="text-sm text-zinc-500">
              Для локальной разработки используйте{" "}
              <Link href={`/login?redirectTo=${encodeURIComponent(redirectTo)}`} className="text-indigo-400 hover:underline">
                вход с демо-аккаунтом
              </Link>
              .
            </p>
          )}
          <p className="text-center text-sm text-zinc-500">
            <Link href="/login" className="text-indigo-400 hover:underline">
              Уже есть аккаунт
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
