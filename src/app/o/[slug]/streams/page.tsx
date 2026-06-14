import { getOrgBySlug } from "@/lib/org-context";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function StreamsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ctx = await getOrgBySlug(slug);
  if (!ctx) notFound();

  const streams = await prisma.broadcast.findMany({
    where: { organizationId: ctx.organization.id },
    orderBy: { startsAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-white">Трансляции мероприятий</h2>
      <p className="text-sm text-zinc-500">Потоки добавляются администратором (ссылка на YouTube, VK Video и т.д.).</p>

      <ul className="space-y-8">
        {streams.map((s) => (
          <li key={s.id} className="space-y-3">
            <div>
              <p className="text-lg font-medium text-white">{s.title}</p>
              {s.description ? <p className="text-sm text-zinc-400">{s.description}</p> : null}
              {s.startsAt ? (
                <p className="text-xs text-zinc-500">{s.startsAt.toLocaleString("ru-RU")}</p>
              ) : null}
            </div>
            <div className="aspect-video w-full overflow-hidden rounded-xl border border-white/10">
              <iframe
                title={s.title}
                src={s.streamUrl}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
