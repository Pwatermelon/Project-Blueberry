import Link from "next/link";
import { auth } from "@/auth";
import { YandexLoginButton } from "@/components/yandex-login-button";
import { isYandexAuthConfigured } from "@/auth";
import { prisma } from "@/lib/prisma";

export default async function AccessPendingPage({
  searchParams,
}: {
  searchParams: Promise<{ org?: string }>;
}) {
  const sp = await searchParams;
  const orgSlug = sp.org ?? "sstu";
  const session = await auth();
  const org = await prisma.organization.findUnique({
    where: { slug: orgSlug },
    select: { name: true, shortName: true },
  });

  const orgLabel = org?.shortName || org?.name || orgSlug;
  const redirectTo = `/o/${orgSlug}/dashboard`;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-zinc-900/50 p-8 shadow-2xl">
        <h1 className="text-2xl font-semibold text-white">Нет доступа к {orgLabel}</h1>
        <p className="mt-3 text-sm leading-relaxed text-zinc-400">
          Вы вошли как{" "}
          <span className="text-white">{session?.user?.email ?? "пользователь"}</span>. Администратор
          вуза ещё не добавил вас в список участников — обратитесь к root или в деканат.
        </p>
        <p className="mt-3 text-sm text-zinc-500">
          Сначала нужен вход через Яндекс ID, затем админ добавляет вашу почту в разделе «Участники».
        </p>
        <div className="mt-8 flex flex-col gap-3">
          {isYandexAuthConfigured() ? (
            <YandexLoginButton redirectTo={redirectTo} label="Повторить вход" />
          ) : null}
          <Link href="/" className="text-center text-sm text-indigo-400 hover:underline">
            На главную
          </Link>
        </div>
      </div>
    </div>
  );
}
