import Link from "next/link";
import { AutoRefresh } from "@/components/auto-refresh";
import { ChatSendForm } from "@/components/chat-send-form";
import { getOrgBySlug } from "@/lib/org-context";
import { prisma } from "@/lib/prisma";
import { isFeatureEnabled } from "@/lib/portal-config";
import { notFound } from "next/navigation";

export default async function ChatsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ room?: string }>;
}) {
  const { slug } = await params;
  const { room: roomIdParam } = await searchParams;
  const ctx = await getOrgBySlug(slug);
  if (!ctx) notFound();

  const rooms = await prisma.chatRoom.findMany({
    where: { organizationId: ctx.organization.id, scope: "local" },
    orderBy: { name: "asc" },
  });

  const activeRoom = rooms.find((r) => r.id === roomIdParam) ?? rooms[0];
  const messages = activeRoom
    ? await prisma.message.findMany({
        where: { roomId: activeRoom.id },
        orderBy: { createdAt: "asc" },
        take: 80,
        include: { user: { select: { name: true, email: true } } },
      })
    : [];

  const showFederated = isFeatureEnabled(ctx.portalConfig, "chats");

  return (
    <div className="space-y-6">
      <AutoRefresh intervalMs={8000} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold text-white">Чаты</h2>
        {showFederated ? (
          <Link
            href={`/o/${slug}/chats/federated`}
            className="rounded-xl border border-[var(--org-accent)]/40 bg-[var(--org-accent)]/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--org-accent)]/20"
          >
            Межвузовские чаты →
          </Link>
        ) : null}
      </div>

      {rooms.length === 0 ? (
        <p className="text-zinc-500">Пока нет комнат — создайте через сид или админку.</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[200px_1fr]">
          <aside className="space-y-1 rounded-2xl border border-white/10 bg-white/[0.03] p-2">
            {rooms.map((r) => (
              <Link
                key={r.id}
                href={`/o/${slug}/chats?room=${r.id}`}
                className={`block rounded-xl px-3 py-2 text-sm transition ${
                  r.id === activeRoom?.id
                    ? "bg-[var(--org-primary)]/20 text-white"
                    : "text-zinc-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                {r.name}
              </Link>
            ))}
          </aside>
          <div className="portal-card flex flex-col gap-4 p-4">
            <p className="text-sm text-zinc-400">{activeRoom?.name}</p>
            <div className="max-h-[420px] space-y-3 overflow-y-auto rounded-xl bg-black/30 p-4">
              {messages.map((m) => (
                <div key={m.id} className="text-sm">
                  <span className="font-medium text-[var(--org-accent)]">
                    {m.user.name || m.user.email}
                  </span>
                  <span className="text-zinc-500"> · {m.createdAt.toLocaleTimeString("ru-RU")}</span>
                  <p className="mt-1 text-zinc-200">{m.body}</p>
                </div>
              ))}
            </div>
            {activeRoom ? <ChatSendForm slug={slug} roomId={activeRoom.id} /> : null}
          </div>
        </div>
      )}
    </div>
  );
}
