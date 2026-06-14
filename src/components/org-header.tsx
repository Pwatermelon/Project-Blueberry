"use client";

import { signOutAction } from "@/actions/sign-out";

export function OrgHeader({
  orgName,
  userEmail,
}: {
  orgName: string;
  userEmail: string | null | undefined;
}) {
  return (
    <header className="flex items-center justify-between border-b border-white/10 px-6 py-4">
      <div>
        <p className="text-xs uppercase tracking-wider text-zinc-500">Портал</p>
        <h1 className="text-lg font-semibold text-white">{orgName}</h1>
      </div>
      <div className="flex items-center gap-3">
        <span className="max-w-[200px] truncate text-sm text-zinc-400">{userEmail}</span>
        <form action={signOutAction}>
          <button
            type="submit"
            className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-zinc-300 hover:bg-white/5"
          >
            Выйти
          </button>
        </form>
      </div>
    </header>
  );
}
