import Link from "next/link";
import type { PortalConfig } from "@/lib/portal-config";
import { isFeatureEnabled } from "@/lib/portal-config";

const tiles: Array<{
  key: keyof NonNullable<PortalConfig["featureFlags"]>;
  label: string;
  href: string;
  desc: string;
}> = [
  { key: "schedule", label: "Расписание", href: "schedule", desc: "Занятия вашей группы" },
  { key: "homework", label: "Домашки", href: "homework", desc: "Задания и дедлайны" },
  { key: "chats", label: "Чаты", href: "chats", desc: "Вуз и межвузовское общение" },
  { key: "news", label: "Новости", href: "news", desc: "Объявления вуза" },
  { key: "map", label: "Карта", href: "map", desc: "Корпуса и аудитории" },
  { key: "broadcasts", label: "Трансляции", href: "streams", desc: "Онлайн-эфиры" },
];

export function DashboardTiles({ slug, portalConfig }: { slug: string; portalConfig: PortalConfig }) {
  const visible = tiles.filter((t) => isFeatureEnabled(portalConfig, t.key));

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {visible.map((t) => (
        <Link
          key={t.key}
          href={`/o/${slug}/${t.href}`}
          className="portal-card group block p-5 transition hover:border-indigo-500/40"
        >
          <div className="h-1 w-8 rounded-full bg-[var(--org-accent)] opacity-80" />
          <h3 className="mt-4 font-semibold text-white group-hover:text-indigo-200">{t.label}</h3>
          <p className="mt-1 text-sm text-zinc-500">{t.desc}</p>
        </Link>
      ))}
    </div>
  );
}
