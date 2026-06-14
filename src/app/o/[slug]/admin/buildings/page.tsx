import { BuildingsAdminPanel } from "@/components/buildings-admin-panel";
import { getOrgAdminContext } from "@/lib/org-permissions";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function AdminBuildingsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const ctx = await getOrgAdminContext(slug);
  if (!ctx) redirect(`/o/${slug}/dashboard`);

  const buildings = await prisma.campusBuilding.findMany({
    where: { organizationId: ctx.org.id },
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-white">Корпуса и карта</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Координаты и этажи отображаются на карте портала. JSON этажей — формат из tenant pack.
        </p>
      </div>
      <BuildingsAdminPanel slug={slug} buildings={buildings} />
    </div>
  );
}
