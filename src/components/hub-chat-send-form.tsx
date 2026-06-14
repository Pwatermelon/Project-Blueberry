"use client";

import { useRouter } from "next/navigation";
import { postFederatedChatMessage, postHubChatMessage } from "@/actions/hub-chat";

export function HubChatSendForm({
  channelId,
  redirectPath = "/hub/chats",
  federatedSlug,
}: {
  channelId: string;
  redirectPath?: string;
  /** Если задан — отправка с tenant-реплики на удалённый hub */
  federatedSlug?: string;
}) {
  const router = useRouter();

  return (
    <form
      action={async (fd) => {
        if (federatedSlug) {
          await postFederatedChatMessage(federatedSlug, fd);
        } else {
          await postHubChatMessage(fd);
        }
        router.refresh();
      }}
      className="flex gap-2 border-t border-white/5 pt-4"
    >
      <input type="hidden" name="channelId" value={channelId} />
      <input type="hidden" name="redirectPath" value={redirectPath} />
      <input
        name="body"
        placeholder="Написать сообщение…"
        required
        maxLength={4000}
        className="flex-1 rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-white"
      />
      <button
        type="submit"
        className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-400"
      >
        Отправить
      </button>
    </form>
  );
}
