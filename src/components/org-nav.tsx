"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { PortalConfig } from "@/lib/portal-config";
import { isFeatureEnabled } from "@/lib/portal-config";

const items = [
  { href: "dashboard", label: "Главная", key: null as keyof NonNullable<PortalConfig["featureFlags"]> | null },
  { href: "schedule", label: "Расписание", key: "schedule" as const },
  { href: "homework", label: "Домашки", key: "homework" as const },
  { href: "chats", label: "Чаты", key: "chats" as const },
  { href: "news", label: "Новости", key: "news" as const },
  { href: "map", label: "Карта", key: "map" as const },
  { href: "streams", label: "Трансляции", key: "broadcasts" as const },
] as const;

export function OrgNav({
  slug,
  portalConfig,
  isAdmin,
}: {
  slug: string;
  portalConfig: PortalConfig;
  isAdmin: boolean;
}) {
  const pathname = usePathname();
  const base = `/o/${slug}`;

  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        if (item.key && !isFeatureEnabled(portalConfig, item.key)) return null;
        const href = `${base}/${item.href}`;
        const active = pathname === href || (item.href !== "dashboard" && pathname.startsWith(href));
        return (
          <Link
            key={item.href}
            href={href}
            className="portal-nav-link"
            data-active={active ? "true" : undefined}
          >
            {item.label}
          </Link>
        );
      })}
      {isAdmin ? (
        <>
          <Link
            href={`${base}/admin/schedule`}
            className="portal-nav-link"
            data-active={pathname.includes("/admin/schedule") ? "true" : undefined}
          >
            Расписание
          </Link>
          <Link
            href={`${base}/admin/groups`}
            className="portal-nav-link"
            data-active={pathname.includes("/admin/groups") ? "true" : undefined}
          >
            Группы
          </Link>
          <Link
            href={`${base}/admin/buildings`}
            className="portal-nav-link"
            data-active={pathname.includes("/admin/buildings") ? "true" : undefined}
          >
            Корпуса
          </Link>
          <Link
            href={`${base}/admin/members`}
            className="portal-nav-link mt-2"
            data-active={pathname.includes("/admin/members") ? "true" : undefined}
          >
            Участники
          </Link>
          <Link
            href={`${base}/admin/settings`}
            className="portal-nav-link"
            data-active={pathname.includes("/admin/settings") ? "true" : undefined}
          >
            Настройки вуза
          </Link>
        </>
      ) : null}
    </nav>
  );
}
