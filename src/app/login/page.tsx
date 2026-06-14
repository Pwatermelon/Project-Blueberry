import { LoginForm } from "@/components/login-form";
import { isYandexAuthConfigured } from "@/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string }>;
}) {
  const sp = await searchParams;
  const redirectTo = sp.redirectTo ?? "/";
  const yandexEnabled = isYandexAuthConfigured();
  const devLoginEnabled =
    process.env.ALLOW_DEV_LOGIN === "true" || process.env.NODE_ENV === "development";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-4 [--org-primary:#6366f1] [--org-accent:#a855f7]">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-900/50 p-8 shadow-2xl">
        <h1 className="text-2xl font-semibold text-white">Вход</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Вход через Яндекс ID. Root и администраторы вуза добавляют участников после регистрации.
        </p>
        <div className="mt-8">
          <LoginForm
            redirectTo={redirectTo}
            yandexEnabled={yandexEnabled}
            devLoginEnabled={devLoginEnabled}
          />
        </div>
      </div>
    </div>
  );
}
