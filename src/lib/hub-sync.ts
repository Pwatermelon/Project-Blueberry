import { prisma } from "@/lib/prisma";
import { normalizeEmail } from "@/lib/org-email-binding";
import { ensureFederatedProfile } from "@/lib/hub-registry";

export type HubTenantRef = {
  orgSlug: string;
  orgName: string;
  role: string;
};

export function getHubSyncSecret(): string | undefined {
  return process.env.HUB_SYNC_SECRET?.trim() || undefined;
}

export function isHubSyncAuthorized(secret: string | null): boolean {
  const expected = getHubSyncSecret();
  return Boolean(expected && secret === expected);
}

export async function upsertFederatedProfileWithTenants(input: {
  email: string;
  name?: string | null;
  avatarUrl?: string | null;
  tenants?: HubTenantRef[];
}) {
  const email = normalizeEmail(input.email);
  const tenants = input.tenants ?? [];

  return prisma.federatedProfile.upsert({
    where: { email },
    update: {
      name: input.name ?? undefined,
      avatarUrl: input.avatarUrl ?? undefined,
      tenants: tenants as object[],
    },
    create: {
      email,
      name: input.name ?? null,
      avatarUrl: input.avatarUrl ?? null,
      tenants: tenants as object[],
    },
  });
}

/** Tenant-инстанс: синхронизирует профиль на hub и сохраняет hubProfileId локально. */
export async function syncUserProfileToHub(userId: string): Promise<string | null> {
  const hubBase = process.env.HUB_BASE_URL?.replace(/\/$/, "");
  const secret = getHubSyncSecret();
  if (!hubBase || !secret) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      memberships: {
        include: {
          organization: { select: { slug: true, name: true, shortName: true } },
        },
      },
    },
  });
  if (!user) return null;

  const tenants: HubTenantRef[] = user.memberships.map((m) => ({
    orgSlug: m.organization.slug,
    orgName: m.organization.shortName || m.organization.name,
    role: m.role,
  }));

  try {
    const res = await fetch(`${hubBase}/api/hub/profiles/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-hub-sync-secret": secret,
      },
      body: JSON.stringify({
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        yandexId: user.yandexId,
        tenants,
      }),
      cache: "no-store",
    });
    if (!res.ok) return user.hubProfileId;

    const data = (await res.json()) as { profileId?: string };
    if (!data.profileId) return user.hubProfileId;

    await prisma.user.update({
      where: { id: userId },
      data: { hubProfileId: data.profileId },
    });
    return data.profileId;
  } catch {
    return user.hubProfileId;
  }
}

export async function ensureLocalHubProfile(userId: string, email: string, name?: string | null) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user?.hubProfileId) return user.hubProfileId;

  const memberships = await prisma.membership.findMany({
    where: { userId },
    include: { organization: { select: { slug: true, name: true, shortName: true } } },
  });

  const profile = await upsertFederatedProfileWithTenants({
    email,
    name: name ?? user?.name,
    avatarUrl: user?.avatarUrl,
    tenants: memberships.map((m) => ({
      orgSlug: m.organization.slug,
      orgName: m.organization.shortName || m.organization.name,
      role: m.role,
    })),
  });

  await prisma.user.update({
    where: { id: userId },
    data: { hubProfileId: profile.id },
  });
  return profile.id;
}

export async function postMessageToHub(input: {
  channelId: string;
  profileId: string;
  body: string;
  meta?: Record<string, unknown>;
}) {
  const body = input.body.trim();
  if (!body) return { error: "Пустое сообщение." as const };

  const channel = await prisma.federatedChannel.findUnique({
    where: { id: input.channelId },
  });
  if (!channel) return { error: "Канал не найден." as const };

  const profile = await prisma.federatedProfile.findUnique({
    where: { id: input.profileId },
  });
  if (!profile) return { error: "Профиль не найден." as const };

  await prisma.federatedMessage.create({
    data: {
      channelId: input.channelId,
      profileId: input.profileId,
      body,
      meta: (input.meta ?? {}) as object,
    },
  });

  return { ok: true as const };
}

export async function postMessageToRemoteHub(input: {
  hubBaseUrl: string;
  channelId: string;
  profileId: string;
  body: string;
  meta?: Record<string, unknown>;
}) {
  const secret = getHubSyncSecret();
  if (!secret) return { error: "HUB_SYNC_SECRET не настроен." as const };

  const res = await fetch(
    `${input.hubBaseUrl.replace(/\/$/, "")}/api/hub/channels/${input.channelId}/messages`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-hub-sync-secret": secret,
      },
      body: JSON.stringify({
        profileId: input.profileId,
        body: input.body,
        meta: input.meta,
      }),
      cache: "no-store",
    },
  );

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    return { error: err.error ?? "Не удалось отправить на hub." as const };
  }
  return { ok: true as const };
}
