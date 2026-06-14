import { prisma } from "@/lib/prisma";

/** Профиль на hub при входе через Яндекс ID (родительский портал). */
export async function ensureFederatedProfile(input: {
  email: string;
  name?: string | null;
  avatarUrl?: string | null;
}) {
  const email = input.email.toLowerCase().trim();
  return prisma.federatedProfile.upsert({
    where: { email },
    update: {
      name: input.name ?? undefined,
      avatarUrl: input.avatarUrl ?? undefined,
    },
    create: {
      email,
      name: input.name ?? null,
      avatarUrl: input.avatarUrl ?? null,
    },
  });
}

export async function listPublishedTenants() {
  return prisma.registeredTenant.findMany({
    where: { isPublished: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}

export async function listAllRegisteredTenants() {
  return prisma.registeredTenant.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}

export async function seedRegisteredTenantEntry(input: {
  slug: string;
  name: string;
  shortName?: string | null;
  siteUrl: string;
  logoUrl?: string | null;
  primaryColor?: string;
  accentColor?: string;
  description?: string;
}) {
  return prisma.registeredTenant.upsert({
    where: { slug: input.slug },
    update: {
      name: input.name,
      shortName: input.shortName,
      siteUrl: input.siteUrl,
      logoUrl: input.logoUrl,
      primaryColor: input.primaryColor,
      accentColor: input.accentColor,
      description: input.description,
    },
    create: {
      slug: input.slug,
      name: input.name,
      shortName: input.shortName,
      siteUrl: input.siteUrl,
      logoUrl: input.logoUrl,
      primaryColor: input.primaryColor ?? "#4f46e5",
      accentColor: input.accentColor ?? "#a855f7",
      description:
        input.description ??
        "Реплика на сервере вуза. Расписание, карты и участники — локально.",
      isPublished: true,
    },
  });
}
