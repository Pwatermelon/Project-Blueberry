import { auth } from "@/auth";
import { createHomework } from "@/actions/campus-app";
import { getOrgBySlug } from "@/lib/org-context";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function HomeworkPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth();
  const ctx = await getOrgBySlug(slug);
  if (!ctx) notFound();

  const member = await prisma.membership.findFirst({
    where: { userId: session!.user!.id, organizationId: ctx.organization.id },
  });

  const list = await prisma.homework.findMany({
    where: { organizationId: ctx.organization.id },
    orderBy: { createdAt: "desc" },
    take: 40,
    include: { author: { select: { name: true, email: true } } },
  });

  const canPost = member && ["TEACHER", "ADMIN", "STAFF"].includes(member.role);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-white">Домашние задания</h2>

      {canPost ? (
        <form
          action={createHomework.bind(null, slug)}
          className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4"
        >
          <input
            name="title"
            placeholder="Тема"
            required
            className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-white"
          />
          <textarea
            name="body"
            placeholder="Описание, ссылки, дедлайн в тексте"
            required
            rows={4}
            className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-white"
          />
          <input type="datetime-local" name="dueAt" className="rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-white" />
          <button type="submit" className="rounded-xl bg-[var(--org-primary)] px-4 py-2 text-sm font-medium text-white">
            Опубликовать
          </button>
        </form>
      ) : null}

      <ul className="space-y-3">
        {list.map((h) => (
          <li key={h.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <p className="font-medium text-white">{h.title}</p>
            <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-300">{h.body}</p>
            <p className="mt-2 text-xs text-zinc-500">
              {h.author.name || h.author.email}
              {h.dueAt ? ` · до ${h.dueAt.toLocaleString("ru-RU")}` : ""}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
