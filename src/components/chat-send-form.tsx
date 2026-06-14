"use client";

import { useRouter } from "next/navigation";
import { postChatMessage } from "@/actions/campus-app";

export function ChatSendForm({ slug, roomId }: { slug: string; roomId: string }) {
  const router = useRouter();

  return (
    <form
      action={async (fd) => {
        await postChatMessage(slug, fd);
        router.refresh();
      }}
      className="flex gap-2"
    >
      <input type="hidden" name="roomId" value={roomId} />
      <input
        name="body"
        placeholder="Сообщение…"
        required
        className="flex-1 rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-white"
      />
      <button type="submit" className="rounded-xl bg-[var(--org-primary)] px-4 py-2 text-sm text-white">
        Отправить
      </button>
    </form>
  );
}
