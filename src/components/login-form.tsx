"use client";

import { useFormStatus } from "react-dom";
import { useFormState } from "react-dom";
import { loginUser, type LoginState } from "@/actions/login";
import { YandexLoginButton } from "@/components/yandex-login-button";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-medium text-white transition hover:bg-white/10 disabled:opacity-60"
    >
      {pending ? "Вход…" : "Войти (демо)"}
    </button>
  );
}

export function LoginForm({
  redirectTo,
  yandexEnabled,
  devLoginEnabled,
}: {
  redirectTo: string;
  yandexEnabled: boolean;
  devLoginEnabled: boolean;
}) {
  const [state, formAction] = useFormState(loginUser, {} as LoginState);

  return (
    <div className="flex flex-col gap-6">
      {yandexEnabled ? (
        <div className="space-y-3">
          <YandexLoginButton redirectTo={redirectTo} />
          <p className="text-center text-xs text-zinc-500">
            Вход по аккаунту Яндекса. Доступ к вузу выдаёт администратор по вашей почте.
          </p>
        </div>
      ) : (
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          Яндекс ID не настроен. Добавьте <code className="text-amber-100">YANDEX_CLIENT_ID</code> и{" "}
          <code className="text-amber-100">YANDEX_CLIENT_SECRET</code> в окружение.
        </p>
      )}

      {devLoginEnabled ? (
        <>
          {yandexEnabled ? (
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-zinc-900/50 px-2 text-zinc-500">локальная разработка</span>
              </div>
            </div>
          ) : null}
          <form action={formAction} className="flex flex-col gap-4">
            <input type="hidden" name="redirectTo" value={redirectTo} />
            <div>
              <label className="mb-1 block text-sm text-zinc-400">Email</label>
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none ring-0 focus:border-[var(--org-accent)]"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-zinc-400">Пароль</label>
              <input
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-[var(--org-accent)]"
              />
            </div>
            {state?.error ? <p className="text-sm text-red-400">{state.error}</p> : null}
            <SubmitButton />
          </form>
        </>
      ) : null}
    </div>
  );
}
