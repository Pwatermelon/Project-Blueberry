"use client";

import { useFormStatus } from "react-dom";
import { useFormState } from "react-dom";
import { registerUser } from "@/actions/auth";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl bg-[var(--org-primary)] px-4 py-3 font-medium text-white transition hover:opacity-90 disabled:opacity-60"
    >
      {pending ? "Создание…" : "Зарегистрироваться"}
    </button>
  );
}

export type OrgOption = { slug: string; name: string };

export function RegisterForm({ orgSlug, orgs }: { orgSlug: string; orgs: OrgOption[] }) {
  const [state, formAction] = useFormState(registerUser, undefined);
  const hasList = orgs.length > 0;
  const defaultSlug = orgs.some((o) => o.slug === orgSlug) ? orgSlug : (orgs[0]?.slug ?? orgSlug);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {hasList ? (
        <div>
          <label className="mb-1 block text-sm text-zinc-400">Вуз</label>
          <select
            name="orgSlug"
            defaultValue={defaultSlug}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-[var(--org-accent)]"
          >
            {orgs.map((o) => (
              <option key={o.slug} value={o.slug}>
                {o.name} ({o.slug})
              </option>
            ))}
          </select>
        </div>
      ) : (
        <input type="hidden" name="orgSlug" value={orgSlug} />
      )}
      <div>
        <label className="mb-1 block text-sm text-zinc-400">Имя</label>
        <input
          name="name"
          type="text"
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-[var(--org-accent)]"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm text-zinc-400">Email</label>
        <input
          name="email"
          type="email"
          required
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-[var(--org-accent)]"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm text-zinc-400">Пароль</label>
        <input
          name="password"
          type="password"
          required
          minLength={8}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-[var(--org-accent)]"
        />
      </div>
      {state?.error ? <p className="text-sm text-red-400">{state.error}</p> : null}
      <SubmitButton />
    </form>
  );
}
