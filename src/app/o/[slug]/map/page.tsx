import { getOrgBySlug } from "@/lib/org-context";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function MapPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ctx = await getOrgBySlug(slug);
  if (!ctx) notFound();

  const buildings = await prisma.campusBuilding.findMany({
    where: { organizationId: ctx.organization.id },
    orderBy: { name: "asc" },
  });

  const center = ctx.portalConfig.mapDefaultCenter;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-white">Карта кампуса</h2>
      <p className="text-sm text-zinc-500">
        Координаты и подписи настраиваются администратором (единый формат конфигурации портала).
      </p>

      {center ? (
        <div className="aspect-video w-full overflow-hidden rounded-2xl border border-white/10">
          <iframe
            title="Карта"
            className="h-full w-full"
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${center.lng - 0.02}%2C${center.lat - 0.02}%2C${center.lng + 0.02}%2C${center.lat + 0.02}&layer=mapnik&marker=${center.lat}%2C${center.lng}`}
          />
        </div>
      ) : (
        <p className="text-zinc-500">Центр карты не задан в portalConfig — добавьте mapDefaultCenter в настройках (JSON).</p>
      )}

      <ul className="space-y-3">
        {buildings.map((b) => {
          const floors = Array.isArray(b.floors) ? (b.floors as { level: number; label: string; rooms?: { code: string; name: string }[] }[]) : [];
          return (
            <li key={b.id} className="portal-card px-4 py-3">
              <p className="font-medium text-white">{b.name}</p>
              {b.address ? <p className="text-sm text-zinc-400">{b.address}</p> : null}
              {b.description ? <p className="mt-1 text-sm text-zinc-500">{b.description}</p> : null}
              {floors.length > 0 ? (
                <div className="mt-3 space-y-2 border-t border-white/5 pt-3">
                  {floors.map((f) => (
                    <div key={f.level}>
                      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                        {f.label}
                      </p>
                      {f.rooms?.length ? (
                        <p className="mt-1 text-sm text-zinc-400">
                          {f.rooms.map((r) => r.code).join(", ")}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : null}
              <a
                href={`https://www.openstreetmap.org/?mlat=${b.lat}&mlon=${b.lng}#map=18/${b.lat}/${b.lng}`}
                className="mt-2 inline-block text-sm text-[var(--org-accent)]"
                target="_blank"
                rel="noreferrer"
              >
                Открыть на карте
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
