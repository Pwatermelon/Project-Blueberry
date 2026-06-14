import { auth } from "@/auth";
import { createNewsPost } from "@/actions/news";
import { getOrgBySlug } from "@/lib/org-context";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function NewsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth();
  const ctx = await getOrgBySlug(slug);
  if (!ctx) notFound();

  const member = await prisma.membership.findFirst({
    where: { userId: session!.user!.id, organizationId: ctx.organization.id },
  });

  const posts = await prisma.newsPost.findMany({
    where: { organizationId: ctx.organization.id },
    orderBy: { publishedAt: "desc" },
    take: 30,
  });

  const isAdmin = member?.role === "ADMIN";

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-white">Новости вуза</h2>

      {isAdmin ? (
        <form
          action={createNewsPost.bind(null, slug)}
          className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4"
        >
          <input
            name="title"
            placeholder="Заголовок"
            required
            className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-white"
          />
          <textarea
            name="body"
            placeholder="Текст новости"
            required
            rows={5}
            className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-white"
          />
          <button type="submit" className="rounded-xl bg-[var(--org-primary)] px-4 py-2 text-sm text-white">
            Опубликовать
          </button>
        </form>
      ) : null}

      <ul className="space-y-4">
        {posts.map((p) => (
          <li key={p.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <p className="text-lg font-medium text-white">{p.title}</p>
            <p className="mt-2 whitespace-pre-wrap text-zinc-300">{p.body}</p>
            <p className="mt-2 text-xs text-zinc-500">{p.publishedAt.toLocaleString("ru-RU")}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
