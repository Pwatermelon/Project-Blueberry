import Link from "next/link";
import { auth } from "@/auth";
import { signOutAction } from "@/actions/sign-out";
import { isHubRootAdminEmail } from "@/lib/hub-root";

export default async function HubLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const isRoot = session?.user?.email ? isHubRootAdminEmail(session.user.email) : false;

  return (
    <div className="portal-shell min-h-screen text-zinc-100">
      <header className="border-b border-white/5 bg-black/20">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-lg font-bold text-white">
              Цифровой ВУЗ
            </Link>
            <nav className="hidden items-center gap-4 text-sm sm:flex">
              <Link href="/hub/chats" className="text-zinc-400 hover:text-white">
                Общение
              </Link>
              {isRoot ? (
                <Link href="/hub/admin/tenants" className="text-zinc-400 hover:text-white">
                  Реестр вузов
                </Link>
              ) : null}
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            {session?.user ? (
              <>
                <span className="hidden text-zinc-500 sm:inline">{session.user.email}</span>
                <form action={signOutAction}>
                  <button
                    type="submit"
                    className="rounded-lg border border-white/10 px-3 py-1.5 text-zinc-300 hover:bg-white/5"
                  >
                    Выйти
                  </button>
                </form>
              </>
            ) : (
              <Link
                href="/login"
                className="rounded-lg bg-indigo-500 px-4 py-2 font-medium text-white hover:bg-indigo-400"
              >
                Войти
              </Link>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}
