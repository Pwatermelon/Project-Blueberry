/**
 * Клиент hub-сервера (межвузовские чаты). Tenant дергает hub по HUB_BASE_URL.
 */

export type HubChannel = {
  id: string;
  name: string;
  description?: string | null;
};

export type HubMessage = {
  id: string;
  body: string;
  createdAt: string;
  profile: { id: string; name: string | null; email: string };
  meta?: Record<string, unknown>;
};

function hubUrl(base: string, path: string): string {
  return `${base.replace(/\/$/, "")}/api/hub${path}`;
}

export async function fetchHubChannels(baseUrl: string): Promise<HubChannel[]> {
  const res = await fetch(hubUrl(baseUrl, "/channels"), {
    next: { revalidate: 30 },
  });
  if (!res.ok) return [];
  return res.json() as Promise<HubChannel[]>;
}

export async function fetchHubMessages(
  baseUrl: string,
  channelId: string,
): Promise<HubMessage[]> {
  const res = await fetch(hubUrl(baseUrl, `/channels/${channelId}/messages`), {
    next: { revalidate: 0 },
  });
  if (!res.ok) return [];
  return res.json() as Promise<HubMessage[]>;
}
