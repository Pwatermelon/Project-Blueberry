import { AutoRefresh } from "@/components/auto-refresh";
import { HubChatSendForm } from "@/components/hub-chat-send-form";
import Link from "next/link";
import { getHubBaseUrl } from "@/lib/deployment";
import { fetchHubChannels, fetchHubMessages } from "@/lib/hub-client";
import { getOrgBySlug } from "@/lib/org-context";
import { notFound } from "next/navigation";

export default async function FederatedChatsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ channel?: string }>;
}) {
  const { slug } = await params;
  const { channel: channelId } = await searchParams;
  const ctx = await getOrgBySlug(slug);
  if (!ctx) notFound();

  const hubUrl =
    getHubBaseUrl(ctx.organization.hubBaseUrl) ||
    (process.env.NODE_ENV === "development" ? "http://localhost:3000" : undefined);

  const channels = hubUrl ? await fetchHubChannels(hubUrl) : [];
  const activeId = channelId ?? channels[0]?.id;
  const messages =
    hubUrl && activeId ? await fetchHubMessages(hubUrl, activeId) : [];

  return (
    <div className="space-y-6">
      <AutoRefresh intervalMs={8000} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold text-white">Межвузовские чаты</h2>
        <Link
          href={`/o/${slug}/chats`}
          className="text-sm text-[var(--org-accent)] hover:underline"
        >
          ← Чаты вуза
        </Link>
      </div>
      <p className="text-sm text-zinc-400">
        Общие каналы на hub-сервере. Студенты разных вузов могут общаться здесь, даже если порталы
        развёрнуты на разных доменах.
      </p>

      {!hubUrl ? (
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          Hub не настроен. Укажите <code className="text-amber-200">HUB_BASE_URL</code> в окружении
          или <code className="text-amber-200">hubBaseUrl</code> у организации.
        </p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
          <aside className="space-y-1 rounded-2xl border border-white/10 bg-white/[0.03] p-2">
            {channels.map((c) => (
              <Link
                key={c.id}
                href={`/o/${slug}/chats/federated?channel=${c.id}`}
                className={`block rounded-xl px-3 py-2 text-sm transition ${
                  c.id === activeId
                    ? "bg-[var(--org-primary)]/20 text-white"
                    : "text-zinc-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                {c.name}
              </Link>
            ))}
          </aside>
          <div className="flex min-h-[360px] flex-col rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <div className="flex-1 space-y-3 overflow-y-auto">
              {messages.length === 0 ? (
                <p className="text-sm text-zinc-500">Пока нет сообщений в канале.</p>
              ) : (
                messages.map((m) => (
                  <div key={m.id} className="text-sm">
                    <span className="font-medium text-[var(--org-accent)]">
                      {m.profile.name || m.profile.email}
                    </span>
                    <span className="text-zinc-500">
                      {" "}
                      · {new Date(m.createdAt).toLocaleString("ru-RU")}
                    </span>
                    <p className="mt-1 text-zinc-200">{m.body}</p>
                  </div>
                ))
              )}
            </div>
            {activeId ? <HubChatSendForm channelId={activeId} federatedSlug={slug} /> : null}
          </div>
        </div>
      )}
    </div>
  );
}
