import fs from "node:fs";
import path from "node:path";
import type { PortalConfig } from "@/lib/portal-config";

export type TenantScheduleAdapter = "sstu-rasp" | "legacy-txt" | "json-import";

export type TenantPack = {
  slug: string;
  name: string;
  shortName?: string;
  branding?: { primaryColor?: string; accentColor?: string };
  schedule?: {
    adapter?: TenantScheduleAdapter;
    legacyTxtPath?: string;
    groupsCatalog?: string;
    defaultGroupExternalKey?: string;
    defaultGroupName?: string;
  };
  map?: {
    defaultCenter?: { lat: number; lng: number; zoom?: number };
    buildingsFile?: string;
    provider?: string;
  };
  features?: Partial<{
    schedule: boolean;
    homework: boolean;
    chats: boolean;
    federatedChats: boolean;
    map: boolean;
    news: boolean;
    broadcasts: boolean;
  }>;
  welcomeBanner?: string;
};

export type TenantBuildingFloor = {
  level: number;
  label: string;
  planImageUrl?: string;
  rooms?: { code: string; name: string; lat?: number; lng?: number }[];
};

export type TenantBuilding = {
  name: string;
  address?: string;
  lat: number;
  lng: number;
  description?: string;
  floors?: TenantBuildingFloor[];
};

const TENANTS_ROOT = path.join(process.cwd(), "tenants");

export function tenantPackDir(slug: string): string {
  return path.join(TENANTS_ROOT, slug);
}

export function loadTenantPack(slug: string): TenantPack | null {
  const file = path.join(tenantPackDir(slug), "tenant.json");
  if (!fs.existsSync(file)) return null;
  const raw = JSON.parse(fs.readFileSync(file, "utf-8")) as TenantPack;
  return { ...raw, slug: raw.slug || slug };
}

export function loadTenantBuildings(slug: string): TenantBuilding[] {
  const pack = loadTenantPack(slug);
  const rel = pack?.map?.buildingsFile ?? "data/buildings.json";
  const file = path.join(tenantPackDir(slug), rel);
  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file, "utf-8")) as TenantBuilding[];
}

export function tenantPackToPortalConfig(pack: TenantPack): PortalConfig {
  return {
    welcomeBanner: pack.welcomeBanner,
    mapDefaultCenter: pack.map?.defaultCenter,
    featureFlags: {
      schedule: pack.features?.schedule,
      homework: pack.features?.homework,
      chats: pack.features?.chats,
      map: pack.features?.map,
      news: pack.features?.news,
      broadcasts: pack.features?.broadcasts,
    },
  };
}

export function resolveTenantDataPath(slug: string, relativePath: string): string {
  return path.join(tenantPackDir(slug), relativePath);
}
