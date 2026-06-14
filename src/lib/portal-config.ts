/**
 * Единая схема portalConfig (JSON в Organization) для всех ВУЗов.
 * Неиспользуемые поля можно опустить — действуют значения по умолчанию.
 */
export type PortalConfig = {
  welcomeBanner?: string;
  scheduleHelpUrl?: string;
  mapDefaultCenter?: { lat: number; lng: number; zoom?: number };
  /** Если false — раздел скрыт в навигации */
  featureFlags?: Partial<{
    schedule: boolean;
    homework: boolean;
    chats: boolean;
    map: boolean;
    news: boolean;
    broadcasts: boolean;
  }>;
};

export function mergePortalConfig(raw: unknown): PortalConfig {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return raw as PortalConfig;
  }
  return {};
}

export function isFeatureEnabled(
  cfg: PortalConfig,
  key: keyof NonNullable<PortalConfig["featureFlags"]>,
): boolean {
  const v = cfg.featureFlags?.[key];
  return v !== false;
}
