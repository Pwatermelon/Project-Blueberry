import Link from "next/link";
import { AutoRefresh } from "@/components/auto-refresh";
import { HubChatSendForm } from "@/components/hub-chat-send-form";
import { auth } from "@/auth";
import { getPublicSiteUrl } from "@/lib/deployment";
import { fetchHubChannels, fetchHubMessages } from "@/lib/hub-client";
import { redirect } from "next/navigation";

export default async function HubChatsPage({
  searchParams,
}: {
  searchParams: Promise<{ channel?: string }>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?redirectTo=/hub/chats");
  }

  const { channel: channelId } = await searchParams;
  const hubUrl = getPublicSiteUrl() || "http://localhost:3000";

  const channels = await fetchHubChannels(hubUrl);
  const activeId = channelId ?? channels[0]?.id;
  const messages = activeId ? await fetchHubMessages(hubUrl, activeId) : [];

  return (
    <div className="space-y-6">
      <AutoRefresh intervalMs={8000} />
      <div>
        <h1 className="text-3xl font-bold text-white">Межвузовское общение</h1>
        <p className="mt-2 text-zinc-400">
          Общие каналы на родительском портале. Студенты разных вузов общаются здесь, даже если
          их порталы на разных доменах.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
        <aside className="space-y-1 rounded-2xl border border-white/10 bg-white/[0.03] p-2">
          {channels.map((c) => (
            <Link
              key={c.id}
              href={`/hub/chats?channel=${c.id}`}
              className={`block rounded-xl px-3 py-2 text-sm transition ${
                c.id === activeId
                  ? "bg-indigo-500/20 text-white"
                  : "text-zinc-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              {c.name}
            </Link>
          ))}
        </aside>
        <div className="flex min-h-[400px] flex-col rounded-2xl border border-white/10 bg-white/[0.02] p-4">
          <div className="flex-1 space-y-3 overflow-y-auto">
            {messages.length === 0 ? (
              <p className="text-sm text-zinc-500">Пока нет сообщений.</p>
            ) : (
              messages.map((m) => (
                <div key={m.id} className="text-sm">
                  <span className="font-medium text-indigo-300">
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
          {activeId ? (
            <HubChatSendForm
              channelId={activeId}
              redirectPath={`/hub/chats?channel=${activeId}`}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
