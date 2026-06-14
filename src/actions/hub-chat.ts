"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { getDeploymentMode, getHubBaseUrl, isHubDeploy } from "@/lib/deployment";
import {
  ensureLocalHubProfile,
  postMessageToHub,
  postMessageToRemoteHub,
  syncUserProfileToHub,
} from "@/lib/hub-sync";
import { getOrgBySlug } from "@/lib/org-context";
import { prisma } from "@/lib/prisma";

export async function postHubChatMessage(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) return;

  const channelId = String(formData.get("channelId") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const redirectPath = String(formData.get("redirectPath") ?? "/hub/chats");
  if (!channelId || !body) return;

  const profileId = await ensureLocalHubProfile(
    session.user.id,
    session.user.email,
    session.user.name,
  );

  await postMessageToHub({
    channelId,
    profileId,
    body,
  });

  revalidatePath(redirectPath);
}

export async function postFederatedChatMessage(slug: string, formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;

  const channelId = String(formData.get("channelId") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!channelId || !body) return;

  const ctx = await getOrgBySlug(slug);
  if (!ctx) return;

  let profileId = (
    await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { hubProfileId: true },
    })
  )?.hubProfileId;

  if (!profileId) {
    profileId = await syncUserProfileToHub(session.user.id);
  }

  if (!profileId) return;

  const hubUrl = getHubBaseUrl(ctx.organization.hubBaseUrl);
  const meta = {
    orgSlug: ctx.organization.slug,
    orgName: ctx.organization.shortName || ctx.organization.name,
  };

  if (isHubDeploy() || getDeploymentMode() === "all") {
    await postMessageToHub({ channelId, profileId, body, meta });
  } else if (hubUrl) {
    await postMessageToRemoteHub({ hubBaseUrl: hubUrl, channelId, profileId, body, meta });
  }

  revalidatePath(`/o/${slug}/chats/federated`);
}
